## Goal

Turn `/den/main` into a proper members landing — welcome copy, purpose, and direct nav into each members section. Replace the legacy Croft Common photo with a Crazy Bear image (B&W). Bring every page beyond `/den` into line with Den typography, palette, and Crazy Bear imagery.

## 1. `/den/main` rebuild (`src/pages/CommonRoomMain.tsx`)

**Background**
- Swap `/lovable-uploads/8f95beef…png` for `src/assets/cb-carousel-new/country-06.jpg`, imported as a module.
- Keep the existing `grayscale(1) contrast(1.05)` filter and `bg-black/55` overlay so it reads B&W and high-contrast, consistent with the rest of the Den.

**Layout (top to bottom, all centred, max-w 3xl)**
1. `MEMBERS` mono eyebrow (existing).
2. `INSIDE THE DEN` headline in Archivo Black (existing `font-display`).
3. New 2-line Bears Den welcome under the headline:
   > A quiet door inside Crazy Bear.
   > Yours, once you're in.
4. Short purpose paragraph (Space Grotesk, white/70):
   > Your room for the things members get. Streaks. Spend. Lunch. Late nights. The bits we don't put on the menu.
5. Primary `Enter` button (existing membershipGate trigger) — unchanged behaviour.
6. Hairline divider, then a "What's inside" section with 4 nav tiles.

**Nav tiles (best-practice gated nav)**

A 2x2 grid (single column on mobile) of square-ish tiles. Each tile is a button with:
- Mono eyebrow label (e.g. `01 / HOME`)
- Archivo Black title
- One-line Space Grotesk description
- Hover: invert to white bg / black text, no transparency (per project rule).

Tiles:
| Tile | Route | Copy |
|---|---|---|
| Member Home | `/den/member` | "Your streaks, stats, the lot." |
| Takeaway | `/den/member/lunch-run` | "Order in. Members only." |
| Ledger | `/den/member/ledger` | "Receipts. Spend. Quiet maths." |
| You | `/den/member/profile` | "Profile and your moments." (lands on profile; profile page links across to Moments) |

Note: the existing route is still `/den/member/lunch-run`; only the user-facing label changes to **Takeaway**.

**Behaviour (best practice)**
- If the user is already authenticated (`useAuth().user` present), tiles navigate straight to the route.
- If not, clicking a tile stores the intended target in state, then runs `membershipGate.start()`. The existing `useEffect` that watches `membershipGate.allowed` is updated to navigate to the stored target (default `/den/member`) on success. This keeps a single Enter pathway, with deep-link intent preserved — no duplicate disabled UI, no second auth flow.

## 2. Crazy Bear imagery beyond `/den`

Audit pages mounted under `/den/member/*` for non-Crazy-Bear assets and replace with B&W Crazy Bear images. Confirmed swap targets so far:
- `src/pages/MemberHome.tsx`, `src/pages/LunchRun.tsx`, `src/pages/MemberLedger.tsx`, `src/pages/MemberMoments.tsx`, `src/pages/MemberProfile.tsx`, `src/pages/MemberDashboard.tsx` — all currently use `@/assets/den-bg.jpg`. Replace that single shared asset reference with a new `src/assets/den-bg-cb.jpg` (re-export of `cb-carousel-new/country-06.jpg`) so every member page picks up the change in one edit. Apply the same `grayscale(1)` + black overlay treatment used on `/den/main` to keep the section monochrome.
- Sweep these files for any other hard-coded `/lovable-uploads/...` or non-CB asset imports and replace with appropriate Crazy Bear stills from `src/assets/cb-carousel-new/` or `src/assets/cb-hero-*`. Anything not strictly needed gets removed.

## 3. Typography & styling pass beyond `/den`

Bring member pages into line with the Den system (Archivo Black headings, Space Grotesk body, mono uppercase eyebrows, white-on-black with B&W photography):
- Page titles: `font-display uppercase tracking-tight` at the same scale ramp used on `/den/main`.
- Eyebrows / metadata: `font-mono text-[10px] tracking-[0.5em] uppercase text-white/70`.
- Body: `font-sans text-white/80 leading-relaxed`.
- Buttons: bordered, mono, uppercase, hover-invert — matching the `Enter` button on `/den/main`. No coloured shadcn primary buttons inside the Den.
- Cards: replace soft shadcn `Card` chrome with hairline `border border-white/15 bg-black/40 backdrop-blur` blocks for a consistent Den feel; keep shadcn `Card` as the structural component but restyle via className.
- Update the visible label "Lunch Run" to "Takeaway" wherever it appears in member-facing copy (route stays `/den/member/lunch-run`).

Out of scope for this pass (flagging, not changing):
- Lucide icon usage inside member pages conflicts with the workspace rule against Lucide. Removing them touches a lot of UI logic and is a separate clean-up — call it out at the end so you can scope it as its own task.

## 4. Verification

- Visit `/den/main` logged out: see new copy, 4 tiles, click any tile — auth modal opens, after success lands on the chosen route.
- Visit `/den/main` logged in: tiles navigate immediately.
- Spot-check `/den/member`, `/den/member/lunch-run`, `/den/member/ledger`, `/den/member/moments`, `/den/member/profile` for: country-06 B&W background, Archivo Black titles, mono eyebrows, no leftover Croft Common imagery, "Takeaway" label on the lunch-run page heading and links.

## Technical notes

- Route map (unchanged): `/den/member`, `/den/member/lunch-run`, `/den/member/ledger`, `/den/member/moments`, `/den/member/profile`, `/den/member/dashboard`.
- Pending nav target state lives inside `CommonRoomMain` (`useState<string | null>`), consumed by the existing `membershipGate.allowed` effect; default fallback remains `/den/member` so the bare Enter button keeps current behaviour.
- New asset: `src/assets/den-bg-cb.jpg` is just a re-export module pointing at `cb-carousel-new/country-06.jpg` so a future swap is one line.
