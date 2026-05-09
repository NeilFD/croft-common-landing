# Finish Gold v1 (no staff scanner)

Backend (Stripe, webhook, subscriptions table, referrals, lunch checkout) is already in place. This wraps the front of house.

## What I'll build

### 1. Gold landing page — `/den/member/gold`
- Headline, three-line benefits ("25% off. Always. In-app and in-venue."), £69/month price.
- Not Gold: "Go Gold" button opens embedded Stripe Checkout in a modal. Optional referral code field.
- Already Gold: shows status, renewal date, "Manage subscription" (opens Stripe Portal in new tab via existing `create-portal-session`), and the member's referral code with a copy button + share link (`/den/member/gold?ref=BEAR-XXXXXX`).
- If `?ref=` is in the URL, prefill the referral field for non-Gold visitors.

### 2. MembershipCard gold variant
- `MembershipCard.tsx` reads `useGoldStatus()`. When Gold:
  - Black -> warm metallic gradient using new `--gold-*` tokens (HSL only, added to `index.css` + `tailwind.config.ts`).
  - "GOLD" wordmark top-left, "25% off, always" sub-line.
  - Renewal date replaces "Member Since" when Gold (or shows both compactly).
  - Subtle shimmer on edge, gated by `prefers-reduced-motion`.
- No layout change for non-Gold members.

### 3. Referral surface
- New `useReferralCode()` hook calls a tiny edge function `get-referral-code` that runs `ensure_referral_code(auth.uid())` and returns the code. Shown on the Gold page.
- No standalone referrals page in v1.

### 4. Routing
- Add `/den/member/gold` to `App.tsx` (lazy import, inside `<MemberRoutes>`).
- Add a "Go Gold" / "Manage Gold" tile on `/den/member` (MemberHome) so members can find it.

### 5. Skip for v1 (per your answer)
- No `/den/member/card` full-screen view, no `/staff/verify`, no `verify-gold-qr` function, no `STAFF_VERIFY_PIN` / `GOLD_QR_SIGNING_SECRET`. Staff trust the gold card visual in person.

### 6. Memory rules
Update `mem://index.md` Core:
- Remove "No Stripe or Common Good integrations (payments permanently removed)."
- Add: "Stripe payments enabled (Lovable built-in). Bear's Den Gold = £69/month, 25% off everywhere. Never use the term 'membership tiers'."

## Technical detail

- New file: `src/pages/GoldMembership.tsx` (the landing page).
- New file: `src/hooks/useReferralCode.ts`.
- New edge function: `supabase/functions/get-referral-code/index.ts` (verifies JWT, calls `ensure_referral_code`, returns `{ code }`). Already-registered RLS covers the row.
- Edited: `src/components/membership/MembershipCard.tsx` (gold variant), `src/App.tsx` (route), `src/pages/MemberHome.tsx` (Gold tile), `src/index.css` + `tailwind.config.ts` (gold tokens), `mem://index.md` (rules).
- All Stripe checkout reuses existing `create-checkout` (`kind: 'gold'`) and `StripeEmbeddedCheckout` component. No new server-side payment code.

## How to test in preview

1. Sign in as a member, visit `/den/member/gold`, click **Go Gold**.
2. In the embedded Stripe form use card `4242 4242 4242 4242`, any future expiry, any CVC, any postcode.
3. After return, the page should show Gold status; `/den/member` membership card should turn gold within a few seconds (realtime subscription).
4. Add a basket on `/den/member/lunch-run` — total should show 25% off.
5. Open `/den/member/gold` again, copy the referral code, open in a private window with a second account, paste the code on checkout — webhook will credit both accounts £69 on Stripe after the second account pays.
6. Click **Manage subscription** -> Stripe Portal -> cancel. Card stays gold until `current_period_end`.

To decline a payment, use card `4000 0000 0000 0002`.
