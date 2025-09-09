import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
}

interface TimeSlot {
  id: string;
  time: string;
  displayTime: string;
  available: boolean;
  ordersCount: number;
  maxOrders: number;
  spotsLeft: number;
}

interface LunchAvailability {
  available: boolean;
  reason?: string;
  totalSandwichesLeft: number;
  userCanOrder: boolean;
  userSandwichCount: number;
  timeSlots: TimeSlot[];
  orderDate: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

export const useLunchRun = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<{ sandwiches: MenuItem[], beverages: MenuItem[] }>({ 
    sandwiches: [], 
    beverages: [] 
  });
  const [availability, setAvailability] = useState<LunchAvailability | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const orderDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (user) {
      loadMenuAndAvailability();
    }
  }, [user]);

  const loadMenuAndAvailability = async () => {
    try {
      setLoading(true);
      
      // Load menu
      const { data: menuData, error: menuError } = await supabase.functions.invoke('get-lunch-menu');
      if (menuError) throw menuError;
      setMenu(menuData);

      // Load availability
      const { data: availData, error: availError } = await supabase.functions.invoke('get-lunch-availability', {
        body: { date: orderDate, userId: user?.id }
      });
      if (availError) throw availError;
      setAvailability(availData);

    } catch (error: any) {
      console.error('Error loading lunch data:', error);
      toast({
        title: "Error",
        description: "Failed to load lunch menu. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitOrder = async (orderData: {
    orderDate: string;
    collectionTime: string;
    items: OrderItem[];
    totalAmount: number;
    memberName: string;
    memberPhone: string;
    notes?: string;
  }) => {
    try {
      setSubmitting(true);

      const { data, error } = await supabase.functions.invoke('create-lunch-order', {
        body: orderData
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "Order Placed!",
          description: "Your lunch order has been confirmed.",
        });
        return { success: true, orderId: data.orderId };
      } else {
        throw new Error(data.error || 'Failed to place order');
      }

    } catch (error: any) {
      console.error('Error submitting order:', error);
      toast({
        title: "Order Failed",
        description: error.message || "Failed to place order. Please try again.",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setSubmitting(false);
    }
  };

  return {
    loading,
    menu,
    availability,
    submitting,
    orderDate,
    loadMenuAndAvailability,
    submitOrder
  };
};