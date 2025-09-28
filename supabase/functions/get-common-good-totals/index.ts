import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper to check if a session belongs to Common Good
function isCommonGoodSession(session: any, productId?: string) {
  try {
    // Prefer explicit metadata marker if present
    if (session?.metadata?.category === "common_good") return true;

    // If a productId is provided, match line items to it
    const items = session?.line_items?.data ?? [];
    if (productId) {
      for (const it of items) {
        const price = it.price as any;
        // price.product can be string or object
        const prod = typeof price?.product === "string" ? price.product : price?.product?.id;
        if (prod && prod === productId) return true;
      }
    }

    // Fallback: match by name/description heuristics
    for (const it of items) {
      const desc: string = it?.description ?? "";
      if (/common\s+good/i.test(desc)) return true;
    }
  } catch (_) {}
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Missing STRIPE_SECRET_KEY");

    const commonGoodProductId = Deno.env.get("STRIPE_COMMON_GOOD_PRODUCT_ID") || undefined;

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    let totalCents = 0;
    let hasMore = true;
    let starting_after: string | undefined = undefined;

    // Paginate through all paid checkout sessions and sum totals for Common Good
    while (hasMore) {
      const page: any = await stripe.checkout.sessions.list({
        limit: 100,
        expand: ["data.line_items"],
        ...(starting_after ? { starting_after } : {}),
      } as any);

      for (const s of page.data) {
        if (s.mode !== "payment") continue;
        if (s.payment_status !== "paid") continue;
        if (!s.amount_total) continue;
        if (isCommonGoodSession(s, commonGoodProductId)) {
          totalCents += s.amount_total;
        }
      }

      hasMore = page.has_more;
      starting_after = hasMore ? page.data[page.data.length - 1]?.id : undefined;
    }

    const common_people_total_cents = totalCents;
    const croft_common_total_cents = totalCents; // matched amount
    const combined_total_cents = totalCents * 2;

    return new Response(
      JSON.stringify({
        common_people_total_cents,
        croft_common_total_cents,
        combined_total_cents,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[get-common-good-totals] Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
