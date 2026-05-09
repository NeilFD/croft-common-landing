import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type Site = 'town' | 'country';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  site: 'town' | 'country' | 'both';
}

interface OrderItem extends MenuItem {
  quantity: number;
}

export const useLunchRun = (site: Site | null) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const orderDate = new Date().toISOString().split('T')[0];

  const loadMenu = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('lunch_menu')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('sort_order');
      if (error) throw error;
      setAllItems((data || []) as MenuItem[]);
    } catch (error: any) {
      console.error('Error loading Thai menu:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load menu.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Filter by site (returns items tagged for that site or 'both')
  const items = site
    ? allItems.filter((i) => i.site === site || i.site === 'both')
    : allItems;

  const menu = {
    smallPlates: items.filter((i) => i.category === 'small_plate'),
    largePlates: items.filter((i) => i.category === 'large_plate'),
    curries: items.filter((i) => i.category === 'curry'),
    sides: items.filter((i) => i.category === 'side'),
    desserts: items.filter((i) => i.category === 'dessert'),
  };

  const submitOrder = async (orderData: {
    site: Site;
    items: OrderItem[];
    totalAmount: number;
    memberName: string;
    memberPhone: string;
    notes?: string;
  }) => {
    try {
      setSubmitting(true);
      const { data, error } = await supabase.functions.invoke('create-lunch-order', {
        body: { ...orderData, orderDate },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to place order');
      toast({ title: 'Order placed', description: 'The kitchen has it.' });
      return { success: true, orderId: data.orderId, orderRef: data.orderRef };
    } catch (error: any) {
      console.error('Error submitting Thai order:', error);
      toast({
        title: 'Order failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
      return { success: false, error: error.message };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    menu,
    items,
    submitting,
    orderDate,
    submitOrder,
  };
};
