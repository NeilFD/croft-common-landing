import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ClaimRewardRequest {
  reward_id?: string; // Optional - if not provided, claims highest tier
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const body = await req.json().catch(() => ({}));
    const { reward_id }: ClaimRewardRequest = body;

    console.log(`Processing reward claim for user ${user.id}`);

    // Get active rewards for user
    const { data: activeRewards, error: rewardsError } = await supabase
      .from('streak_rewards')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('reward_tier', { ascending: false });

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      throw rewardsError;
    }

    if (!activeRewards || activeRewards.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No active rewards available to claim' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine which reward to claim
    let rewardToClaim;
    if (reward_id) {
      rewardToClaim = activeRewards.find(r => r.id === reward_id);
      if (!rewardToClaim) {
        return new Response(JSON.stringify({ 
          error: 'Reward not found or not active' 
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Claim highest tier reward
      rewardToClaim = activeRewards[0];
    }

    console.log(`Claiming reward: ${rewardToClaim.discount_percentage}% discount`);

    // Calculate total discount value (accumulative)
    const totalDiscount = activeRewards
      .filter(r => r.reward_tier <= rewardToClaim.reward_tier)
      .reduce((sum, r) => sum + (r.reward_tier * 25), 0);

    // Mark all rewards as claimed (full reset)
    const { error: claimError } = await supabase
      .from('streak_rewards')
      .update({
        claimed_date: new Date().toISOString(),
        is_active: false
      })
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (claimError) {
      console.error('Error claiming rewards:', claimError);
      throw claimError;
    }

    // FULL RESET: Clear all streak progress
    await resetAllStreakProgress(supabase, user.id);

    // Award "Reward Claimed" badge
    await supabase
      .from('streak_badges')
      .upsert({
        user_id: user.id,
        badge_type: 'reward_claimed',
        badge_name: `${totalDiscount}% Reward Claimed`,
        badge_description: `Claimed ${totalDiscount}% discount and reset streak progress`,
        badge_icon: 'gift',
        milestone_value: totalDiscount,
        earned_date: new Date().toISOString()
      });

    // Send push notification about reward claim
    try {
      await supabase.functions.invoke('send-push', {
        body: {
          title: '🎉 Reward Claimed!',
          body: `You've claimed your ${totalDiscount}% discount! Your streak has been reset.`,
          url: '/member-home',
          scope: 'user',
          user_ids: [user.id]
        }
      });
    } catch (notificationError) {
      console.warn('Failed to send push notification:', notificationError);
    }

    return new Response(JSON.stringify({
      success: true,
      claimed_reward: {
        discount_percentage: totalDiscount,
        tier: rewardToClaim.reward_tier,
        claimed_at: new Date().toISOString()
      },
      message: `Successfully claimed ${totalDiscount}% discount! Your streak has been reset.`,
      reset_complete: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in claim-streak-reward:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function resetAllStreakProgress(supabase: any, userId: string) {
  console.log(`Performing full streak reset for user ${userId}`);

  // Reset member_streaks summary
  await supabase
    .from('member_streaks')
    .update({
      current_week_receipts: 0,
      current_week_start_date: null,
      current_set_number: 1,
      current_set_progress: 0,
      current_reward_tier: 0,
      available_grace_weeks: 0,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  // Mark all incomplete streak weeks as reset
  await supabase
    .from('streak_weeks')
    .update({
      receipt_count: 0,
      is_complete: false,
      completed_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_complete', false);

  // Mark all incomplete streak sets as reset
  await supabase
    .from('streak_sets')
    .update({
      completed_weeks: 0,
      is_complete: false,
      completed_at: null,
      reward_tier: null,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_complete', false);

  // Clear unused grace periods
  await supabase
    .from('streak_grace_periods')
    .update({
      is_used: true,
      used_date: new Date().toISOString()
    })
    .eq('user_id', userId)
    .eq('is_used', false);

  console.log(`Streak reset completed for user ${userId}`);
}