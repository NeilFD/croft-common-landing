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
    if (user?.id) {
      loadMenuAndAvailability();
    }
  }, [user?.id]); // Only depend on user.id, not the entire user object

  const loadMenuAndAvailability = async () => {
    try {
      setLoading(true);
      console.log('🍽️ Starting to load lunch data...');
      
      // Load menu from database directly since the edge function might be having issues
      console.log('📋 Fetching menu from database...');
      const { data: menuItems, error: menuError } = await supabase
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
      
      // Group items by category
      const sandwiches = menuItems?.filter(item => item.category === 'sandwich') || [];
      const beverages = menuItems?.filter(item => item.category === 'beverage') || [];
      
      console.log('🥪 Sandwiches:', sandwiches.length, '🥤 Beverages:', beverages.length);
      
      setMenu({ sandwiches, beverages });

      // For now, let's create a simple availability response until we fix the edge function
      console.log('⏰ Creating availability data...');
      
      // Get time slots from database  
      const { data: timeSlots, error: timeSlotsError } = await supabase
        .from('lunch_time_slots')
        .select('*')
        .eq('is_active', true)
        .order('slot_time');

      if (timeSlotsError) {
        console.error('❌ Time slots error:', timeSlotsError);
        throw timeSlotsError;
      }

      console.log('⏰ Time slots received:', timeSlots?.length || 0, 'slots');

      // Check if it's a weekday
      const today = new Date();
      const dayOfWeek = today.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5; // Monday to Friday

      console.log('📅 Today is day', dayOfWeek, 'isWeekday:', isWeekday);

      // Check if it's past 3 PM cutoff
      const now = new Date();
      const cutoffTime = new Date();
      cutoffTime.setHours(15, 0, 0, 0); // 3 PM
      const isPastCutoff = now > cutoffTime;

      console.log('🕐 Current time:', now.toISOString(), 'Past cutoff:', isPastCutoff);

      if (!isWeekday) {
        setAvailability({
          available: false,
          reason: "Lunch Run is only available Monday to Friday",
          totalSandwichesLeft: 0,
          userCanOrder: false,
          userSandwichCount: 0,
          timeSlots: [],
          orderDate
        });
        return;
      }

      if (isPastCutoff) {
        setAvailability({
          available: false,
          reason: "Orders must be placed before 3:00 PM",
          totalSandwichesLeft: 0,
          userCanOrder: false,
          userSandwichCount: 0,
          timeSlots: [],
          orderDate
        });
        return;
      }

      // Create available time slots (simplified - assume all slots are available for now)
      const availableTimeSlots = timeSlots?.map(slot => ({
        id: slot.id,
        time: slot.slot_time,
        displayTime: formatTime(slot.slot_time),
        available: true,
        ordersCount: 0,
        maxOrders: slot.max_orders,
        spotsLeft: slot.max_orders
      })) || [];

      console.log('✅ Available time slots:', availableTimeSlots.length);

      setAvailability({
        available: true,
        totalSandwichesLeft: 60,
        userCanOrder: true,
        userSandwichCount: 0,
        timeSlots: availableTimeSlots,
        orderDate
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

// Helper function to format time
function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}