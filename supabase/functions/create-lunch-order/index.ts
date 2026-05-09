import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
  site: "town" | "country";
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authentication required");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) throw new Error("Invalid authentication");

    const orderData: OrderRequest = await req.json();

    if (
      !orderData.orderDate ||
      !orderData.site ||
      !["town", "country"].includes(orderData.site) ||
      !Array.isArray(orderData.items) ||
      orderData.items.length === 0 ||
      !orderData.memberName?.trim() ||
      !orderData.memberPhone?.trim()
    ) {
      throw new Error("Missing or invalid order information");
    }

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
        site: orderData.site,
        items: orderData.items,
        total_amount: orderData.totalAmount,
        member_name: orderData.memberName.trim(),
        member_phone: orderData.memberPhone.trim(),
        notes: orderData.notes?.trim() || null,
        status: "confirmed",
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error(orderError.message || "Failed to create order");
    }

    console.log("Thai takeaway order created:", order.id, "site:", orderData.site);

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        orderRef: order.id.substring(0, 8).toUpperCase(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error in create-lunch-order:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
