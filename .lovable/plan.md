## Goal

Bring the Moments feature fully back to life on Crazy Bear: photo upload by members, captions/tags/dates, like + carousel + mosaic browsing, edit/delete by owner, plus a simple AI inappropriate-image blocker on upload. Restyle every Moments surface to the Crazy Bear high-contrast B&W aesthetic (Archivo Black headings, Space Grotesk body, no pink/Croft tokens), and add Moments as a top-level tile on `/den/main`.

The data model and routes already exist (`public.member_moments`, `moment_likes`, `/den/member/moments`, components in `src/components/Member*Moment*`). The work is restyling, fixing the upload moderation path, and surfacing it from the main hub.

## Scope

### 1. AI image moderation (simple blocker, no admin gate)

- New edge function `moderate-moment-upload` using **Lovable AI Gateway** (`google/gemini-2.5-flash`, vision) — no OpenAI key required, mirrors the pattern already used in `verify-avatar-face`.
- Returns `{ allowed: boolean, reason: string }`. Rejects nudity, sexual content, violence/weapons, hate symbols, drug use, gore, illegal activity, screenshots of documents/IDs.
- Called from `MemberMomentUpload` **before** the image is written to storage / `member_moments`. If `allowed === false`, show the reason inline and stop the upload — no row is ever created, nothing reaches an admin queue.
- Retire the old `auto-moderate-moment` (already deprecated) and the OpenAI-based `moderate-moment-image` path. Drop the DB-trigger moderation hook so uploads aren't double-moderated; new rows are inserted as visible immediately because they were already cleared at upload time.
- No admin moderation UI changes required (existing `MomentsModeration` admin page stays as-is for legacy rows).

### 2. Crazy Bear redesign (visual only, no logic changes)

Apply across `MemberMoments` page, `MemberMomentsMosaic`, `MemberMomentsCarousel`, `MemberMomentUpload`, `MemberMomentEdit`, and the carousel block on `MemberHome`:

- Replace white card chrome (`bg-white rounded-2xl border-2 border-black`, pink hover) with the Crazy Bear pattern already used on `/den/main` and `MemberHome`: black `denBg` background image + `bg-black/70` overlay, `border border-white/15`, `bg-black/40 backdrop-blur-sm`, white text.
- Typography: `font-display` (Archivo Black) uppercase for titles/eyebrows, `font-mono` for the `0.4em` tracked labels, `font-sans` (Space Grotesk) for body. Remove all Croft serif/pink references.
- Buttons and chips: reuse the `chipBase` style from `MemberHome` (white border, black bg, hover invert). No focus rings on selected tag chips — use solid white fill on selection per project rule.
- Lucide icons are used throughout; replace with simple text labels or inline SVG since the workspace forbids Lucide. Apply this to every Moments file we touch.
- Modals (`MemberMomentUpload`, `MemberMomentEdit`, mosaic image dialog): black surface, white hairlines, no pink accents, no transparent backgrounds on any popovers.
- Copy tightened to Bears Den voice: short, staccato (e.g. eyebrow "Moments", subtitle "Yours. Tagged. Kept.").

### 3. Surface Moments on `/den/main`

- `CommonRoomMain.tsx` `TILES` array currently has 4 tiles. Add a 5th tile:
  - `{ index: '05', title: 'Moments', copy: 'Yours. Tagged. Kept.', route: '/den/member/moments' }`
- Verify the existing tile grid layout works at 5 items on the current viewport (1376 wide and mobile). If the grid is fixed to 4 columns, switch to a responsive grid that handles 5 cleanly (2 cols mobile, 3 cols tablet, 5 cols desktop).

### 4. Functionality preserved (no behavioural changes)

- Upload flow: choose photo → AI check → upload to storage → insert `member_moments` row with `tagline`, `date_taken`, `tags`.
- Browsing: mosaic grid on `/den/member/moments`, carousel preview block on `/den/member`, lightbox dialog with member name + date.
- Owner controls: edit caption/date/tags, delete. Likes via `moment_likes`. Realtime subscriptions stay intact.
- RLS, storage bucket, and the `useMemberMoments` hook are unchanged.

## Technical notes

- Edge function `moderate-moment-upload`:
  - Reads `imageUrl` (already-uploaded temp URL) or accepts base64; preferred flow is upload to a `pending/` storage path → call function → on allow, move to permanent path and insert row; on reject, delete the temp object.
  - Uses Lovable AI Gateway with `LOVABLE_API_KEY` (already provisioned). Handle 429/402 with friendly user-facing copy.
  - Compact prompt returning strict JSON `{"allowed": bool, "reason": "<≤18 words>"}`.
- Migration: drop the existing AI moderation trigger on `member_moments` so new rows aren't re-queued; default `is_visible = true`, `moderation_status = 'approved'` for new inserts going forward.
- Files expected to change:
  - `src/components/MemberMomentsCarousel.tsx`
  - `src/components/MemberMomentsMosaic.tsx`
  - `src/components/MemberMomentUpload.tsx` (call new function before insert)
  - `src/components/MemberMomentEdit.tsx`
  - `src/pages/MemberMoments.tsx`
  - `src/pages/MemberHome.tsx` (Moments block restyle)
  - `src/pages/CommonRoomMain.tsx` (add 5th tile)
  - `supabase/functions/moderate-moment-upload/index.ts` (new)
  - One migration to drop old moderation trigger / set new default.

## Out of scope

- No changes to membership tiers (we don't have any).
- No changes to admin moderation UI.
- No payment, no Common Good references.
- No new analytics events beyond what `useMemberMoments` already emits.

## Open question

Storage flow for the AI check — two equally clean options:

1. **Upload-then-check** (simpler): file lands in storage, function reads URL, on reject we delete the object. One round trip, slight risk of orphan files if the delete fails.
2. **Base64-precheck** (stricter): client sends base64 to the function first, only uploads if allowed. No orphans, but doubles the payload sent from the browser.

Default plan is option 1 unless you say otherwise.