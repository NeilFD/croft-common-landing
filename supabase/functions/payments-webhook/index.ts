import { createClient } from "npm:@supabase/supabase-js@2";
import {
  type StripeEnv,
  createStripeClient,
  verifyWebhook,
} from "../_shared/stripe.ts";

let _supabase: ReturnType<typeof createClient> | null = null;
function db() {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
  }
  return _supabase;
}

async function upsertSubscription(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("subscription has no userId metadata", subscription.id);
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.lookup_key
    || item?.price?.metadata?.lovable_external_id
    || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await db().from("subscriptions").upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      product_id: productId,
      price_id: priceId,
      status: subscription.status,
      current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
      current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
      cancel_at_period_end: subscription.cancel_at_period_end || false,
      environment: env,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_subscription_id" },
  );
}

async function applyReferralCredits(subscription: any, env: StripeEnv) {
  const referrerUserId = subscription.metadata?.referrerUserId;
  const referredUserId = subscription.metadata?.userId;
  const code = subscription.metadata?.referralCode;
  if (!referrerUserId || !referredUserId || !code) return;

  // Idempotent: only credit on the first time we see this subscription id
  const { data: existing } = await db()
    .from("member_referral_redemptions")
    .select("id, referrer_credited")
    .eq("referred_user_id", referredUserId)
    .maybeSingle();
  if (existing?.referrer_credited) return;

  const stripe = createStripeClient(env);

  // 1) Credit the new (referred) member: 100% off the first invoice
  // Done by attaching a one-off coupon to the subscription's customer's next invoice.
  // We use Stripe customer balance (negative = credit). £69 credit = -6900 pence.
  try {
    await stripe.customers.createBalanceTransaction(subscription.customer, {
      amount: -6900,
      currency: "gbp",
      description: `Bear's Den Gold referral credit (code ${code})`,
    });
  } catch (e) {
    console.error("Failed to credit referred customer", e);
  }

  // 2) Credit the referrer: find their stripe_customer_id and apply the same.
  const { data: referrerSub } = await db()
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", referrerUserId)
    .eq("environment", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (referrerSub?.stripe_customer_id) {
    try {
      await stripe.customers.createBalanceTransaction(referrerSub.stripe_customer_id, {
        amount: -6900,
        currency: "gbp",
        description: `Referral reward — ${code} signed up`,
      });
    } catch (e) {
      console.error("Failed to credit referrer", e);
    }
  }

  await db().from("member_referral_redemptions").upsert(
    {
      referrer_user_id: referrerUserId,
      referred_user_id: referredUserId,
      code,
      stripe_subscription_id: subscription.id,
      referrer_credited: true,
    },
    { onConflict: "referred_user_id" },
  );
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  const kind = session.metadata?.kind;
  if (kind === "lunch") {
    const orderId = session.metadata?.orderId;
    if (!orderId) return;
    await db()
      .from("lunch_orders")
      .update({
        status: "confirmed",
        stripe_payment_intent_id: session.payment_intent ?? null,
      })
      .eq("id", orderId);
    console.log("lunch order confirmed", orderId);
  }
  // Subscriptions are handled via customer.subscription.* events.
}

async function handleCheckoutExpired(session: any) {
  if (session.metadata?.kind !== "lunch") return;
  const orderId = session.metadata?.orderId;
  if (!orderId) return;
  await db().from("lunch_orders").delete().eq("id", orderId).eq("status", "awaiting_payment");
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  console.log("webhook event", event.type);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    case "checkout.session.expired":
      await handleCheckoutExpired(event.data.object);
      break;
    case "customer.subscription.created":
      await upsertSubscription(event.data.object, env);
      await applyReferralCredits(event.data.object, env);
      break;
    case "customer.subscription.updated":
      await upsertSubscription(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await db()
        .from("subscriptions")
        .update({ status: "canceled", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", event.data.object.id)
        .eq("environment", env);
      break;
    default:
      console.log("unhandled event", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(
      JSON.stringify({ received: true, ignored: "invalid env" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("webhook error", e);
    return new Response("Webhook error", { status: 400 });
  }
});
