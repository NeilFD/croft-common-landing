import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Generating daily order schedule for ${today}`);

    // Fetch all confirmed orders for today
    const { data: orders, error: ordersError } = await supabaseService
      .from("lunch_orders")
      .select("*")
      .eq("order_date", today)
      .eq("status", "confirmed")
      .order("collection_time", { ascending: true });

    if (ordersError) {
      console.error("Error fetching orders:", ordersError);
      throw ordersError;
    }

    if (!orders || orders.length === 0) {
      console.log("No orders found for today");
      return new Response(
        JSON.stringify({ message: "No orders for today" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Group orders by collection time
    const ordersByTime = orders.reduce((acc: any, order: any) => {
      const time = order.collection_time;
      if (!acc[time]) {
        acc[time] = [];
      }
      acc[time].push(order);
      return acc;
    }, {});

    // Sort time slots
    const timeSlots = Object.keys(ordersByTime).sort();

    // Calculate totals
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0);
    const totalItems = orders.reduce((sum: number, order: any) => {
      return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
    }, 0);

    // Generate email content
    const baseUrl = "http://croftcommontest.com";
    const logoUrl = `${baseUrl}/brand/logo.png`;
    const orderDate = new Date(today).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Generate time slot sections
    const timeSlotSections = timeSlots.map(time => {
      const timeOrders = ordersByTime[time];
      const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      const orderRows = timeOrders.map((order: any) => {
        const itemsList = order.items.map((item: any) => 
          `${item.name} x${item.quantity}`
        ).join(', ');

        return `
          <tr style="border-bottom: 1px solid #e5e5e5;">
            <td style="padding: 12px 8px; vertical-align: top;">
              <strong>${order.member_name}</strong><br>
              <small style="color: #666;">${order.member_phone}</small>
            </td>
            <td style="padding: 12px 8px; vertical-align: top;">
              ${itemsList}
              ${order.notes ? `<br><em style="color: #ff1b6b; font-size: 12px;">Note: ${order.notes}</em>` : ''}
            </td>
            <td style="padding: 12px 8px; text-align: right; vertical-align: top;">
              <strong>£${order.total_amount}</strong>
            </td>
          </tr>
        `;
      }).join('');

      const slotTotal = timeOrders.reduce((sum: number, order: any) => sum + parseFloat(order.total_amount), 0);
      const slotItemCount = timeOrders.reduce((sum: number, order: any) => {
        return sum + order.items.reduce((itemSum: number, item: any) => itemSum + item.quantity, 0);
      }, 0);

      return `
        <div style="margin-bottom: 40px; border: 1px solid #e5e5e5; background: #ffffff;">
          <div style="background: #ff1b6b; color: white; padding: 15px; text-align: center;">
            <h3 style="margin: 0; font-family: 'Oswald', Arial Black, sans-serif; font-size: 20px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;">
              ${formattedTime}
            </h3>
            <div style="font-size: 14px; margin-top: 5px;">
              ${timeOrders.length} orders • ${slotItemCount} items • £${slotTotal.toFixed(2)}
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f8f8f8;">
                <th style="padding: 12px 8px; text-align: left; font-family: 'Work Sans', Arial, sans-serif; font-weight: 600; border-bottom: 2px solid #e5e5e5;">Customer</th>
                <th style="padding: 12px 8px; text-align: left; font-family: 'Work Sans', Arial, sans-serif; font-weight: 600; border-bottom: 2px solid #e5e5e5;">Items</th>
                <th style="padding: 12px 8px; text-align: right; font-family: 'Work Sans', Arial, sans-serif; font-weight: 600; border-bottom: 2px solid #e5e5e5;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderRows}
            </tbody>
          </table>
        </div>
      `;
    }).join('');

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Work+Sans:wght@400;600&display=swap" rel="stylesheet">
        <title>Daily Lunch Order Schedule</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f5f5f5; font-family: 'Work Sans', Arial, sans-serif;">
        <div style="max-width: 800px; margin: 0 auto; background: #ffffff; box-shadow: 0 10px 20px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%); padding: 40px 20px; text-align: center;">
            <img src="${logoUrl}" alt="Croft Common Logo" style="width: 80px; height: 80px; margin: 0 auto 20px; display: block; object-fit: contain;" />
            <h1 style="color: #ffffff; font-family: 'Oswald', Arial Black, sans-serif; font-size: 28px; font-weight: 700; letter-spacing: 0.2em; margin: 0; text-transform: uppercase;">DAILY LUNCH SCHEDULE</h1>
            <div style="color: #ff1b6b; font-family: 'Work Sans', Arial, sans-serif; font-size: 18px; margin-top: 10px; font-weight: 600;">
              ${orderDate}
            </div>
          </div>
          
          <!-- Summary -->
          <div style="background: #f8f8f8; padding: 30px; border-bottom: 3px solid #ff1b6b;">
            <div style="display: flex; justify-content: space-around; text-align: center;">
              <div>
                <div style="font-family: 'Oswald', Arial Black, sans-serif; font-size: 32px; font-weight: 700; color: #ff1b6b; margin: 0;">${totalOrders}</div>
                <div style="font-family: 'Work Sans', Arial, sans-serif; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">Total Orders</div>
              </div>
              <div>
                <div style="font-family: 'Oswald', Arial Black, sans-serif; font-size: 32px; font-weight: 700; color: #ff1b6b; margin: 0;">${totalItems}</div>
                <div style="font-family: 'Work Sans', Arial, sans-serif; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">Total Items</div>
              </div>
              <div>
                <div style="font-family: 'Oswald', Arial Black, sans-serif; font-size: 32px; font-weight: 700; color: #ff1b6b; margin: 0;">£${totalRevenue.toFixed(2)}</div>
                <div style="font-family: 'Work Sans', Arial, sans-serif; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 0.1em;">Total Revenue</div>
              </div>
            </div>
          </div>
          
          <!-- Time Slots -->
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #000000; font-family: 'Oswald', Arial Black, sans-serif; font-size: 24px; font-weight: 400; letter-spacing: 0.05em; margin: 0 0 30px 0; text-transform: uppercase; text-align: center;">Collection Schedule</h2>
            
            ${timeSlotSections}
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f8f8; padding: 20px; text-align: center; border-top: 2px solid #ff1b6b;">
            <img src="${logoUrl}" alt="Croft Common Logo" style="width: 40px; height: 40px; margin: 0 auto 10px; display: block; object-fit: contain;" />
            <p style="color: #666666; font-family: 'Work Sans', Arial, sans-serif; font-size: 12px; line-height: 1.4; margin: 0;">Croft Common Kitchen Schedule • Generated at ${new Date().toLocaleTimeString()}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send the schedule email
    const emailResponse = await resend.emails.send({
      from: 'Croft Common Kitchen <hello@thehive-hospitality.com>',
      to: ['neil@croftcommon.co.uk'],
      subject: `Daily Lunch Schedule - ${orderDate} (${totalOrders} orders)`,
      html: emailHtml,
    });

    console.log("Daily schedule email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Daily order schedule sent successfully",
        totalOrders,
        totalRevenue: totalRevenue.toFixed(2),
        emailId: emailResponse.data?.id
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in send-daily-order-schedule:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});