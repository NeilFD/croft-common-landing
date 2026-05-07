## Goal

Rebrand the gated members area (currently `/common-room`) to **The Den** — Crazy Bear style. Strip the legacy Croft top nav, change the URL, and overhaul the visuals / copy / typography on the den entry and main page.

## 1. Route rename: `/common-room` → `/den`

Add new routes alongside the old ones, then redirect the old paths so any existing links (emails, bookmarks, cached PWAs) still work.

New routes:
- `/den` → den entry (gesture sign-in)
- `/den/main` → den main hero
- `/den/member`, `/den/member/lunch-run`, `/den/member/ledger`, `/den/member/profile`, `/den/member/dashboard`, `/den/member/moments`

Old routes become 301-style `<Navigate>` redirects:
- `/common-room` → `/den`
- `/common-room/main` → `/den/main`
- `/common-room/member/*` → `/den/member/*`
- `/members` → `/den` (currently goes to `/common-room`)

Internal links in the codebase get updated to point at `/den` (Navigation, UserMenu, MemberHome, CheckIn, LunchRun, MemberLedger, MemberProfile, MemberMoments, MemberDashboard, CommonRoomHeroCarousel, etc.). CMS / admin internals that reference the string `"common-room"` as a CMS page key stay as-is so existing CMS content is not orphaned (the URL changes, the CMS slug does not).

## 2. Top nav overhaul

In `src/components/Navigation.tsx`:
- Remove the `navItems` array entirely (Cafe, Cocktails, Beer, Kitchens, Hall, Community, The Common Room) on both desktop and mobile.
- Remove the "CROFT COMMON" wordmark next to the bear icon. Replace it with a single Crazy Bear wordmark "THE DEN" (Archivo Black, tracked, B&W) so the top-left is just: bear icon + "THE DEN".
- Drop the mobile hamburger (no items left to show). Keep only the `UserMenu` on the right.
- Logo click still routes to `/` (Crazy Bear landing).

This nav is only used on the den pages now, so legacy public Croft pages (cafe, cocktails, etc., still routable for internal use) won't get this stripped nav. Those pages keep working but are no longer surfaced.

## 3. Secret sign-in goes straight into the Den

Currently the gesture on `/common-room` runs the membership gate (biometric → membership link → email auth). The user wants the secret sign-in to "just open the common room".

Change `/den` so the gesture completion navigates straight to `/den/main` without the biometric / link / auth modals. The modals and `useMembershipGate` hook stay in the codebase but are no longer wired to the den entry gesture. (We can revisit gating later if needed.)

## 4. Den entry page redesign (`/den`)

Replace the current "THE COMMON ROOM / Sign in here / faded bear watermark" layout with a Crazy Bear styled holding screen:

- Black background, white type (matches Bears Den system).
- Centred Archivo Black wordmark: **THE DEN**.
- Single line of mono micro-copy underneath: "Members only. Find the bear."
- Large bear mark watermark in muted white, B&W.
- Gesture overlay still active and invisible — drawing the secret shape navigates to `/den/main`.

Copy is short, staccato, confident — matches the Bears Den tone-of-voice rule.

## 5. Den main page redesign (`/den/main`)

- Swap the colour hero background image for a **black-and-white** treatment (CSS `filter: grayscale(1) contrast(1.05)` on the existing hero, no new asset needed).
- Replace existing copy blocks with Bears Den voice:
  - Eyebrow: "MEMBERS"
  - Heading: "INSIDE THE DEN"
  - Sub: "Quiet rooms. Loud nights. Yours."
  - CTA pill: "ENTER"
- Typography: Archivo Black for the heading, Space Grotesk for body, mono for the eyebrow — matching the visual identity rules already set for the project.
- Remove any remaining "Croft Common" / "Common Room" strings on this page.

## 6. Sweep remaining "Common Room" copy in the den flow

Update user-facing strings on the den pages and modals only (not historical Croft pages):
- `BiometricUnlockModal` title `"Unlock The Common Room"` → `"Unlock the Den"` (where used in den flow).
- `AuthModal` title `"Unlock The Common Room"` → `"Enter the Den"`.
- `UserMenu` "Common Room" link label → "The Den".
- Any toast strings on the den pages mentioning "Common Room".

Public Croft pages (Cafe, Cocktails, Privacy, Footer, etc.) and CMS internals are left alone in this pass — the brief is the den area.

## Out of scope (can do next if you want)

- Renaming the CMS page key `common-room` itself.
- Rewriting the public Croft landing pages.
- Replacing the bear mark asset.
- Auth email copy for the den (already done in the Crazy Bear pass).

## Technical notes

Files touched:
- `src/App.tsx` — add `/den/*` routes, redirect `/common-room/*` and `/members`.
- `src/pages/CommonRoom.tsx` → keep file but rename component usage to `Den`; new layout. (Or add `src/pages/Den.tsx` and leave old as redirect.)
- `src/pages/CommonRoomMain.tsx` → `DenMain` with new hero / copy / B&W filter.
- `src/components/Navigation.tsx` — remove nav items + CROFT COMMON wordmark, swap to "THE DEN".
- `src/components/UserMenu.tsx` — relabel + repath.
- `src/pages/MemberHome.tsx`, `MemberDashboard.tsx`, `MemberLedger.tsx`, `MemberProfile.tsx`, `MemberMoments.tsx`, `LunchRun.tsx`, `CheckIn.tsx` — update internal `/common-room/*` links to `/den/*`.
- `src/components/BiometricUnlockModal.tsx`, `src/components/AuthModal.tsx` — den-flow copy.

I will not touch: `supabase/functions/*`, `index.html` bootstrap, public Croft landing routes, CMS page-key strings.
