import { useState, useEffect, useCallback } from 'react';
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

  const loadMenuAndAvailability = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🍽️ Starting to load lunch data...');
      console.log('🔍 User ID:', user?.id);
      console.log('🔄 Loading state set to true');
      
      // Load menu from database directly since the edge function might be having issues
      console.log('📋 Fetching menu from database...');
      const { data: menuItems, error: menuError } = await (supabase as any)
        .from('lunch_menu')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('sort_order');

      if (menuError) {
        console.error('❌ Menu database error:', menuError);
        throw menuError;
      }

      console.log('✅ Menu items received:', menuItems?.length || 0, 'items');
      console.log('📋 Menu items data:', menuItems);
      
      // Group items by category — sandwiches/mains and beverages, with everything else as a "main"
      const sandwiches = menuItems?.filter((item: any) => item.category !== 'beverage') || [];
      const beverages = menuItems?.filter((item: any) => item.category === 'beverage') || [];

      console.log('🍜 Mains:', sandwiches.length, '🥤 Beverages:', beverages.length);

      setMenu({ sandwiches, beverages });

      // No more time/cutoff restrictions — always open.
      setAvailability({
        available: true,
        totalSandwichesLeft: 999,
        userCanOrder: true,
        userSandwichCount: 0,
        timeSlots: [],
        orderDate,
      });

      console.log('🎉 Lunch data loaded successfully!');

    } catch (error: any) {
      console.error('💥 Error loading lunch data:', error);
      toast({
        title: "Error",
        description: `Failed to load lunch menu. ${error.message || 'Please try again.'}`,
        variant: "destructive",
      });
      
      // Set default unavailable state
      setAvailability({
        available: false,
        reason: "Unable to load lunch data",
        totalSandwichesLeft: 0,
        userCanOrder: false,
        userSandwichCount: 0,
        timeSlots: [],
        orderDate
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, orderDate, toast]);

  useEffect(() => {
    // Load menu data on component mount
    loadMenuAndAvailability();
  }, [loadMenuAndAvailability]);

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

// Helper function to format time
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}