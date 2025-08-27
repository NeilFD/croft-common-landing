import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

// This is a cron job that runs every Sunday at 23:59 GMT
// It finalizes the week and calculates grace periods

serve(async (req: Request) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // Service role for admin operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    console.log('Starting weekly streak calculation cron job...');

    // Get current week boundaries
    const { data: currentWeekBoundaries } = await supabase.rpc('get_current_week_boundaries');
    const currentWeekStart = currentWeekBoundaries?.week_start;
    const currentWeekEnd = currentWeekBoundaries?.week_end;
    
    console.log(`Processing week: ${currentWeekStart} to ${currentWeekEnd}`);

    // Get all users with receipts in the current week
    const { data: weeklyReceipts } = await supabase
      .from('member_receipts')
      .select('user_id, receipt_date')
      .gte('receipt_date', currentWeekStart)
      .lte('receipt_date', currentWeekEnd);

    if (!weeklyReceipts || weeklyReceipts.length === 0) {
      console.log('No receipts found for current week');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No receipts to process this week' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group receipts by user and count unique days
    const userWeeklyData = new Map();
    
    for (const receipt of weeklyReceipts) {
      const userId = receipt.user_id;
      const receiptDate = receipt.receipt_date;
      
      if (!userWeeklyData.has(userId)) {
        userWeeklyData.set(userId, new Set());
      }
      
      userWeeklyData.get(userId).add(receiptDate);
    }

    console.log(`Processing ${userWeeklyData.size} users for week finalization`);

    // Process each user's weekly progress
    const processedUsers = [];
    for (const [userId, uniqueDates] of userWeeklyData) {
      try {
        const receiptCount = Math.min(uniqueDates.size, 2); // Max 2 receipts count per week
        const isComplete = receiptCount >= 2;
        
        // Update or create streak_week record
        const { data: existingWeek } = await supabase
          .from('streak_weeks')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start_date', currentWeekStart)
          .single();

        if (existingWeek) {
          // Update existing record
          await supabase
            .from('streak_weeks')
            .update({
              receipt_count: receiptCount,
              is_complete: isComplete,
              completed_at: isComplete ? new Date().toISOString() : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingWeek.id);
        } else {
          // Create new record
          await supabase
            .from('streak_weeks')
            .insert({
              user_id: userId,
              week_start_date: currentWeekStart,
              week_end_date: currentWeekEnd,
              receipt_count: receiptCount,
              is_complete: isComplete,
              completed_at: isComplete ? new Date().toISOString() : null
            });
        }

        // If week is complete, check streak sets
        if (isComplete) {
          await processStreakSets(supabase, userId, currentWeekStart);
        } else {
          // Week incomplete - check for grace period eligibility
          await processGracePeriod(supabase, userId, currentWeekStart);
        }

        processedUsers.push({
          user_id: userId,
          receipt_count: receiptCount,
          is_complete: isComplete
        });

      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError);
      }
    }

    // Send weekly summary notifications
    await sendWeeklySummaryNotifications(supabase, processedUsers);

    // Clean up expired grace periods
    await cleanupExpiredGracePeriods(supabase);

    console.log(`Weekly calculation completed. Processed ${processedUsers.length} users.`);

    return new Response(JSON.stringify({
      success: true,
      processed_users: processedUsers.length,
      week_start: currentWeekStart,
      week_end: currentWeekEnd,
      summary: {
        completed_weeks: processedUsers.filter(u => u.is_complete).length,
        incomplete_weeks: processedUsers.filter(u => !u.is_complete).length
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in calculate-weekly-streaks cron job:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

async function processStreakSets(supabase: any, userId: string, completedWeekStart: string) {
  console.log(`Processing streak sets for user ${userId}, completed week ${completedWeekStart}`);
  
  // Get current incomplete set
  let { data: currentSet } = await supabase
    .from('streak_sets')
    .select('*')
    .eq('user_id', userId)
    .eq('is_complete', false)
    .order('set_number', { ascending: false })
    .limit(1)
    .single();

  if (!currentSet) {
    // Create first set
    const { data: newSet, error: insertError } = await supabase
      .from('streak_sets')
      .insert({
        user_id: userId,
        set_number: 1,
        start_week_date: completedWeekStart,
        end_week_date: getDatePlusWeeks(completedWeekStart, 3),
        completed_weeks: 1,
        is_complete: false
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating new streak set:', insertError);
      return;
    }

    console.log(`Created first streak set for user ${userId}`);
    return;
  }

  // Check if this week is consecutive
  const expectedWeekStart = getDatePlusWeeks(currentSet.start_week_date, currentSet.completed_weeks);
  
  if (completedWeekStart === expectedWeekStart) {
    // Consecutive week - update set
    const newCompletedWeeks = currentSet.completed_weeks + 1;
    const isSetComplete = newCompletedWeeks >= 4;
    
    await supabase
      .from('streak_sets')
      .update({
        completed_weeks: newCompletedWeeks,
        is_complete: isSetComplete,
        completed_at: isSetComplete ? new Date().toISOString() : null,
        reward_tier: isSetComplete ? await calculateRewardTier(supabase, userId) : null
      })
      .eq('id', currentSet.id);

    // Award reward if set is complete
    if (isSetComplete) {
      await awardStreakReward(supabase, userId, currentSet.set_number);
      
      // Send reward notification
      await supabase.functions.invoke('send-push', {
        body: {
          title: '🎉 Streak Set Complete!',
          body: `You've completed a 4-week set and earned a reward!`,
          url: '/member-home',
          scope: 'user',
          user_ids: [userId]
        }
      });
    }

    console.log(`Updated set ${currentSet.set_number}: ${newCompletedWeeks}/4 weeks, complete: ${isSetComplete}`);
  } else {
    // Non-consecutive - start new set
    const { data: lastSet } = await supabase
      .from('streak_sets')
      .select('set_number')
      .eq('user_id', userId)
      .order('set_number', { ascending: false })
      .limit(1)
      .single();

    const nextSetNumber = (lastSet?.set_number || 0) + 1;
    
    await supabase
      .from('streak_sets')
      .insert({
        user_id: userId,
        set_number: nextSetNumber,
        start_week_date: completedWeekStart,
        end_week_date: getDatePlusWeeks(completedWeekStart, 3),
        completed_weeks: 1,
        is_complete: false
      });

    console.log(`Started new set ${nextSetNumber} after streak break for user ${userId}`);
  }
}

async function processGracePeriod(supabase: any, userId: string, incompleteWeekStart: string) {
  console.log(`Processing grace period for user ${userId}, incomplete week ${incompleteWeekStart}`);
  
  // Check if user has completed 16 weeks (4 sets) to earn a grace week
  const { data: completedSets } = await supabase
    .from('streak_sets')
    .select('set_number')
    .eq('user_id', userId)
    .eq('is_complete', true);

  const completedSetCount = completedSets?.length || 0;
  const graceWeeksEarned = Math.floor(completedSetCount / 4); // 1 grace week per 16 weeks (4 sets)
  
  // Check how many grace weeks already used
  const { data: usedGraceWeeks } = await supabase
    .from('streak_grace_periods')
    .select('*')
    .eq('user_id', userId)
    .eq('grace_type', 'grace_week')
    .eq('is_used', true);

  const usedGraceCount = usedGraceWeeks?.length || 0;
  const availableGraceWeeks = graceWeeksEarned - usedGraceCount;

  if (availableGraceWeeks > 0) {
    // User can use a grace week
    await supabase
      .from('streak_grace_periods')
      .insert({
        user_id: userId,
        grace_type: 'grace_week',
        week_start_date: incompleteWeekStart,
        used_date: new Date().toISOString(),
        is_used: true,
        expires_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // Expires in 1 week
      });

    // Mark the week as complete using grace
    await supabase
      .from('streak_weeks')
      .update({
        is_complete: true,
        completed_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('week_start_date', incompleteWeekStart);

    console.log(`Applied grace week for user ${userId} on week ${incompleteWeekStart}`);
    
    // Send notification
    await supabase.functions.invoke('send-push', {
      body: {
        title: '🔄 Grace Week Applied',
        body: `Your incomplete week has been covered by a grace week!`,
        url: '/member-home',
        scope: 'user',
        user_ids: [userId]
      }
    });
  } else {
    // Create makeup opportunity for next week
    const nextWeekStart = getDatePlusWeeks(incompleteWeekStart, 1);
    
    await supabase
      .from('streak_grace_periods')
      .insert({
        user_id: userId,
        grace_type: 'makeup_opportunity',
        week_start_date: nextWeekStart,
        is_used: false,
        expires_date: getDatePlusWeeks(nextWeekStart, 1) // Expires end of next week
      });

    console.log(`Created makeup opportunity for user ${userId} starting ${nextWeekStart}`);
  }
}

async function calculateRewardTier(supabase: any, userId: string): Promise<number> {
  const { data: activeRewards } = await supabase
    .from('streak_rewards')
    .select('reward_tier')
    .eq('user_id', userId)
    .eq('is_active', true);

  const currentTier = activeRewards?.length || 0;
  return Math.min(currentTier + 1, 4);
}

async function awardStreakReward(supabase: any, userId: string, setNumber: number) {
  const rewardTier = await calculateRewardTier(supabase, userId);
  const discountPercentage = rewardTier * 25;

  await supabase
    .from('streak_rewards')
    .insert({
      user_id: userId,
      reward_tier: rewardTier,
      discount_percentage: discountPercentage,
      earned_date: new Date().toISOString(),
      expires_date: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: true
    });

  console.log(`Awarded ${discountPercentage}% reward for completing set ${setNumber}`);
}

async function sendWeeklySummaryNotifications(supabase: any, processedUsers: any[]) {
  const completedCount = processedUsers.filter(u => u.is_complete).length;
  const incompleteCount = processedUsers.filter(u => !u.is_complete).length;
  
  console.log(`Sending weekly summary: ${completedCount} completed, ${incompleteCount} incomplete`);
  
  // Could send summary to admins or implement user-specific notifications here
}

async function cleanupExpiredGracePeriods(supabase: any) {
  const { error } = await supabase
    .from('streak_grace_periods')
    .delete()
    .lt('expires_date', new Date().toISOString())
    .eq('is_used', false);

  if (error) {
    console.error('Error cleaning up expired grace periods:', error);
  } else {
    console.log('Cleaned up expired grace periods');
  }
}

function getDatePlusWeeks(dateStr: string, weeks: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + (weeks * 7));
  return date.toISOString().split('T')[0];
}