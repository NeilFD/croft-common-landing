// Create a Stripe Embedded Checkout session.
// Modes:
//   - kind: 'gold'    -> subscription to Bear's Den Gold (£69/mo)
//   - kind: 'lunch'   -> dynamic-priced one-time payment for a takeaway basket
import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type StripeEnv,
  createStripeClient,
  resolveOrCreateCustomer,
} from "../_shared/stripe.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface BasketItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

async function createGoldSession(opts: {
  stripe: ReturnType<typeof createStripeClient>;
  userId: string;
  email: string;
  returnUrl: string;
  referralCode?: string | null;
}) {
  const prices = await opts.stripe.prices.list({ lookup_keys: ["gold_monthly"] });
  if (!prices.data.length) throw new Error("Gold price not configured");

  const customerId = await resolveOrCreateCustomer(opts.stripe, {
    email: opts.email,
    userId: opts.userId,
  });

  // Resolve referral -> attach referrer metadata; coupon credit applied by webhook.
  let referrerUserId: string | null = null;
  if (opts.referralCode) {
    const { data: ref } = await supabase
      .from("member_referrals")
      .select("user_id")
      .eq("code", opts.referralCode.trim().toUpperCase())
      .maybeSingle();
    if (ref && ref.user_id !== opts.userId) referrerUserId = ref.user_id;
  }

  const session = await opts.stripe.checkout.sessions.create({
    line_items: [{ price: prices.data[0].id, quantity: 1 }],
    mode: "subscription",
    ui_mode: "embedded_page",
    return_url: opts.returnUrl,
    customer: customerId,
    metadata: {
      userId: opts.userId,
      kind: "gold",
      ...(referrerUserId && { referrerUserId, referralCode: opts.referralCode! }),
    },
    subscription_data: {
      metadata: {
        userId: opts.userId,
        ...(referrerUserId && { referrerUserId, referralCode: opts.referralCode! }),
      },
    },
  });
  return session.client_secret;
}

async function createLunchSession(opts: {
  stripe: ReturnType<typeof createStripeClient>;
  userId: string;
  email: string;
  site: "town" | "country";
  items: BasketItem[];
  memberName: string;
  memberPhone: string;
  notes?: string;
  returnUrl: string;
}) {
  // Server-side validation against the menu
  const ids = opts.items.map((i) => i.id);
  const { data: menuRows, error } = await supabase
    .from("lunch_menu")
    .select("id, name, price, is_available, site")
    .in("id", ids);
  if (error) throw error;

  const menuMap = new Map(menuRows!.map((r: any) => [r.id, r]));
  let subtotal = 0;
  const validatedItems: BasketItem[] = [];
  for (const item of opts.items) {
    const row = menuMap.get(item.id) as any;
    if (!row || !row.is_available) throw new Error(`Item unavailable: ${item.name}`);
    if (row.site !== "both" && row.site !== opts.site) {
      throw new Error(`Item not available at ${opts.site}: ${row.name}`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new Error("Invalid quantity");
    }
    subtotal += Number(row.price) * item.quantity;
    validatedItems.push({ ...item, name: row.name, price: Number(row.price) });
  }

  // Gold discount: 25% off if active subscription
  const { data: isGoldRow } = await supabase.rpc("is_gold", { check_user_id: opts.userId });
  const isGold = !!isGoldRow;
  const discount = isGold ? Math.round(subtotal * 25) / 100 : 0; // pence rounding
  const total = Math.max(0, subtotal - discount);
  const totalPence = Math.round(total * 100);
  if (totalPence < 30) throw new Error("Order total too low");

  const customerId = await resolveOrCreateCustomer(opts.stripe, {
    email: opts.email,
    userId: opts.userId,
  });

  // Insert pending order BEFORE creating session, then attach session id after.
  const orderDate = new Date().toISOString().split("T")[0];
  const { data: order, error: orderErr } = await supabase
    .from("lunch_orders")
    .insert({
      user_id: opts.userId,
      order_date: orderDate,
      site: opts.site,
      items: validatedItems,
      subtotal_amount: subtotal,
      discount_amount: discount,
      total_amount: total,
      is_gold_at_purchase: isGold,
      member_name: opts.memberName,
      member_phone: opts.memberPhone,
      notes: opts.notes ?? null,
      status: "awaiting_payment",
    })
    .select()
    .single();
  if (orderErr) throw orderErr;

  const session = await opts.stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Crazy Bear takeaway — ${opts.site === "town" ? "Town" : "Country"}`,
            description: validatedItems
              .map((i) => `${i.quantity}x ${i.name}`)
              .join(", ")
              .slice(0, 250),
          },
          unit_amount: totalPence,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    ui_mode: "embedded_page",
    return_url: opts.returnUrl,
    customer: customerId,
    metadata: {
      userId: opts.userId,
      kind: "lunch",
      orderId: order.id,
      site: opts.site,
    },
    payment_intent_data: {
      metadata: { userId: opts.userId, orderId: order.id, kind: "lunch" },
    },
  });

  await supabase
    .from("lunch_orders")
    .update({ stripe_session_id: session.id })
    .eq("id", order.id);

  return { clientSecret: session.client_secret, orderId: order.id };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: userData, error: authErr } = await supabase.auth.getUser(token!);
    if (authErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const body = await req.json();
    const env: StripeEnv = body.environment === "live" ? "live" : "sandbox";
    const stripe = createStripeClient(env);

    if (body.kind === "gold") {
      const clientSecret = await createGoldSession({
        stripe,
        userId: user.id,
        email: user.email!,
        returnUrl: body.returnUrl,
        referralCode: body.referralCode ?? null,
      });
      return new Response(JSON.stringify({ clientSecret }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (body.kind === "lunch") {
      const result = await createLunchSession({
        stripe,
        userId: user.id,
        email: user.email!,
        site: body.site,
        items: body.items,
        memberName: body.memberName,
        memberPhone: body.memberPhone,
        notes: body.notes,
        returnUrl: body.returnUrl,
      });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown kind" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error", e);
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
