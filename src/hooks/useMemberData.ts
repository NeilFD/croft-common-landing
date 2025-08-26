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
  related_id?: string;
  receipt?: {
    id: string;
    receipt_image_url: string;
    venue_location?: string;
    items: any[];
    total_amount: number;
  };
}

interface MemberStats {
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  totalSpend: number;
  monthlySpend: number;
  lastCheckInDate?: string;
}

export const useMemberLedger = (dateRange?: { start?: Date; end?: Date }) => {
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      console.log('useMemberLedger: No user ID, setting loading to false');
      setLoading(false);
      return;
    }

    console.log('useMemberLedger: Starting fetch for user:', user.id, 'dateRange:', dateRange);

    const fetchLedgerEntries = async () => {
      try {
        let query = supabase
          .from('member_ledger')
          .select('*')
          .eq('user_id', user.id);

        console.log('useMemberLedger: Base query created');

        // Apply date range filter if provided
        if (dateRange?.start) {
          query = query.gte('activity_date', dateRange.start.toISOString().split('T')[0]);
          console.log('useMemberLedger: Added start date filter:', dateRange.start.toISOString().split('T')[0]);
        }
        if (dateRange?.end) {
          query = query.lte('activity_date', dateRange.end.toISOString().split('T')[0]);
          console.log('useMemberLedger: Added end date filter:', dateRange.end.toISOString().split('T')[0]);
        }

        console.log('useMemberLedger: Executing ledger query...');
        const { data: ledgerData, error: ledgerError } = await query.order('activity_timestamp', { ascending: false });

        if (ledgerError) {
          console.error('useMemberLedger: Ledger query error:', ledgerError);
          throw ledgerError;
        }

        console.log('useMemberLedger: Ledger data received:', ledgerData);

        // Fetch receipt data for receipt entries
        const receiptIds = ledgerData
          ?.filter(entry => entry.activity_type === 'receipt' && entry.related_id)
          .map(entry => entry.related_id)
          .filter(Boolean) || [];

        console.log('useMemberLedger: Receipt IDs to fetch:', receiptIds);

        let receiptsMap = new Map();
        if (receiptIds.length > 0) {
          console.log('useMemberLedger: Fetching receipt data...');
          const { data: receiptsData, error: receiptsError } = await supabase
            .from('member_receipts')
            .select('id, receipt_image_url, venue_location, items, total_amount')
            .in('id', receiptIds);

          if (receiptsError) {
            console.error('useMemberLedger: Receipt query error:', receiptsError);
          } else {
            console.log('useMemberLedger: Receipt data received:', receiptsData);
            receiptsData?.forEach(receipt => {
              receiptsMap.set(receipt.id, receipt);
            });
          }
        }

        // Combine ledger entries with receipt data
        const enhancedEntries = ledgerData?.map(entry => ({
          ...entry,
          receipt: entry.related_id ? receiptsMap.get(entry.related_id) : undefined
        })) || [];

        console.log('Enhanced entries with receipts:', enhancedEntries.filter(e => e.receipt));
        setLedgerEntries(enhancedEntries);
      } catch (err) {
        console.error('Error fetching ledger entries:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchLedgerEntries();
  }, [user?.id, dateRange?.start, dateRange?.end]);

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