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
        let query = supabase
          .from('member_receipts')
          .select('items, receipt_date')
          .eq('user_id', user.id)
          .not('items', 'is', null);

        // Apply date range filter if provided
        if (dateRange?.start) {
          query = query.gte('receipt_date', dateRange.start.toISOString().split('T')[0]);
        }
        if (dateRange?.end) {
          query = query.lte('receipt_date', dateRange.end.toISOString().split('T')[0]);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Process the receipt items to create spending analysis
        const itemAnalysis = new Map<string, {
          totalQuantity: number;
          totalSpend: number;
          timesOrdered: number;
          prices: number[];
        }>();

        data?.forEach((receipt) => {
          if (receipt.items && Array.isArray(receipt.items)) {
            (receipt.items as any[]).forEach((item: any) => {
              if (item.name && item.quantity && item.price) {
                const normalizedName = String(item.name).trim();
                const quantity = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                
                const existing = itemAnalysis.get(normalizedName) || {
                  totalQuantity: 0,
                  totalSpend: 0,
                  timesOrdered: 0,
                  prices: []
                };

                existing.totalQuantity += quantity;
                existing.totalSpend += price * quantity;
                existing.timesOrdered += 1;
                existing.prices.push(price);

                itemAnalysis.set(normalizedName, existing);
              }
            });
          }
        });

        // Convert to array and calculate averages
        const analysisArray: SpendingAnalysisItem[] = Array.from(itemAnalysis.entries())
          .map(([itemName, data]) => ({
            itemName,
            totalQuantity: data.totalQuantity,
            totalSpend: data.totalSpend,
            averagePrice: data.totalSpend / data.totalQuantity,
            timesOrdered: data.timesOrdered,
          }))
          .sort((a, b) => b.totalSpend - a.totalSpend); // Sort by total spend descending

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