import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface WeekCompletion {
  weekStart: string;
  weekEnd: string;
  receiptCount: number;
  isComplete: boolean;
  isCurrent: boolean;
  totalAmount: number;
}

export const useWeekCompletion = () => {
  const [weekCompletions, setWeekCompletions] = useState<WeekCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const getWeekStart = (date: Date): Date => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    return new Date(date.setDate(diff));
  };

  const getWeekEnd = (weekStart: Date): Date => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    return weekEnd;
  };

  const fetchWeekCompletions = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all receipts for this user to find first visit
      const { data: receipts, error: receiptError } = await supabase
        .from('member_receipts')
        .select('receipt_date, total_amount')
        .eq('user_id', user.id)
        .order('receipt_date', { ascending: true });

      if (receiptError) throw receiptError;

      if (!receipts || receipts.length === 0) {
        setWeekCompletions([]);
        return;
      }

      // Find the first receipt date to determine streak start
      const firstReceiptDate = new Date(receipts[0].receipt_date);
      const firstWeekStart = getWeekStart(new Date(firstReceiptDate));
      
      // Generate weeks from first receipt until now (up to 16 weeks max)
      const weeks: WeekCompletion[] = [];
      const today = new Date();
      const currentWeekStart = getWeekStart(new Date(today));
      
      let weekStart = new Date(firstWeekStart);
      let weekIndex = 0;
      
      while (weekStart <= currentWeekStart && weekIndex < 16) {
        const weekEnd = getWeekEnd(new Date(weekStart));
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const weekEndStr = weekEnd.toISOString().split('T')[0];

        // Count receipts in this week
        const weekReceipts = receipts?.filter(receipt => {
          const receiptDate = receipt.receipt_date;
          return receiptDate >= weekStartStr && receiptDate <= weekEndStr;
        }) || [];

        const receiptCount = weekReceipts.length;
        const totalAmount = weekReceipts.reduce((sum, r) => sum + parseFloat(r.total_amount?.toString() || '0'), 0);

        // Check if this is the current week
        const isCurrent = weekStartStr === currentWeekStart.toISOString().split('T')[0];

        weeks.push({
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
          receiptCount,
          isComplete: receiptCount >= 2, // 2+ receipts = complete week
          isCurrent,
          totalAmount,
        });

        // Move to next week
        weekStart.setDate(weekStart.getDate() + 7);
        weekIndex++;
      }

      setWeekCompletions(weeks);
    } catch (err) {
      console.error('Error fetching week completions:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeekCompletions();
  }, [user?.id]);

  return {
    weekCompletions,
    loading,
    error,
    refetch: fetchWeekCompletions,
  };
};