import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReceiptDot {
  date: string;
  count: number;
  amount: number;
}

export const useReceiptDots = () => {
  const [receiptDots, setReceiptDots] = useState<ReceiptDot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchReceiptDots = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get receipts from the last 16 weeks (matching calendar display)
      const sixteenWeeksAgo = new Date();
      sixteenWeeksAgo.setDate(sixteenWeeksAgo.getDate() - (16 * 7));

      const { data: receipts, error: receiptError } = await supabase
        .from('member_receipts')
        .select('receipt_date, total_amount')
        .eq('user_id', user.id)
        .gte('receipt_date', sixteenWeeksAgo.toISOString().split('T')[0])
        .order('receipt_date', { ascending: true });

      if (receiptError) throw receiptError;

      // Group receipts by date
      const dotsByDate = receipts?.reduce((acc, receipt) => {
        const date = receipt.receipt_date;
        if (!acc[date]) {
          acc[date] = { count: 0, amount: 0 };
        }
        acc[date].count += 1;
        acc[date].amount += parseFloat(receipt.total_amount?.toString() || '0');
        return acc;
      }, {} as Record<string, { count: number; amount: number }>) || {};

      // Convert to array format
      const dots = Object.entries(dotsByDate).map(([date, data]) => ({
        date,
        count: data.count,
        amount: data.amount,
      }));

      setReceiptDots(dots);
    } catch (err) {
      console.error('Error fetching receipt dots:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceiptDots();
  }, [user?.id]);

  return {
    receiptDots,
    loading,
    error,
    refetch: fetchReceiptDots,
  };
};