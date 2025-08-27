import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/hooks/use-toast';

export const useReceiptStreakIntegration = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const processReceiptForStreak = useCallback(async (receiptId: string, receiptDate: string, totalAmount: number) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      console.log(`Processing receipt ${receiptId} for streak calculation`);

      const { data, error } = await supabase.functions.invoke('process-receipt-streak', {
        body: {
          receipt_id: receiptId,
          receipt_date: receiptDate,
          total_amount: totalAmount
        },
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) {
        console.error('Error processing receipt for streak:', error);
        throw error;
      }

      console.log('Receipt processed for streak:', data);

      // Show appropriate notification based on week progress
      const weekProgress = data.week_progress;
      if (weekProgress.is_complete && weekProgress.receipt_count === 2) {
        // Week just completed
        toast({
          title: "🎉 Week Complete!",
          description: `Great job! You've completed the week of ${formatDate(weekProgress.week_start)}`,
        });
      } else if (weekProgress.receipt_count === 1) {
        // First receipt of the week
        toast({
          title: "📊 Streak Progress",
          description: `1/2 receipts for this week. Upload 1 more to complete the week!`,
        });
      }

      return data;
    } catch (error) {
      console.error('Error in receipt streak integration:', error);
      
      // Show error toast
      toast({
        title: "Streak Update Failed",
        description: "Your receipt was saved, but streak calculation failed. Please try again.",
        variant: "destructive",
      });
      
      throw error;
    }
  }, [user, toast]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short'
    });
  };

  return {
    processReceiptForStreak,
  };
};