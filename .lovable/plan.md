## 1. Internal "How to test Gold" panel

In `GoldSection`, above the access-code input (only when not yet Gold):

- Mono caps bullets:
  - Access code: **BEARTEST**
  - Stripe test card: `4242 4242 4242 4242`, any future date, any CVC.
  - £69/month. 25% off everywhere.
    &nbsp;

Hidden once their account is already Gold.

## 2. Auto-promote sandbox Gold to live

The whole site is internal, so any successful sandbox Gold checkout should produce a Gold member on live with zero manual steps.

Implementation, all server-side, no new buttons:

- In `payments-webhook` (`supabase/functions/payments-webhook/index.ts`), inside `handleSubscriptionCreated` and `handleSubscriptionUpdated`:
  - If `priceId === 'gold_monthly'`, force the upserted/updated row's `environment` to `'live'` regardless of the `?env=` query param.
  - All other products (e.g. lunch, future SKUs) keep the existing sandbox/live split.
- In `useGoldStatus` (`src/hooks/useGoldStatus.ts`):
  - Drop the env-conditional logic for Gold reads. Always query `.eq('environment', 'live')` for `price_id = 'gold_monthly'`.
  - Remove the `gold_access_unlocked` sessionStorage branch — no longer needed.
- One-off data fix: update any existing `subscriptions` rows where `price_id = 'gold_monthly'` and `environment = 'sandbox'` to `environment = 'live'` so existing testers don't have to re-subscribe.

Net effect: a member taps **Go Gold**, completes sandbox Stripe checkout with the test card, the webhook writes a live Gold row, realtime fires, the card flips to gold in both the editor preview and the installed PWA. No override button, no manual flip.

The `BEARTEST` access code stays as the only gate so it's not exposed to random visitors.

## 3. Profile page reorder + photo gating

In `src/pages/MemberProfile.tsx`, left column order becomes:

```text
1. Profile Picture (AvatarUpload)
2. The Den - Member Card (MembershipCard + GoldSection)
3. Add to Apple Wallet
```

Add a short notice block above `MembershipCard` when `!avatar_url || !avatar_face_verified`:

- Eyebrow: **Profile photo required**
- Body: "Your member card stays inactive until a verified face-on photo is on file."

Gate the **Go Gold** button inside `GoldSection` on the same condition: disabled with inline reason "Add a verified profile photo first." when avatar is missing or unverified. The existing Apple Wallet gating block stays as-is.

Result: no photo means no Gold checkout, no live card, no wallet pass — single, consistent rule.

## Technical notes

- Edits:
  - `supabase/functions/payments-webhook/index.ts` — force `environment='live'` for `gold_monthly`.
  - `src/hooks/useGoldStatus.ts` — always read with `environment='live'` for Gold; drop sessionStorage flag.
  - `src/components/membership/GoldSection.tsx` — add bullet panel, gate Go Gold on verified avatar, drop sessionStorage references for Gold visibility.
  - `src/pages/MemberProfile.tsx` — reorder left column, add photo-required notice.
- Data: one `UPDATE` on `subscriptions` to migrate existing `gold_monthly` sandbox rows to live.
- No schema changes, no new edge function, no new secrets.