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
      console.log('🍽️ Loading lunch menu and availability...');
      
      // Load menu
      console.log('📋 Fetching menu...');
      const { data: menuData, error: menuError } = await supabase.functions.invoke('get-lunch-menu');
      if (menuError) {
        console.error('❌ Menu error:', menuError);
        throw menuError;
      }
      console.log('✅ Menu data received:', menuData);
      setMenu(menuData);

      // Load availability - use GET request with query parameters
      console.log('⏰ Fetching availability for date:', orderDate, 'user:', user?.id);
      const response = await fetch(
        `https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/get-lunch-availability?date=${encodeURIComponent(orderDate)}&userId=${encodeURIComponent(user?.id || '')}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU`,
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU',
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('📡 Availability response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Availability HTTP error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const availData = await response.json();
      console.log('✅ Availability data received:', availData);
      
      if (availData.error) {
        throw new Error(availData.error);
      }
      setAvailability(availData);

    } catch (error: any) {
      console.error('💥 Error loading lunch data:', error);
      toast({
        title: "Error",
        description: `Failed to load lunch menu. ${error.message || 'Please try again.'}`,
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