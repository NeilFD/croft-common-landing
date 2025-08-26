import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LedgerEntry {
  id: string;
  activity_type: string;
  activity_date: string;
  activity_timestamp: string;
  description: string;
  amount?: number;
  currency?: string;
  metadata?: any;
}

interface MemberStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalSpend: number;
  monthlySpend: number;
  lastCheckInDate?: string;
}

export const useMemberLedger = () => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchLedgerEntries = async () => {
      try {
        const { data, error } = await supabase
          .from('member_ledger')
          .select('*')
          .eq('user_id', user.id)
          .order('activity_timestamp', { ascending: false });

        if (error) throw error;
        setLedgerEntries(data || []);
      } catch (err) {
        console.error('Error fetching ledger entries:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLedgerEntries();
  }, [user?.id]);

  return { ledgerEntries, loading, error };
};

export const useMemberStats = () => {
  const [stats, setStats] = useState<MemberStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalCheckIns: 0,
    totalSpend: 0,
    monthlySpend: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchMemberStats = async () => {
      try {
        // Fetch streak data
        const { data: streakData } = await supabase
          .from('member_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Fetch spending data from ledger
        const { data: ledgerData } = await supabase
          .from('member_ledger')
          .select('amount, activity_date, currency')
          .eq('user_id', user.id)
          .eq('activity_type', 'receipt')
          .not('amount', 'is', null);

        // Calculate total spend
        const totalSpend = ledgerData?.reduce((sum, entry) => {
          return sum + (entry.amount || 0);
        }, 0) || 0;

        // Calculate monthly spend (current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlySpend = ledgerData?.reduce((sum, entry) => {
          const entryDate = new Date(entry.activity_date);
          if (entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear) {
            return sum + (entry.amount || 0);
          }
          return sum;
        }, 0) || 0;

        setStats({
          currentStreak: streakData?.current_streak || 0,
          longestStreak: streakData?.longest_streak || 0,
          totalCheckIns: streakData?.total_check_ins || 0,
          totalSpend,
          monthlySpend,
          lastCheckInDate: streakData?.last_check_in_date,
        });
      } catch (err) {
        console.error('Error fetching member stats:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMemberStats();
  }, [user?.id]);

  return { stats, loading, error };
};