import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Create client to verify user token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create service role client for database queries to bypass RLS
    const serviceSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user's first receipt to determine streak starting point
    const { data: firstReceiptResult } = await serviceSupabase
      .from('member_receipts')
      .select('receipt_date')
      .eq('user_id', user.id)
      .order('receipt_date', { ascending: true })
      .limit(1);

    const firstReceiptDate = firstReceiptResult?.[0]?.receipt_date;
    console.log('🎯 First receipt date:', firstReceiptDate);

    // If user has no receipts, use current week as starting point
    const streakStartDate = firstReceiptDate || getCurrentWeekStart();
    const streakStartWeek = getMonday(new Date(streakStartDate)).toISOString().split('T')[0];
    
    console.log('🎯 Streak starting week:', streakStartWeek);

    // Get current week boundaries
    const { data: currentWeekBoundaries } = await serviceSupabase.rpc('get_current_week_boundaries');

    // Fetch all streak data in parallel using service role client
    const [
      memberStreaksResult,
      streakWeeksResult,
      streakSetsResult,
      activeRewardsResult,
      badgesResult,
      gracePeriods,
      usedGracePeriods, // NEW: Get used grace periods for calendar display
      recentReceipts
    ] = await Promise.all([
      // Member streaks summary
      serviceSupabase
        .from('member_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single(),

      // Streak weeks (all weeks since user's first receipt)
      serviceSupabase
        .from('streak_weeks')
        .select('*')
        .eq('user_id', user.id)
        .gte('week_start_date', firstReceiptDate ? streakStartWeek : getDateMinusWeeks(new Date(), 12))
        .order('week_start_date', { ascending: true }),

      // Current and recent streak sets
      serviceSupabase
        .from('streak_sets')
        .select('*')
        .eq('user_id', user.id)
        .order('set_number', { ascending: false })
        .limit(5),

      // Active rewards
      serviceSupabase
        .from('streak_rewards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('reward_tier', { ascending: false }),

      // Recent badges (last 10)
      serviceSupabase
        .from('streak_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_date', { ascending: false })
        .limit(10),

      // Available grace periods - include ALL unexpired grace weeks (not just future ones)
      serviceSupabase
        .from('streak_grace_periods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_used', false)
        .gt('expires_date', new Date().toISOString()),

      // Used grace periods for calendar display
      serviceSupabase
        .from('streak_grace_periods')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_used', true),

      // Recent receipts for context - get ALL receipts, don't filter by date
      serviceSupabase
        .from('member_receipts')
        .select('id, receipt_date, total_amount, venue_location')
        .eq('user_id', user.id)
        .order('receipt_date', { ascending: false })
        .limit(50)
    ]);

    const memberStreaks = memberStreaksResult.data;
    const streakWeeks = streakWeeksResult.data || [];
    const streakSets = streakSetsResult.data || [];
    const activeRewards = activeRewardsResult.data || [];
    const badges = badgesResult.data || [];
    let availableGrace = gracePeriods.data || [];
    const usedGrace = usedGracePeriods.data || []; // NEW: Extract used grace periods
    const receipts = recentReceipts.data || [];

    // Stop auto-creating grace weeks to prevent replenishment after use

    // Calculate current week progress with unique receipt days
    const currentWeekStartDate = currentWeekBoundaries?.[0]?.week_start;
    const currentWeekEndDate = currentWeekBoundaries?.[0]?.week_end;
    
    // Get unique receipt days for current week from actual receipts
    const currentWeekReceipts = receipts.filter(r => {
      const receiptDate = r.receipt_date;
      return receiptDate >= currentWeekStartDate && receiptDate <= currentWeekEndDate;
    });
    
    // Count unique days, not total receipts
    const uniqueReceiptDays = new Set(currentWeekReceipts.map(r => r.receipt_date)).size;
    const isCurrentWeekComplete = uniqueReceiptDays >= 2;
    
    const currentWeek = streakWeeks.find(w => 
      w.week_start_date === currentWeekStartDate
    );

    console.log('📊 Current week boundaries:', currentWeekBoundaries);
    console.log('📊 Current week receipts:', currentWeekReceipts.map(r => r.receipt_date));
    console.log('📊 Unique receipt days this week:', uniqueReceiptDays);
    console.log('📊 Is current week complete:', isCurrentWeekComplete);

    // Calculate current set progress
    const currentSet = streakSets.find(s => !s.is_complete);

    // Calculate total available discount
    const totalDiscount = activeRewards.reduce((sum, r) => sum + (r.reward_tier * 25), 0);

    // Check for make-up opportunities
    const makeupOpportunity = await checkMakeupOpportunity(serviceSupabase, user.id, streakWeeks);

    // Generate calendar data starting from user's first receipt week
    const calendarWeeks = generateCalendarWeeks(streakWeeks, currentWeekBoundaries, receipts, firstReceiptDate ? streakStartWeek : null, usedGrace);

    // Calculate streak statistics
    const stats = calculateStreakStats(streakWeeks, streakSets, activeRewards);

    const dashboardData = {
      user_id: user.id,
      current_week: {
        week_start: currentWeekStartDate,
        week_end: currentWeekBoundaries?.[0]?.week_end,
        receipts_count: uniqueReceiptDays,
        receipts_needed: Math.max(0, 2 - uniqueReceiptDays),
        is_complete: isCurrentWeekComplete,
        is_current: true
      },
      current_set: currentSet ? {
        set_number: currentSet.set_number,
        weeks_completed: currentSet.completed_weeks,
        weeks_remaining: 4 - currentSet.completed_weeks,
        start_date: currentSet.start_week_date,
        progress_percentage: (currentSet.completed_weeks / 4) * 100,
        is_complete: false
      } : null,
      rewards: {
        available_discount: totalDiscount,
        active_rewards: activeRewards.map(r => ({
          id: r.id,
          tier: r.reward_tier,
          discount_percentage: r.reward_tier * 25,
          earned_date: r.earned_date,
          expires_date: r.expires_date
        })),
        next_reward_at: totalDiscount < 100 ? `${totalDiscount + 25}%` : null
      },
      calendar_weeks: calendarWeeks,
      statistics: stats,
      badges: badges.map(b => ({
        type: b.badge_type,
        name: b.badge_name,
        description: b.badge_description,
        icon: b.badge_icon,
        earned_date: b.earned_date,
        milestone_value: b.milestone_value
      })),
      opportunities: {
        makeup_available: makeupOpportunity.available,
        makeup_details: makeupOpportunity.details,
        grace_weeks_available: availableGrace.length,
        grace_details: availableGrace.map(g => ({
          type: g.grace_type,
          week_start: g.week_start_date,
          expires: g.expires_date,
          can_apply_retrospectively: true // Allow retrospective application
        }))
      },
      recent_activity: receipts.map(r => ({
        id: r.id,
        date: r.receipt_date,
        amount: r.total_amount,
        venue: r.venue_location || 'Unknown Venue'
      })),
      notifications: generateNotifications({
        receipts_count: uniqueReceiptDays,
        is_complete: isCurrentWeekComplete
      }, currentSet, makeupOpportunity, activeRewards)
    };

    return new Response(JSON.stringify(dashboardData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in get-streak-dashboard:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateCalendarWeeks(streakWeeks: any[], currentWeekBoundaries: any, receipts: any[] = [], userStartWeek: string | null = null, usedGrace: any[] = []) {
  const weeks = [];
  
  // Use user's start week if available, otherwise use 16 weeks ago as fallback
  const startDate = userStartWeek ? new Date(userStartWeek) : getDateMinusWeeks(new Date(), 16);
  const currentWeekStartDate = currentWeekBoundaries?.[0]?.week_start;
  
  // Calculate number of weeks to generate based on start date
  const weeksToGenerate = userStartWeek 
    ? Math.ceil((new Date(currentWeekStartDate).getTime() - new Date(userStartWeek).getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1
    : 16;
    
  console.log(`📅 Generating ${weeksToGenerate} weeks starting from ${startDate.toISOString().split('T')[0]}`);
  
  for (let i = 0; i < weeksToGenerate; i++) {
    const weekStart = getDatePlusWeeks(startDate.toISOString().split('T')[0], i);
    const weekEnd = getDatePlusWeeks(weekStart, 0, 6); // Add 6 days
    
    // Find matching week data by comparing week_start_date from database
    const weekData = streakWeeks.find(w => w.week_start_date === weekStart);
    const isCurrent = weekStart === currentWeekStartDate;
    const isFuture = new Date(weekStart) > new Date();
    
    // Check if this week is protected by a grace period
    const graceProtection = usedGrace.find(g => g.week_applied_to === weekStart);
    const isProtectedByGrace = !!graceProtection;
    
    // Calculate unique receipt days for this week from actual receipt data
    const weekReceipts = receipts.filter(r => {
      const receiptDate = r.receipt_date;
      return receiptDate >= weekStart && receiptDate <= weekEnd;
    });
    const uniqueReceiptDays = new Set(weekReceipts.map(r => r.receipt_date)).size;
    
    // A week is complete if it has 2+ unique receipt days OR is protected by grace
    const weekComplete = uniqueReceiptDays >= 2 || isProtectedByGrace;
    
    console.log(`📅 Week ${weekStart}: weekData=${!!weekData}, complete=${weekComplete}, unique_days=${uniqueReceiptDays}, graced=${isProtectedByGrace}`);
    
    weeks.push({
      week_start: weekStart,
      week_end: weekEnd,
      receipts_count: uniqueReceiptDays,
      is_complete: weekComplete,
      is_current: isCurrent,
      is_future: isFuture,
      completed_at: weekData?.completed_at || (isProtectedByGrace ? graceProtection.used_date : null),
      protected_by_grace: isProtectedByGrace,
      grace_applied_date: isProtectedByGrace ? graceProtection.used_date : null
    });
  }
  
  console.log('📅 Generated calendar weeks with grace protection:', weeks.filter(w => w.receipts_count > 0 || w.is_complete));
  return weeks;
}

async function checkMakeupOpportunity(supabase: any, userId: string, streakWeeks: any[]) {
  // Check if user has a broken streak that can be made up
  const lastWeek = getDateMinusWeeks(new Date(), 1);
  const lastWeekData = streakWeeks.find(w => w.week_start_date === lastWeek);
  
  if (lastWeekData && !lastWeekData.is_complete) {
    // Check if current week has potential for makeup (3 receipts)
    const currentWeek = streakWeeks.find(w => w.week_start_date === getCurrentWeekStart());
    const currentReceipts = currentWeek?.receipt_count || 0;
    
    return {
      available: currentReceipts === 0, // Only if no receipts this week yet
      details: {
        broken_week: lastWeek,
        receipts_needed: 3,
        deadline: getCurrentWeekEnd()
      }
    };
  }
  
  return { available: false, details: null };
}

function calculateStreakStats(streakWeeks: any[], streakSets: any[], activeRewards: any[]) {
  const completedWeeks = streakWeeks.filter(w => w.is_complete).length;
  const completedSets = streakSets.filter(s => s.is_complete).length;
  const totalRewardsClaimed = streakSets.filter(s => s.is_complete).length;
  
  // Calculate longest consecutive weeks
  let longestStreak = 0;
  let currentStreak = 0;
  const sortedWeeks = streakWeeks
    .filter(w => w.is_complete)
    .sort((a, b) => new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime());
  
  for (let i = 0; i < sortedWeeks.length; i++) {
    if (i === 0 || isConsecutiveWeek(sortedWeeks[i-1].week_start_date, sortedWeeks[i].week_start_date)) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return {
    total_weeks_completed: completedWeeks,
    total_sets_completed: completedSets,
    longest_consecutive_weeks: longestStreak,
    current_consecutive_weeks: getCurrentConsecutiveWeeks(streakWeeks),
    total_rewards_earned: activeRewards.length,
    total_rewards_claimed: totalRewardsClaimed,
    completion_rate: calculateCompletionRate(streakWeeks),
    average_receipts_per_week: calculateAverageReceipts(streakWeeks)
  };
}

function generateNotifications(currentWeek: any, currentSet: any, makeupOpportunity: any, activeRewards: any[]) {
  const notifications = [];
  
  // Current week progress - use unique days instead of total receipts
  if (currentWeek) {
    const receiptsNeeded = 2 - (currentWeek.receipts_count || 0);
    if (receiptsNeeded > 0) {
      notifications.push({
        type: 'progress',
        title: 'Week Progress',
        message: `${receiptsNeeded} more visit${receiptsNeeded > 1 ? ' day' : ' days'} needed to complete this week`,
        priority: 'medium'
      });
    }
  }
  
  // Makeup opportunity
  if (makeupOpportunity.available) {
    notifications.push({
      type: 'makeup',
      title: 'Makeup Opportunity!',
      message: '3 receipts this week can make up for last week\'s incomplete streak',
      priority: 'high'
    });
  }
  
  // Available rewards
  if (activeRewards.length > 0) {
    const totalDiscount = activeRewards.reduce((sum, r) => sum + (r.reward_tier * 25), 0);
    notifications.push({
      type: 'reward',
      title: 'Reward Available!',
      message: `You have a ${totalDiscount}% discount ready to claim`,
      priority: 'high'
    });
  }
  
  // Set progress
  if (currentSet && currentSet.completed_weeks === 3) {
    notifications.push({
      type: 'milestone',
      title: 'Almost There!',
      message: 'Just 1 more week to complete your 4-week set and earn a reward',
      priority: 'medium'
    });
  }
  
  return notifications;
}

// Helper functions
function getDateMinusWeeks(date: Date, weeks: number = 1): string {
  const result = new Date(date);
  result.setDate(result.getDate() - (weeks * 7));
  return getMonday(result).toISOString().split('T')[0];
}

function getDatePlusWeeks(dateStr: string | Date, weeks: number, days: number = 0): string {
  const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
  date.setDate(date.getDate() + (weeks * 7) + days);
  return date.toISOString().split('T')[0];
}

function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

function getCurrentWeekStart(): string {
  return getMonday(new Date()).toISOString().split('T')[0];
}

function getCurrentWeekEnd(): string {
  const monday = getMonday(new Date());
  monday.setDate(monday.getDate() + 6);
  return monday.toISOString().split('T')[0];
}

function isConsecutiveWeek(week1: string, week2: string): boolean {
  const date1 = new Date(week1);
  const date2 = new Date(week2);
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 7;
}

function getCurrentConsecutiveWeeks(streakWeeks: any[]): number {
  const currentWeek = getCurrentWeekStart();
  const sortedWeeks = streakWeeks
    .filter(w => w.is_complete && w.week_start_date <= currentWeek)
    .sort((a, b) => new Date(b.week_start_date).getTime() - new Date(a.week_start_date).getTime());
  
  let consecutive = 0;
  for (let i = 0; i < sortedWeeks.length; i++) {
    if (i === 0 || isConsecutiveWeek(sortedWeeks[i].week_start_date, sortedWeeks[i-1].week_start_date)) {
      consecutive++;
    } else {
      break;
    }
  }
  
  return consecutive;
}

function calculateCompletionRate(streakWeeks: any[]): number {
  if (streakWeeks.length === 0) return 0;
  const completed = streakWeeks.filter(w => w.is_complete).length;
  return Math.round((completed / streakWeeks.length) * 100);
}

function calculateAverageReceipts(streakWeeks: any[]): number {
  if (streakWeeks.length === 0) return 0;
  const totalReceipts = streakWeeks.reduce((sum, w) => sum + w.receipt_count, 0);
  return Math.round((totalReceipts / streakWeeks.length) * 10) / 10;
}