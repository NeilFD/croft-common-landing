# Payments + Gold Membership

## What you'll get

1. Takeaway baskets must be paid before the order is created. Stripe Checkout (hosted page), members return to a confirmation screen.
2. £69/month Gold subscription. Card turns gold, 25% off auto-applied to every paid order in the app, shown on the in-venue card so staff can honour 25% off in person.
3. Three "smart" extras (see end). You pick which to include now vs later.

## How it works

### Payments setup

- Use Lovable's built-in Stripe payments (no account setup, instant test mode, live after verification). Removes the previous "no Stripe" project rule.
- Two products created in Stripe:
  - **Takeaway order** — dynamic line items per basket, one-time payment.
  - **Bear's Den Gold** — £69/month recurring subscription.

### Takeaway flow (replaces current instant-create)

```text
Basket -> "Pay & Confirm" -> Stripe Checkout (hosted) -> /lunch-run/success
                                                     \-> /lunch-run (cancelled, basket kept)
```

- New edge function `create-lunch-checkout`: validates basket + slot, applies Gold 25% if member is Gold, creates a Stripe Checkout Session, stores a pending `lunch_orders` row with `status='awaiting_payment'` and `stripe_session_id`.
- New edge function `stripe-webhook`: on `checkout.session.completed` flips the order to `confirmed`, decrements slot capacity, fires the existing notification flow. On expiry/cancel, deletes the pending row.
- Existing `create-lunch-order` is retired (or kept as internal helper called by the webhook).
- Order ref shown to member only after webhook confirmation.

### Gold subscription flow

- New page `/den/member/gold` explaining benefits + "Go Gold £69/month" button.
- New edge function `create-gold-checkout` -> Stripe Checkout in subscription mode, `customer_email` prefilled.
- Same `stripe-webhook` handles:
  - `customer.subscription.created/updated` -> upsert into new `member_subscriptions` table with `status`, `current_period_end`, `stripe_customer_id`, `stripe_subscription_id`.
  - `customer.subscription.deleted` -> mark `status='canceled'` but keep `current_period_end` so Gold persists until period end (per your choice).
  - `invoice.payment_failed` -> log, don't strip Gold yet.
- Helper view/RPC `is_gold(user_id)` -> true when `status in ('active','trialing','canceled')` AND `current_period_end > now()`.

### Gold card visuals + in-venue verification

- `MembershipCard.tsx` reads `is_gold`. When true:
  - Background switches to gold (warm metallic gradient using design tokens, no off-brand colours).
  - "GOLD" wordmark + "25% off, always" line.
  - Subtle animated shimmer on the card edge (respects `prefers-reduced-motion`).
- New `/den/member/card` full-screen "show to staff" view: large card, member name, expiry date, a server-signed short-lived QR code (5 min TTL) staff can scan from a simple `/staff/verify` page (PIN-protected) that returns name + Gold status + expiry. Stops screenshot abuse.

### 25% discount application

- Single helper `applyGoldDiscount(subtotal, isGold)` used in:
  - Basket UI (shows strikethrough subtotal + new total).
  - `create-lunch-checkout` server side (recomputes server-side, never trusts client).
- Future paid flows (cinema, events) call the same helper.

### Cancellation / management

- On `/den/member/gold`: if Gold, show "Manage subscription" button -> Stripe Customer Portal (one edge function `create-portal-session`).
- On cancel: card stays gold until `current_period_end`, then auto-reverts on next webhook tick or on read via `is_gold`.

## Smart extras (pick any)

1. **Member-only Gold price for one-offs**: members not yet Gold see "Go Gold and save £X on this basket" CTA when their basket is over £30 — converts at the moment of value.
2. **Refer a friend, get a month free**: each Gold member gets a code; when a new member subscribes with it, both get one month credited via Stripe coupon. Cheap to build, strong loyalty mechanic.
3. **Gold-only perks beyond %off**: priority lunch slot at 11:30, monthly free coffee voucher (QR), early access to cinema releases. Makes Gold feel like a club, not just a discount.

## Technical detail

### New tables

- `member_subscriptions` (user_id PK, stripe_customer_id, stripe_subscription_id, status, current_period_end, created_at, updated_at). RLS: owner-read only.
- Add columns to `lunch_orders`: `stripe_session_id text`, `stripe_payment_intent_id text`, `discount_amount numeric`, `is_gold_at_purchase boolean`. Update `status` check to allow `awaiting_payment`.

### New edge functions

- `create-lunch-checkout` (verify_jwt true, member auth required)
- `create-gold-checkout` (verify_jwt true)
- `create-portal-session` (verify_jwt true)
- `stripe-webhook` (verify_jwt false, signature verified with `STRIPE_WEBHOOK_SECRET`)
- `verify-gold-qr` (verify_jwt false, used by /staff/verify, PIN gated)

### Secrets needed

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_GOLD_PRICE_ID`, `STAFF_VERIFY_PIN`. (First two are auto-provisioned by Lovable's built-in Stripe; the price id is created when we register the £69 product.)

### Memory updates

- Lift "No Stripe" core rule.
- Lift "no membership tiers" rule and replace with: "Gold is the only paid tier (£69/mo), 25% off everywhere."

## Out of scope (this plan)

- Apple/Google Pay native sheets (Checkout already shows them on supported devices).
- Refunds UI (handled in Stripe dashboard).
- Group/family Gold accounts.

---

Reply with which **smart extras** you want included in v1, and confirm the **rule lifts**. I'll then build it in this order: Stripe enable -> DB migration -> webhook + checkout functions -> takeaway flow -> Gold subscription -> Gold card visuals -> staff verify page -> chosen extras.

&nbsp;

&nbsp;

I only want referral 