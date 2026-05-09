## What's wrong today

1. **Surname showing as "Fincham" not "Fincham-Dukes"** — root cause confirmed:
   - `auth.users.raw_user_meta_data.last_name = "Fincham"` (the hyphenated half was dropped at signup, likely a form/parser issue).
   - `cb_members.last_name = "Fincham"` (synced from meta at signup).
   - The MembershipCard reads from `cb_members` only.
   - Worse: the Profile form writes name edits to `profiles` (and `member_profiles_extended`), **never to `cb_members`** — so even editing the form to "Fincham-Dukes" wouldn't fix the card. The form and the card are wired to two different tables.

2. **Page design** is leftover Croft Common style: shadcn `Card` chrome, generic form layout, no Den feel beyond the header.

3. **Wallet** — there's a `create-wallet-pass` function for the old Croft Common membership; nothing for Crazy Bear members, and no "Add to Apple Wallet" button on the new card.

## Plan

### 1. Fix the name (data + write path)

- **Data fix**: update `cb_members.last_name` and `auth.users.raw_user_meta_data.last_name` to `Fincham-Dukes` for `neilfdukes@gmail.com` (one-off insert/update tool call).
- **Code fix in `useFullProfile.ts`**: when `first_name` / `last_name` / `phone_number` / `birthday` change, also upsert into `cb_members` (mirror to `profiles` for back-compat). This is the canonical CB member record and the card source.
- **Form**: keep the existing First / Last inputs (already supports hyphens — the bug was upstream), but trim only leading/trailing whitespace on save so "Fincham-Dukes" survives.
- **MembershipCard**: keep reading `cb_members`, plus auto-shrink the name (responsive `text-2xl` to `text-xl` if length > 18 chars) so long double-barrelled names never clip.

### 2. Full Bears Den restyle of `/den/member/profile`

Replace the shadcn `Card`-wrapped sections with flat Den blocks:

```text
+----------------------------------------------------------+
|  ← BACK TO THE DEN                                       |
|  MEMBER                                                  |
|  PROFILE                          [bear watermark right] |
|  Your details. Your card.                                |
+----------------------------------------------------------+
|  [PROFILE] [LEDGER] [SETTINGS]   (existing tab strip)    |
+----------------------------------------------------------+
|  Desktop 2-col grid:                                     |
|  ┌─ left (sticky) ──────┐  ┌─ right (scrolls) ────────┐ |
|  │ THE DEN              │  │ /// BASIC INFORMATION    │ |
|  │ MEMBER CARD          │  │ first / last / phone /…  │ |
|  │ [black card]         │  │                          │ |
|  │ [Add to Apple Wallet]│  │ /// DISPLAY              │ |
|  │ [Profile photo]      │  │ /// INTERESTS            │ |
|  └──────────────────────┘  │ /// DIETARY              │ |
|                            │ /// COMMUNICATION        │ |
|                            └──────────────────────────┘ |
+----------------------------------------------------------+
```

Concrete changes:
- New `DenSection` wrapper (bordered top hairline, mono `///` eyebrow, Archivo Black title, no rounded card chrome). Replace every `ProfileFormSection` usage on this page.
- Sticky member-card column on `md+`; stacked on mobile.
- Restyle `Input` / `Textarea` / `Select` instances on this page only via local class overrides: square corners, 1px black border, focus = thicker black border (no ring — per project rule).
- Edit / Save / Cancel buttons match existing `pillBtnClass` (already Den).
- Collapse Dietary + Communication Preferences into expandable `<details>` blocks (Den-styled summary row) so the card + basics dominate.
- Tighten spacing, drop the `bg-white/85` veil to `bg-white/92`, keep grayscale Den background.

### 3. Apple Wallet for Crazy Bear members

New edge function **`create-cb-wallet-pass`** (modelled on existing `create-wallet-pass`, reusing all 4 existing secrets — `APPLE_TEAM_ID`, `APPLE_PASS_TYPE_IDENTIFIER`, `APPLE_PASS_CERTIFICATE`, `APPLE_PASS_PRIVATE_KEY`, `APPLE_WWDR_CERTIFICATE`):

- Input: authenticated user JWT (verify in code, `verify_jwt = false` in config).
- Reads `cb_members` (`first_name`, `last_name`, `created_at`, `user_id`) — generates membership number `CB-XXXX-XXXX` from the user UUID (same formula as `MembershipCard`).
- Generates a `pass.json` styled to match the on-screen card:
  - `passTypeIdentifier`, `teamIdentifier`, `organizationName: "Crazy Bear"`, `description: "The Den Member Card"`.
  - `storeCard` style; `backgroundColor` black, `foregroundColor` white, `labelColor` rgb(255,255,255,0.6).
  - Primary: full name. Secondary: "MEMBER NO." + number, "MEMBER SINCE" + MM/YY. Back: support email + revoke link.
  - `barcodes`: QR encoding the membership number (for venue scanning later).
- Embeds Crazy Bear bear-mark as `logo.png` / `icon.png` (use `public/brand/crazy-bear-mark.png`, render at required PassKit sizes 1x/2x/3x).
- Signs with the existing Apple cert chain (reuse the `forge` PKCS#7 detached-signature code from `create-wallet-pass`).
- New columns on `cb_members`: `wallet_pass_serial_number text`, `wallet_pass_last_issued_at timestamptz`, `wallet_pass_revoked boolean default false` (migration).
- Returns the `.pkpass` blob with `Content-Type: application/vnd.apple.pkpass`.

Frontend:
- New `<AddToAppleWalletButton />` placed under the MembershipCard (and on `MemberHome` next to the card preview).
- Black pill with the official "Add to Apple Wallet" SVG mark (download from Apple's badge guidelines, store under `public/brand/add-to-apple-wallet.svg`).
- iOS Safari: anchor `href` to the function URL with a short-lived token query param (mirrors the existing Croft Common GET flow). Non-iOS: show a small note "Open on iPhone Safari to add to Apple Wallet" — no Google Wallet this round.

### 4. Out of scope (this pass)

- Google Wallet integration.
- Pass push updates / APNs registration for the CB pass (the existing CC function has stubs for this; we mirror the issue flow only).
- Backfilling wallet serial numbers for other members.

## Technical detail (for engineers)

**Files**
- `src/pages/MemberProfile.tsx` — restyle, swap sections, add wallet button.
- `src/components/membership/MembershipCard.tsx` — name auto-shrink, expose name length.
- `src/components/membership/AddToAppleWalletButton.tsx` — new.
- `src/components/profile/DenSection.tsx` — new flat section wrapper (replaces `ProfileFormSection` usage on this page).
- `src/hooks/useFullProfile.ts` — also upsert `first_name` / `last_name` / `phone_number` / `birthday` into `cb_members`.
- `supabase/functions/create-cb-wallet-pass/index.ts` — new (forked from `create-wallet-pass`, CB branding, `cb_members` source).
- `supabase/config.toml` — add `[functions.create-cb-wallet-pass] verify_jwt = false` block.
- `public/brand/add-to-apple-wallet.svg` — official Apple badge.

**Migration**
- `cb_members`: add `wallet_pass_serial_number text`, `wallet_pass_last_issued_at timestamptz`, `wallet_pass_revoked boolean default false`. No RLS change (existing user-scoped policies cover the new columns).

**Data fix (insert tool, not migration)**
- `UPDATE public.cb_members SET last_name='Fincham-Dukes' WHERE email='neilfdukes@gmail.com';`
- `UPDATE auth.users SET raw_user_meta_data = jsonb_set(raw_user_meta_data,'{last_name}','"Fincham-Dukes"') WHERE email='neilfdukes@gmail.com';`