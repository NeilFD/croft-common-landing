import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!stripeKey || !supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing required environment variables");
    }

    const { session_id, message } = await req.json();
    if (!session_id || typeof session_id !== "string") {
      throw new Error("Missing session_id");
    }
    if (!message || typeof message !== "string") {
      throw new Error("Missing message");
    }

    const cleanMessage = message.trim().slice(0, 250);
    if (cleanMessage.length === 0) {
      throw new Error("Message cannot be empty");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (!session) throw new Error("Session not found");
    if (session.payment_status !== "paid" || session.status !== "complete") {
      throw new Error("Payment not completed");
    }

    const amount = session.amount_total ?? 0;
    const currency = session.currency ?? "gbp";
    if (!amount || amount <= 0) throw new Error("Invalid amount from session");

    const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

    const { error: insertError } = await supabase
      .from("common_good_messages")
      .insert({
        stripe_session_id: session_id,
        amount_cents: amount,
        currency,
        message: cleanMessage,
      });

    if (insertError) {
      if (insertError.code === "23505") {
        // Unique violation on stripe_session_id
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error(insertError.message);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
