import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Check cutoff time (3 PM for testing)
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const cutoffTime = new Date(`${today}T15:00:00`);
    
    if (orderData.orderDate === today && now > cutoffTime) {
      throw new Error("Orders must be placed before 3:00 PM");
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

    // Check if order already exists to prevent duplicates
    const { data: existingOrder } = await supabaseService
      .from("lunch_orders")
      .select("id")
      .eq("user_id", user.id)
      .eq("order_date", orderData.orderDate)
      .eq("collection_time", orderData.collectionTime)
      .eq("status", "confirmed")
      .maybeSingle();

    if (existingOrder) {
      throw new Error("You already have an order for this time slot today");
    }

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
        status: 'confirmed',
        payment_status: 'completed'
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      
      // Provide more specific error messages
      if (orderError.message?.includes('duplicate key') || orderError.code === '23505') {
        if (orderError.message?.includes('unique_receipt_ledger_entry')) {
          throw new Error("Duplicate order detected. Please refresh and try again.");
        } else {
          throw new Error("You already have an order for this time slot today");
        }
      } else {
        throw new Error(`Failed to create order: ${orderError.message || 'Unknown error'}`);
      }
    }

    console.log("Order created successfully:", order.id);

    // Send confirmation emails
    await sendOrderConfirmationEmails(order, user);

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

// Email sending function
async function sendOrderConfirmationEmails(order: any, user: any) {
  try {
    const baseUrl = "http://croftcommontest.com";
    const logoUrl = `${baseUrl}/brand/logo.png`;
    
    // Format collection time
    const collectionTime = new Date(`2000-01-01T${order.collection_time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    // Format order date
    const orderDate = new Date(order.order_date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate order items list
    const itemsList = order.items.map((item: any) => 
      `<li style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
        <div style="display: flex; justify-content: space-between;">
          <span style="font-weight: 600;">${item.name}</span>
          <span>£${item.price.toFixed(2)} x ${item.quantity}</span>
        </div>
      </li>`
    ).join('');

    // Member confirmation email
    const memberEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
        <title>Lunch Order Confirmed</title>
      </head>
      <body style="margin: 0; padding: 0; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); font-family: 'Work Sans', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
          
          <!-- Header -->
          <div style="background: #ffffff; padding: 40px 20px; text-align: center; border-bottom: 4px solid #ff1b6b;">
            <img src="${logoUrl}" alt="Croft Common Logo" style="width: 90px; height: 90px; margin: 0 auto 20px; display: block; object-fit: contain;" />
            <h1 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">LUNCH RUN</h1>
            <div style="width: 40px; height: 3px; background: #ff1b6b; margin: 15px auto 0;"></div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 24px; font-weight: 400; letter-spacing: 0.05em; margin: 0 0 30px 0; text-transform: uppercase;">Order Confirmed!</h2>
            
            <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 18px; line-height: 1.7; margin: 0 0 25px 0; font-weight: 400;">Hi ${order.member_name},</p>
            
            <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.7; margin: 0 0 25px 0;">Your lunch order has been confirmed and will be ready for collection.</p>
            
            <!-- Order Details Box -->
            <div style="background: #f8f8f8; border: 2px solid #ff1b6b; padding: 30px; margin: 30px 0;">
              <h3 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 0.1em; margin: 0 0 20px 0; text-transform: uppercase;">Collection Details</h3>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #ff1b6b; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px;">Date:</strong>
                <span style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; margin-left: 10px;">${orderDate}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #ff1b6b; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px;">Time:</strong>
                <span style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; margin-left: 10px;">${collectionTime}</span>
              </div>
              
              <div style="margin-bottom: 20px;">
                <strong style="color: #ff1b6b; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px;">Order ID:</strong>
                <span style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; margin-left: 10px;">#${order.id.substring(0, 8)}</span>
              </div>
            </div>
            
            <!-- Items List -->
            <div style="margin: 30px 0;">
              <h3 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 18px; font-weight: 700; letter-spacing: 0.1em; margin: 0 0 15px 0; text-transform: uppercase;">Your Order</h3>
              <ul style="list-style: none; padding: 0; margin: 0; border: 1px solid #e5e5e5;">
                ${itemsList}
              </ul>
              <div style="background: #ff1b6b; color: white; padding: 15px; text-align: right; font-weight: 700; font-size: 18px;">
                Total: £${order.total_amount.toFixed(2)}
              </div>
            </div>
            
            ${order.notes ? `<div style="background: #f0f0f0; border-left: 4px solid #ff1b6b; padding: 15px; margin: 20px 0;">
              <strong style="color: #333333;">Special Notes:</strong><br>
              <span style="color: #666666; font-style: italic;">${order.notes}</span>
            </div>` : ''}
            
            <p style="color: #333333; font-family: 'Work Sans', Arial, sans-serif; font-size: 16px; line-height: 1.7; margin: 30px 0 25px 0;">Please arrive at your collection time. If you need to make any changes, please contact us as soon as possible.</p>
            
            <div style="text-align: right; border-top: 1px solid #e5e5e5; padding-top: 25px;">
              <p style="color: #1a1a1a; font-family: 'Oswald', Arial, sans-serif; font-size: 16px; font-weight: 400; margin: 0; letter-spacing: 0.1em;">— CROFT COMMON</p>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #ffffff; padding: 30px; text-align: center; border-top: 2px solid #ff1b6b;">
            <img src="${logoUrl}" alt="Croft Common Logo" style="width: 45px; height: 45px; margin: 0 auto 10px; display: block; object-fit: contain;" />
            <p style="color: #666666; font-family: 'Work Sans', Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0;">Croft Common, Stokes Croft, Bristol</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Business notification email
    const businessEmailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
        <title>New Lunch Order</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: 'Work Sans', Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: #ffffff; padding: 30px 20px; text-align: center; border-bottom: 3px solid #ff1b6b;">
            <img src="${logoUrl}" alt="Croft Common Logo" style="width: 60px; height: 60px; margin: 0 auto 15px; display: block; object-fit: contain;" />
            <h1 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: 0.1em; margin: 0; text-transform: uppercase;">New Lunch Order</h1>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px; background: #ffffff;">
            <div style="background: #f8f8f8; border-left: 4px solid #ff1b6b; padding: 20px; margin-bottom: 20px;">
              <h2 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 18px; font-weight: 400; margin: 0 0 15px 0; text-transform: uppercase;">Order Details</h2>
              
              <div style="margin-bottom: 10px;">
                <strong>Customer:</strong> ${order.member_name}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Phone:</strong> ${order.member_phone}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Collection Date:</strong> ${orderDate}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Collection Time:</strong> ${collectionTime}
              </div>
              <div style="margin-bottom: 10px;">
                <strong>Order ID:</strong> #${order.id.substring(0, 8)}
              </div>
            </div>
            
            <!-- Items List -->
            <div style="margin: 20px 0;">
              <h3 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 16px; font-weight: 700; margin: 0 0 10px 0; text-transform: uppercase;">Items Ordered</h3>
              <ul style="list-style: none; padding: 0; margin: 0; border: 1px solid #e5e5e5;">
                ${itemsList}
              </ul>
              <div style="background: #333; color: white; padding: 10px; text-align: right; font-weight: 700;">
                Total: £${order.total_amount.toFixed(2)}
              </div>
            </div>
            
            ${order.notes ? `<div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0;">
              <strong style="color: #856404;">Special Notes:</strong><br>
              <span style="color: #856404;">${order.notes}</span>
            </div>` : ''}
          </div>
        </div>
      </body>
      </html>
    `;

    // Send member confirmation email
    await resend.emails.send({
      from: 'Croft Common <hello@thehive-hospitality.com>',
      to: [user.email],
      subject: `Lunch Order Confirmed - Collection ${collectionTime}`,
      html: memberEmailHtml,
    });

    // Send business notification email
    await resend.emails.send({
      from: 'Croft Common <hello@thehive-hospitality.com>',
      to: ['neil@croftcommon.co.uk'],
      subject: `New Lunch Order - ${order.member_name} - ${collectionTime}`,
      html: businessEmailHtml,
    });

    console.log("Order confirmation emails sent successfully");
  } catch (error) {
    console.error("Error sending confirmation emails:", error);
    // Don't throw error as order was already created successfully
  }
}