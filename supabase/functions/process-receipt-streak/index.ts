import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReceiptStreakRequest {
  receipt_id: string;
  receipt_date: string; // ISO date string
  total_amount: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create supabase client with anon key for user auth
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

    // Create service role client for database operations
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid auth' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { receipt_id, receipt_date, total_amount }: ReceiptStreakRequest = await req.json();
    
    console.log(`Processing receipt streak for user ${user.id}, receipt ${receipt_id}, date ${receipt_date}`);

    // Parse receipt date and get week boundaries
    const receiptDateObj = new Date(receipt_date);
    const { data: weekBoundaries } = await supabase.rpc('get_current_week_boundaries');
    
    // Calculate week start/end for this receipt
    const { data: receiptWeekStart } = await supabase.rpc('get_week_start_date', { 
      input_date: receipt_date 
    });
    const { data: receiptWeekEnd } = await supabase.rpc('get_week_end_date', { 
      input_date: receipt_date 
    });

    console.log(`Receipt week: ${receiptWeekStart} to ${receiptWeekEnd}`);

    // Get or create streak_week record for this week using service role
    let { data: streakWeek } = await supabaseService
      .from('streak_weeks')
      .select('*')
      .eq('user_id', user.id)
      .eq('week_start_date', receiptWeekStart)
      .single();

    if (!streakWeek) {
      // Create new streak week
      const { data: newStreakWeek, error: insertError } = await supabaseService
        .from('streak_weeks')
        .insert({
          user_id: user.id,
          week_start_date: receiptWeekStart,
          week_end_date: receiptWeekEnd,
          receipt_count: 1,
          is_complete: false
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating streak week:', insertError);
        throw insertError;
      }

      streakWeek = newStreakWeek;
    } else {
      // Check if this receipt date already counted (max 2 receipts per week, 1 per day)
      const { data: existingReceipts } = await supabase
        .from('member_receipts')
        .select('receipt_date')
        .eq('user_id', user.id)
        .eq('receipt_date', receipt_date)
        .neq('id', receipt_id); // Exclude current receipt

      const dailyReceiptCount = existingReceipts?.length || 0;
      
      // Only count if this is the first receipt of the day OR if week is not yet complete
      if (dailyReceiptCount === 0 && streakWeek.receipt_count < 2) {
        const newCount = streakWeek.receipt_count + 1;
        const isComplete = newCount >= 2;

        // Update streak week using service role
        const { error: updateError } = await supabaseService
          .from('streak_weeks')
          .update({
            receipt_count: newCount,
            is_complete: isComplete,
            completed_at: isComplete ? new Date().toISOString() : null
          })
          .eq('id', streakWeek.id);

        if (updateError) {
          console.error('Error updating streak week:', updateError);
          throw updateError;
        }

        streakWeek.receipt_count = newCount;
        streakWeek.is_complete = isComplete;

        console.log(`Updated week ${receiptWeekStart}: ${newCount}/2 receipts, complete: ${isComplete}`);

        // If week is now complete, check for 4-week set completion
        if (isComplete) {
          await checkAndUpdateStreakSets(supabaseService, user.id, receiptWeekStart);
        }
      }
    }

    // Update member_streaks table
    await updateMemberStreaksSummary(supabaseService, user.id);

    // Check for badge opportunities
    await checkAndAwardBadges(supabaseService, user.id);

    return new Response(JSON.stringify({
      success: true,
      week_progress: {
        week_start: receiptWeekStart,
        week_end: receiptWeekEnd,
        receipt_count: streakWeek.receipt_count,
        is_complete: streakWeek.is_complete
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in process-receipt-streak:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkAndUpdateStreakSets(supabase: any, userId: string, completedWeekStart: string) {
  console.log(`Checking streak sets for user ${userId}, completed week ${completedWeekStart}`);
  
  // Get current set or create new one
  let { data: currentSet } = await supabase
    .from('streak_sets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_complete', false)
    .order('set_number', { ascending: false })
    .limit(1)
    .single();

  if (!currentSet) {
    // Get the next set number
    const { data: lastSet } = await supabase
      .from('streak_sets')
      .select('set_number')
      .eq('user_id', userId)
      .order('set_number', { ascending: false })
      .limit(1)
      .single();

    const nextSetNumber = (lastSet?.set_number || 0) + 1;
    
    // Create new set starting with this week
    const { data: newSet, error: insertError } = await supabase
      .from('streak_sets')
      .insert({
        user_id: userId,
        set_number: nextSetNumber,
        start_week_date: completedWeekStart,
        end_week_date: getDatePlusWeeks(completedWeekStart, 3), // 4 weeks total
        completed_weeks: 1,
        is_complete: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new streak set:', insertError);
      return;
    }

    currentSet = newSet;
    console.log(`Created new streak set ${nextSetNumber} starting ${completedWeekStart}`);
  } else {
    // Check if this week is consecutive with the set
    const expectedWeekStart = getDatePlusWeeks(currentSet.start_week_date, currentSet.completed_weeks);
    
    if (completedWeekStart === expectedWeekStart) {
      // Consecutive week - update set
      const newCompletedWeeks = currentSet.completed_weeks + 1;
      const isSetComplete = newCompletedWeeks >= 4;
      
      const { error: updateError } = await supabase
        .from('streak_sets')
        .update({
          completed_weeks: newCompletedWeeks,
          is_complete: isSetComplete,
          completed_at: isSetComplete ? new Date().toISOString() : null,
          reward_tier: isSetComplete ? await calculateRewardTier(supabase, userId) : null
        })
        .eq('id', currentSet.id);

      if (updateError) {
        console.error('Error updating streak set:', updateError);
        return;
      }

      console.log(`Updated set ${currentSet.set_number}: ${newCompletedWeeks}/4 weeks, complete: ${isSetComplete}`);

      // If set is complete, award reward
      if (isSetComplete) {
        await awardStreakReward(supabase, userId, currentSet.set_number);
      }
    } else {
      // Non-consecutive week - start new set
      const { data: lastSet } = await supabase
        .from('streak_sets')
        .select('set_number')
        .eq('user_id', userId)
        .order('set_number', { ascending: false })
        .limit(1)
        .single();

      const nextSetNumber = (lastSet?.set_number || 0) + 1;
      
      const { error: insertError } = await supabase
        .from('streak_sets')
        .insert({
          user_id: userId,
          set_number: nextSetNumber,
          start_week_date: completedWeekStart,
          end_week_date: getDatePlusWeeks(completedWeekStart, 3),
          completed_weeks: 1,
          is_complete: false
        });

      if (insertError) {
        console.error('Error creating new streak set after break:', insertError);
        return;
      }

      console.log(`Started new set ${nextSetNumber} after break`);
    }
  }
}

async function calculateRewardTier(supabase: any, userId: string): Promise<number> {
  // Count active (unclaimed) rewards
  const { data: activeRewards } = await supabase
    .from('streak_rewards')
    .select('reward_tier')
    .eq('user_id', userId)
    .eq('is_active', true);

  const currentTier = activeRewards?.length || 0;
  return Math.min(currentTier + 1, 4); // Max tier 4 (100%)
}

async function awardStreakReward(supabase: any, userId: string, setNumber: number) {
  const rewardTier = await calculateRewardTier(supabase, userId);
  const discountPercentage = rewardTier * 25; // 25%, 50%, 75%, 100%

  const { error } = await supabase
    .from('streak_rewards')
    .insert({
      user_id: userId,
      reward_tier: rewardTier,
      discount_percentage: discountPercentage,
      earned_date: new Date().toISOString(),
      expires_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // 6 months
      is_active: true
    });

  if (error) {
    console.error('Error awarding streak reward:', error);
  } else {
    console.log(`Awarded ${discountPercentage}% reward for completing set ${setNumber}`);
  }
}

async function updateMemberStreaksSummary(supabase: any, userId: string) {
  // Get current stats
  const { data: weekStats } = await supabase
    .from('streak_weeks')
    .select('*')
    .eq('user_id', userId)
    .order('week_start_date', { ascending: false });

  const { data: setStats } = await supabase
    .from('streak_sets')
    .select('*')
    .eq('user_id', userId)
    .order('set_number', { ascending: false });

  const { data: currentWeekBoundaries } = await supabase.rpc('get_current_week_boundaries');
  const currentWeek = weekStats?.find(w => w.week_start_date === currentWeekBoundaries?.week_start);

  const totalWeeksCompleted = weekStats?.filter(w => w.is_complete).length || 0;
  const totalSetsCompleted = setStats?.filter(s => s.is_complete).length || 0;
  const currentSetProgress = setStats?.[0]?.completed_weeks || 0;
  const currentWeekReceipts = currentWeek?.receipt_count || 0;

  // Calculate longest consecutive weeks
  let longestConsecutive = 0;
  let currentConsecutive = 0;
  const sortedWeeks = weekStats?.sort((a, b) => new Date(a.week_start_date).getTime() - new Date(b.week_start_date).getTime()) || [];
  
  for (let i = 0; i < sortedWeeks.length; i++) {
    if (sortedWeeks[i].is_complete) {
      currentConsecutive++;
      longestConsecutive = Math.max(longestConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }

  // Update member_streaks
  await supabase
    .from('member_streaks')
    .upsert({
      user_id: userId,
      current_week_receipts: currentWeekReceipts,
      current_week_start_date: currentWeekBoundaries?.week_start,
      current_set_number: setStats?.[0]?.set_number || 1,
      current_set_progress: currentSetProgress,
      total_sets_completed: totalSetsCompleted,
      longest_consecutive_weeks: longestConsecutive,
      total_weeks_completed: totalWeeksCompleted,
      current_reward_tier: await calculateRewardTier(supabase, userId),
      updated_at: new Date().toISOString()
    });
}

async function checkAndAwardBadges(supabase: any, userId: string) {
  const { data: weekStats } = await supabase
    .from('streak_weeks')
    .select('*')
    .eq('user_id', userId);

  const { data: setStats } = await supabase
    .from('streak_sets')
    .select('*')
    .eq('user_id', userId);

  const completedWeeks = weekStats?.filter(w => w.is_complete).length || 0;
  const completedSets = setStats?.filter(s => s.is_complete).length || 0;

  const badges = [];

  // First week badge
  if (completedWeeks === 1) {
    badges.push({
      badge_type: 'first_week',
      badge_name: 'First Week Complete',
      badge_description: 'Completed your first streak week!',
      badge_icon: 'trophy'
    });
  }

  // First set badge
  if (completedSets === 1) {
    badges.push({
      badge_type: 'first_set',
      badge_name: 'Streak Starter',
      badge_description: 'Completed your first 4-week streak!',
      badge_icon: 'award'
    });
  }

  // Milestone badges
  const milestones = [5, 10, 25, 50, 100];
  for (const milestone of milestones) {
    if (completedWeeks === milestone) {
      badges.push({
        badge_type: 'week_milestone',
        badge_name: `${milestone} Week Champion`,
        badge_description: `Completed ${milestone} streak weeks!`,
        badge_icon: 'star',
        milestone_value: milestone
      });
    }
  }

  // Award badges
  for (const badge of badges) {
    await supabase
      .from('streak_badges')
      .upsert({
        user_id: userId,
        ...badge,
        earned_date: new Date().toISOString()
      });
  }
}

function getDatePlusWeeks(dateStr: string, weeks: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + (weeks * 7));
  return date.toISOString().split('T')[0];
}