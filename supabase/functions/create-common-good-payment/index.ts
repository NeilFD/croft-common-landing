import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

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
    if (!stripeKey) {
      throw new Error("Missing STRIPE_SECRET_KEY");
    }

    const { amount_cents } = await req.json();
    const amount = Number(amount_cents);
    if (!Number.isFinite(amount) || amount < 100) {
      throw new Error("Invalid amount. Minimum is 100 (e.g., £1.00)");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const origin = req.headers.get("origin") || "http://127.0.0.1:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      metadata: { category: "common_good" },
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: { name: "Common Good Fund Contribution" },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/common-good/message?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/common-good`,
    });

    return new Response(JSON.stringify({ url: session.url }), {
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
