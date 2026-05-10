## Goal

Let trusted people try the Gold flow end-to-end without spending real money. Stay in Stripe sandbox for now (test card `4242 4242 4242 4242` works, no real charges). Hide the "Go Gold" button behind a secret access code so the public can't accidentally use it.

## How it works

On the profile page, in the Gold modal (non-Gold state):

1. The "Go Gold" button is **hidden by default**. The modal shows the price, the perks, and a single input: **"Access code"**.
2. User types the code (e.g. `BEARTEST`) and submits.
3. A backend function checks the code against a server-side list. If valid, it returns `ok` and stores a flag in the browser (`sessionStorage`) so the unlock survives modal close/reopen for that session.
4. Once unlocked, the modal reveals the **Go Gold** button and the optional referral code field. Checkout proceeds as today (sandbox, £69, but pay with `4242` so no money moves).
5. Wrong code shows an inline error. No retry limit needed for v1.

The code is never shipped in the JS bundle. It lives server-side only.

## Where codes are stored

A small new table `gold_access_codes` (code, label, active, created_at). You can add/disable codes via the database without deploying code. Seed it with one code to start, e.g. `BEARTEST`.

## Cross-device note

The earlier issue (Gold on desktop, black card on phone) is the sandbox-vs-live split. As long as you stay in sandbox on every device — preview URL on desktop, preview URL on phone — Gold will show on both. The published site (`crazybear.dev`) and the iOS app may be pinned to live; if you want Gold to appear there too without going live, the access code needs to work in both environments. We'll keep checkout in sandbox regardless of which build the user is on, so any tester sees the same flow everywhere.  
  
I want sandbox on every device!!

## Technical details

**New table** (`gold_access_codes`):

- `code` (text, primary key, uppercase)
- `label` (text, e.g. "Internal team")
- `active` (boolean, default true)
- `created_at`
- RLS: no public access. Only the edge function (service role) reads it.

**New edge function** `validate-gold-access-code`:

- POST `{ code: string }`
- Looks up `code` (uppercased, trimmed) where `active = true`. Returns `{ ok: true }` or `{ ok: false }`.
- `verify_jwt = false`. Rate-limit not needed for v1, but logs each attempt.

**Edit `src/components/membership/GoldSection.tsx**`:

- Add `accessUnlocked` state, initialised from `sessionStorage.getItem('gold_access_unlocked') === '1'`.
- In the non-Gold modal:
  - If not unlocked: show price + perks + access code input + "Unlock" button. Hide "Go Gold".
  - If unlocked: show price + perks + referral code field + "Go Gold" (current behaviour).
- On Unlock click: invoke `validate-gold-access-code`. On `ok`, set state and `sessionStorage`.
- No change to Stripe checkout call itself — it stays sandbox/£69.

**Force checkout to sandbox regardless of build env** (so the unlock works for testers on the live published site / iOS app too):

- `src/components/membership/GoldSection.tsx` passes `environment: 'sandbox'` explicitly to the `create-checkout` invoke when access is unlocked, instead of using `getStripeEnvironment()`.
- Same for `useGoldStatus` — when `sessionStorage` flag is set, query subscriptions filtered by `environment = 'sandbox'` so the gold card actually appears after the test purchase.

**Seed**: insert one starting code (`BEARTEST`) into `gold_access_codes`.

## Out of scope

- Coupons / promo codes inside Stripe (not needed — sandbox is already free).
- Going live on Stripe.
- Admin UI for managing codes (do it via DB for now).