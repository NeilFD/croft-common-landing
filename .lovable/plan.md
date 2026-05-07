## Why the membership card is broken

`MembershipCard` calls two Supabase RPCs that do not exist in this project: `ensure_membership_number` and `get_membership_card_details`. So `useMembershipCard` always errors with "Failed to generate membership number" and the card never renders. On top of that, the Apple Wallet flow points at a hardcoded old Supabase project ref (`xccidvoxhpgcnwinnyin`) that is not this Cloud backend, so even if the card loaded the wallet button would 404. The card UI itself is also off-brand — pink gradient, "CROFT COMMON" header, Croft logo.

Rather than rebuild Apple Wallet for a project that has been rebranded to Crazy Bear / The Den, I will rip Wallet out for now and ship a clean B&W "Den" member card driven directly by `cb_members`.

## 1. New Den-styled MembershipCard

Rewrite `src/components/membership/MembershipCard.tsx` to:

- Pull from `cb_members` directly (`first_name`, `last_name`, `created_at`) plus `auth.users.email` via the `useAuth` hook. No RPCs, no Apple Wallet, no Croft logo, no pink.
- Generate a stable display number client-side from the user's UUID (e.g. last 8 chars uppercased, formatted `CB-XXXX-XXXX`). No DB writes needed.
- Layout: credit-card aspect (`aspect-[1.586/1]`), black background, white type, thin white border, bear mark watermark in the corner at low opacity.
- Typography:
  - Eyebrow `THE DEN / MEMBER` in mono, tracked `[0.4em]`, tiny.
  - Member name in Archivo Black, large.
  - Member number in mono, tracked.
  - "MEMBER SINCE 05 / 26" footer in mono.
- Loading and error states use the same B&W card frame so layout doesn't jump.
- Remove all Apple Wallet code, fallbacks, reissue, toasts, iOS detection — the file becomes ~70 lines.

## 2. Profile page typography pass

Update `src/pages/MemberProfile.tsx`:

- Page title `<title>` from "My Profile | The Tavern" to "Profile | The Den".
- Header card: drop the "Build marker" line. Replace the title block with Crazy Bear treatment — eyebrow `MEMBER` (mono, tracked), heading `PROFILE` (Archivo Black, big, uppercase), subheading "Your details. Your card." (Space Grotesk).
- "Back to Member Home" link reads "Back to the Den".
- "Your Membership Card" section heading: change to `MEMBER CARD` in Archivo Black uppercase, mono eyebrow `THE DEN` above it.
- `ProfileFormSection` titles already render with their own styles — leave the component but pass uppercased section titles ("Basic Information" stays, fine).
- `Tabs`:
  - `TabsList` — keep grid, but restyle the trigger to a black/white pill: black border, black text, on `data-[state=active]` swap to bg-black text-white, no rounded full. Use `font-mono uppercase tracking-[0.2em] text-xs`. Strip lucide icon labels entirely (icons stay too small in this typography); just text labels: `PROFILE`, `LEDGER`, `SETTINGS`.
- Buttons (`Edit Profile`, `Save Changes`, `Cancel`) — restyle as bordered B&W pills (`border-2 border-black bg-white text-black hover:bg-black hover:text-white font-mono uppercase tracking-[0.3em] text-xs`).
- Remove the `font-brutalist` class on the title (font isn't loaded in this project) — switch to `font-display`.
- Page background: same B&W plaster background already used on `/den/member` (`denBg` from `@/assets/den-bg.jpg`) with a `bg-white/85` veil so forms stay readable. This ties it visually into the rest of the den.

## 3. Verify

- Type-check passes.
- Membership card renders with my name (Neil Fincham-Dukes) and a stable `CB-XXXX-XXXX` number, no error state.
- /den/member/profile shows mono eyebrows, Archivo Black headings, B&W everything, no pink, no "Croft Common", no "Tavern".

## Out of scope

- Restoring Apple Wallet for The Den — separate piece of work; needs a new pass type, new certs, and a new edge function pointing at this project's Supabase ref. We can do that next if you want a real wallet pass.
- Renaming the underlying CMS / page keys.
- Redesigning the rest of the member sub-pages (ledger, moments) — same treatment can follow once you've signed off this one.

## Technical notes

Files touched:

- `src/components/membership/MembershipCard.tsx` — full rewrite, drop wallet code.
- `src/pages/MemberProfile.tsx` — header, tabs, buttons, background, copy.
- No DB migrations. No edge function changes.