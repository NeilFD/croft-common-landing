import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

interface OrderRequest {
  orderDate: string;
  collectionTime: string;
  items: OrderItem[];
  totalAmount: number;
  memberName: string;
  memberPhone: string;
  notes?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authentication required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Invalid authentication");
    }

    const orderData: OrderRequest = await req.json();

    // Validate order data
    if (!orderData.orderDate || !orderData.collectionTime || !orderData.items || !orderData.memberName || !orderData.memberPhone) {
      throw new Error("Missing required order information");
    }

    // Validate order date is weekday
    const orderDate = new Date(orderData.orderDate);
    const dayOfWeek = orderDate.getDay();
    if (dayOfWeek < 1 || dayOfWeek > 5) {
      throw new Error("Orders can only be placed for weekdays");
    }

    // Check cutoff time (11 AM)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const cutoffTime = new Date(`${today}T11:00:00`);
    
    if (orderData.orderDate === today && now > cutoffTime) {
      throw new Error("Orders must be placed before 11:00 AM");
    }

    // Count sandwiches in order
    const sandwiches = orderData.items.filter(item => item.category === 'sandwich');
    const sandwichCount = sandwiches.reduce((sum, item) => sum + item.quantity, 0);

    // Check user's existing orders for the day
    const { data: existingOrders, error: existingOrdersError } = await supabaseClient
      .from("lunch_orders")
      .select("items")
      .eq("user_id", user.id)
      .eq("order_date", orderData.orderDate)
      .neq("status", "cancelled");

    if (existingOrdersError) throw existingOrdersError;

    const existingSandwichCount = existingOrders?.reduce((total, order) => {
      const existingSandwiches = order.items?.filter((item: any) => item.category === 'sandwich') || [];
      return total + existingSandwiches.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    }, 0) || 0;

    if (existingSandwichCount + sandwichCount > 2) {
      throw new Error("Maximum 2 sandwiches per member per day");
    }

    // Check total daily capacity (60 sandwiches)
    const { data: dailyAvailability, error: availError } = await supabaseClient
      .from("lunch_availability")
      .select("orders_count")
      .eq("date", orderData.orderDate);

    if (availError) throw availError;

    const totalOrderedToday = dailyAvailability?.reduce((sum, slot) => sum + (slot.orders_count || 0), 0) || 0;
    
    if (totalOrderedToday + sandwichCount > 60) {
      throw new Error("Daily sandwich limit reached");
    }

    // Check time slot availability
    const { data: slotAvailability, error: slotError } = await supabaseClient
      .from("lunch_availability")
      .select("*")
      .eq("date", orderData.orderDate)
      .eq("slot_time", orderData.collectionTime)
      .single();

    if (slotError && slotError.code !== 'PGRST116') throw slotError;

    const currentSlotOrders = slotAvailability?.orders_count || 0;
    if (currentSlotOrders >= 10) {
      throw new Error("Selected time slot is full");
    }

    // Create the order using service role to ensure it triggers the functions
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: order, error: orderError } = await supabaseService
      .from("lunch_orders")
      .insert({
        user_id: user.id,
        order_date: orderData.orderDate,
        collection_time: orderData.collectionTime,
        items: orderData.items,
        total_amount: orderData.totalAmount,
        member_name: orderData.memberName,
        member_phone: orderData.memberPhone,
        notes: orderData.notes || null,
        status: 'pending',
        payment_status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    console.log("Order created successfully:", order.id);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        message: "Order placed successfully"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in create-lunch-order:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});