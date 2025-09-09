import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 get-lunch-availability: Starting request...');
    
    let date, userId;
    
    // Try to get parameters from URL first (GET request), then from body (POST request)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      date = url.searchParams.get("date");
      userId = url.searchParams.get("userId");
    } else {
      // POST request - read from body
      const body = await req.json();
      date = body.date;
      userId = body.userId;
    }

    console.log('🔧 get-lunch-availability: Parameters - date:', date, 'userId:', userId);

    if (!date) {
      console.error('❌ get-lunch-availability: Date parameter is required');
      throw new Error("Date parameter is required");
    }

    // Get the JWT token from the Authorization header
    const authHeader = req.headers.get('Authorization');
    console.log('🔧 get-lunch-availability: Auth header:', authHeader ? 'present' : 'missing');

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: authHeader ? {
            Authorization: authHeader,
          } : {},
        },
      }
    );

    console.log('🔧 get-lunch-availability: Supabase client created');

    // Check if it's a weekday (Monday = 1, Friday = 5)
    const orderDate = new Date(date);
    const dayOfWeek = orderDate.getDay();
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    console.log('🔧 get-lunch-availability: Day of week:', dayOfWeek, 'isWeekday:', isWeekday);

    if (!isWeekday) {
      console.log('🔧 get-lunch-availability: Not a weekday, returning unavailable');
      return new Response(
        JSON.stringify({
          available: false,
          reason: "Lunch Run is only available Monday to Friday",
          timeSlots: []
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Check if it's past 11 AM cutoff
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const cutoffTime = new Date(`${today}T11:00:00`);
    const isPastCutoff = date === today && now > cutoffTime;

    console.log('🔧 get-lunch-availability: Current time:', now, 'cutoff:', cutoffTime, 'isPastCutoff:', isPastCutoff);

    if (isPastCutoff) {
      console.log('🔧 get-lunch-availability: Past cutoff time, returning unavailable');
      return new Response(
        JSON.stringify({
          available: false,
          reason: "Orders must be placed before 11:00 AM",
          timeSlots: []
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get time slots
    const { data: timeSlots, error: slotsError } = await supabaseClient
      .from("lunch_time_slots")
      .select("*")
      .eq("is_active", true)
      .order("slot_time");

    if (slotsError) throw slotsError;

    // Get availability for the date
    const { data: availability, error: availError } = await supabaseClient
      .from("lunch_availability")
      .select("*")
      .eq("date", date);

    if (availError) throw availError;

    // Check user's existing orders for the date (max 2 per day)
    let userOrderCount = 0;
    if (userId) {
      console.log('🔧 get-lunch-availability: Checking user orders for userId:', userId, 'date:', date);
      
      const { data: userOrders, error: ordersError } = await supabaseClient
        .from("lunch_orders")
        .select("items")
        .eq("user_id", userId)
        .eq("order_date", date)
        .neq("status", "cancelled");

      if (ordersError) {
        console.error('❌ get-lunch-availability: Error fetching user orders:', ordersError);
        throw ordersError;
      }

      console.log('🔧 get-lunch-availability: Found user orders:', userOrders);

      // Count total sandwiches ordered (not total orders)
      userOrderCount = userOrders?.reduce((total, order) => {
        console.log('🔧 get-lunch-availability: Processing order items:', order.items);
        const sandwiches = order.items?.filter((item: any) => {
          console.log('🔧 get-lunch-availability: Item category:', item.category);
          return item.category === 'sandwich';
        }) || [];
        console.log('🔧 get-lunch-availability: Found sandwiches:', sandwiches);
        const orderSandwichCount = sandwiches.reduce((sum: number, item: any) => {
          console.log('🔧 get-lunch-availability: Sandwich quantity:', item.quantity);
          return sum + (item.quantity || 0);
        }, 0);
        console.log('🔧 get-lunch-availability: Order sandwich count:', orderSandwichCount);
        return total + orderSandwichCount;
      }, 0) || 0;
      
      console.log('🔧 get-lunch-availability: Final user sandwich count:', userOrderCount);
    }

    // Calculate total sandwiches ordered for the day
    const totalSandwichesOrdered = availability?.reduce((total, slot) => {
      return total + (slot.orders_count || 0);
    }, 0) || 0;

    // Build time slots with availability
    const availableTimeSlots = timeSlots?.map(slot => {
      const slotAvailability = availability?.find(a => a.slot_time === slot.slot_time);
      const ordersCount = slotAvailability?.orders_count || 0;
      const maxOrders = slotAvailability?.max_orders || slot.max_orders;
      
      return {
        id: slot.id,
        time: slot.slot_time,
        displayTime: formatTime(slot.slot_time),
        available: ordersCount < maxOrders,
        ordersCount,
        maxOrders,
        spotsLeft: Math.max(0, maxOrders - ordersCount)
      };
    }) || [];

    return new Response(
      JSON.stringify({
        available: isWeekday && !isPastCutoff,
        totalSandwichesLeft: Math.max(0, 60 - totalSandwichesOrdered),
        userCanOrder: userOrderCount < 2,
        userSandwichCount: userOrderCount,
        timeSlots: availableTimeSlots,
        orderDate: date
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in get-lunch-availability:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${displayHour}:${minutes} ${ampm}`;
}