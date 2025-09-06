import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface SpendingAnalysisItem {
  itemName: string;
  totalQuantity: number;
  totalSpend: number;
  averagePrice: number;
  timesOrdered: number;
}

export const useReceiptAnalysis = (dateRange?: { start?: Date; end?: Date }) => {
  const [analysisData, setAnalysisData] = useState<SpendingAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const fetchAndAnalyzeReceipts = async () => {
      try {
        // Get deep dive data which includes fuzzy-matched individual items
        const { data, error } = await supabase.rpc('get_member_deep_dive', {
          p_user_id: user.id
        });

        if (error) throw error;

        if (!data || data.length === 0) {
          setAnalysisData([]);
          setLoading(false);
          return;
        }

        const memberData = data[0];
        let individualItems = memberData.individual_items || [];

        // Apply date range filtering if provided
        if (dateRange?.start || dateRange?.end) {
          // If date filtering is needed, we need to get receipts and filter
          let receiptQuery = supabase
            .from('member_receipts')
            .select('items, receipt_date')
            .eq('user_id', user.id)
            .not('items', 'is', null);

          if (dateRange?.start) {
            receiptQuery = receiptQuery.gte('receipt_date', dateRange.start.toISOString().split('T')[0]);
          }
          if (dateRange?.end) {
            receiptQuery = receiptQuery.lte('receipt_date', dateRange.end.toISOString().split('T')[0]);
          }

          const { data: filteredReceipts, error: receiptError } = await receiptQuery;
          
          if (receiptError) throw receiptError;

          // For date-filtered data, fall back to basic client-side aggregation
          // since the database function doesn't support date filtering yet
          const itemAnalysis = new Map<string, {
            totalQuantity: number;
            totalSpend: number;
            timesOrdered: number;
          }>();

          filteredReceipts?.forEach((receipt) => {
            if (receipt.items && Array.isArray(receipt.items)) {
              (receipt.items as any[]).forEach((item: any) => {
                if (item.name && item.quantity && item.price) {
                  const normalizedName = String(item.name).trim().toLowerCase();
                  const quantity = Number(item.quantity) || 0;
                  const price = Number(item.price) || 0;
                  
                  const existing = itemAnalysis.get(normalizedName) || {
                    totalQuantity: 0,
                    totalSpend: 0,
                    timesOrdered: 0,
                  };

                  existing.totalQuantity += quantity;
                  existing.totalSpend += price * quantity;
                  existing.timesOrdered += 1;

                  itemAnalysis.set(normalizedName, existing);
                }
              });
            }
          });

          // Convert to SpendingAnalysisItem format
          individualItems = Array.from(itemAnalysis.entries())
            .map(([itemName, data]) => ({
              item_name: itemName,
              total_quantity: data.totalQuantity,
              total_spent: data.totalSpend,
              avg_price: data.totalSpend / data.totalQuantity,
              times_ordered: data.timesOrdered,
            }));
        }

        // Convert database format to hook format
        const analysisArray: SpendingAnalysisItem[] = Array.isArray(individualItems)
          ? individualItems.map((item: any) => ({
              itemName: item.item_name,
              totalQuantity: item.total_quantity,
              totalSpend: item.total_spent,
              averagePrice: item.avg_price,
              timesOrdered: item.times_ordered,
            })).sort((a, b) => b.totalSpend - a.totalSpend)
          : [];

        setAnalysisData(analysisArray);
      } catch (err) {
        console.error('Error fetching receipt analysis:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchAndAnalyzeReceipts();
  }, [user?.id, dateRange?.start, dateRange?.end]);

  return { analysisData, loading, error };
};