import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface WeekProgress {
  week_start: string;
  week_end: string;
  receipts_count: number;
  receipts_needed: number;
  is_complete: boolean;
  is_current: boolean;
  is_future: boolean;
  completed_at?: string;
}

interface CurrentSet {
  set_number: number;
  weeks_completed: number;
  weeks_remaining: number;
  start_date: string;
  progress_percentage: number;
  is_complete: boolean;
}

interface StreakReward {
  id: string;
  tier: number;
  discount_percentage: number;
  earned_date: string;
  expires_date: string;
}

interface Rewards {
  available_discount: number;
  active_rewards: StreakReward[];
  next_reward_at?: string;
}

interface StreakBadge {
  type: string;
  name: string;
  description: string;
  icon: string;
  earned_date: string;
  milestone_value?: number;
}

interface StreakOpportunities {
  makeup_available: boolean;
  makeup_details?: {
    broken_week: string;
    receipts_needed: number;
    deadline: string;
  };
  grace_weeks_available: number;
  grace_details: Array<{
    type: string;
    week_start: string;
    expires: string;
  }>;
}

interface StreakStatistics {
  total_weeks_completed: number;
  total_sets_completed: number;
  longest_consecutive_weeks: number;
  current_consecutive_weeks: number;
  total_rewards_earned: number;
  total_rewards_claimed: number;
  completion_rate: number;
  average_receipts_per_week: number;
}

interface StreakNotification {
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
}

interface RecentActivity {
  id: string;
  date: string;
  amount: number;
  venue: string;
}

interface StreakDashboardData {
  user_id: string;
  current_week: WeekProgress;
  current_set?: CurrentSet;
  rewards: Rewards;
  calendar_weeks: WeekProgress[];
  statistics: StreakStatistics;
  badges: StreakBadge[];
  opportunities: StreakOpportunities;
  recent_activity: RecentActivity[];
  notifications: StreakNotification[];
}

export const useStreakDashboard = () => {
  const [dashboardData, setDashboardData] = useState<StreakDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDashboard = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      // First, ensure user has a baseline grace week
      console.log('🌱 HOOK: Seeding baseline grace week');
      try {
        await supabase.functions.invoke('seed-baseline-grace-week', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (seedError) {
        console.warn('⚠️ HOOK: Grace week seeding failed, continuing:', seedError);
      }
      
      console.log('🔑 HOOK: Calling edge function');

      const { data, error } = await supabase.functions.invoke('get-streak-dashboard', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (error) throw error;

      console.log('✅ STREAK DASHBOARD: Data fetched successfully');

      setDashboardData(data);
    } catch (err) {
      console.error('❌ STREAK DASHBOARD ERROR:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard');
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardId?: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('claim-streak-reward', {
        body: { reward_id: rewardId },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      // Refresh dashboard after claiming
      await fetchDashboard();
      
      return data;
    } catch (err) {
      console.error('Error claiming reward:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user?.id]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchDashboard,
    claimReward,
  };
};