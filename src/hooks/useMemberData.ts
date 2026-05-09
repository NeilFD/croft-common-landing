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

interface RawLedgerRow {
  id: string;
  user_id: string;
  receipt_id: string | null;
  amount: number | null;
  currency: string | null;
  description: string | null;
  transaction_type: string | null;
  created_at: string;
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
        let query = (supabase as any)
          .from('member_ledger')
          .select('*')
          .eq('user_id', user.id);

        if (dateRange?.start) {
          query = query.gte('created_at', dateRange.start.toISOString());
        }
        if (dateRange?.end) {
          const endInclusive = new Date(dateRange.end);
          endInclusive.setHours(23, 59, 59, 999);
          query = query.lte('created_at', endInclusive.toISOString());
        }

        const { data: ledgerData, error: ledgerError } = await query.order('created_at', { ascending: false });

        if (ledgerError) throw ledgerError;

        const rows = (ledgerData || []) as RawLedgerRow[];
        const receiptIds = rows.map(r => r.receipt_id).filter(Boolean) as string[];

        let receiptsMap = new Map<string, any>();
        if (receiptIds.length > 0) {
          const { data: receiptsData, error: receiptsError } = await (supabase as any)
            .from('member_receipts')
            .select('id, image_url, venue_location, merchant_name, items, total_amount')
            .in('id', receiptIds);

          if (!receiptsError) {
            (receiptsData || []).forEach((r: any) => {
              receiptsMap.set(r.id, {
                id: r.id,
                receipt_image_url: r.image_url,
                venue_location: r.venue_location || r.merchant_name,
                items: r.items || [],
                total_amount: Number(r.total_amount) || 0,
              });
            });
          }
        }

        const enhancedEntries: LedgerEntry[] = rows.map(row => ({
          id: row.id,
          activity_type: row.receipt_id ? 'receipt' : (row.transaction_type || 'transaction'),
          activity_date: row.created_at,
          activity_timestamp: row.created_at,
          description: row.description || (row.receipt_id ? 'Receipt' : 'Transaction'),
          amount: row.amount != null ? Number(row.amount) : undefined,
          currency: row.currency || 'GBP',
          related_id: row.receipt_id || undefined,
          receipt: row.receipt_id ? receiptsMap.get(row.receipt_id) : undefined,
        }));

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
        const { data: streakData } = await (supabase as any)
          .from('member_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Fetch spending data from ledger
        const { data: ledgerData } = await (supabase as any)
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