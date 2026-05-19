ns

# /pub Landing — Traditional Pub Enclave

A standalone top-level landing at `/pub` that acts as the front door to all Pub Eat & Drink content. Visually, a small "old boozer" enclave inside the wider Crazy Bear design system — same skeleton (CBTopNav, CBFooter, Space Grotesk / Bowlby One), but a warmer, woodier, hand-painted-sign tone for this corner of the site only.  
  
  
/PUB is also inside Country, as it belongs to Crazy Bear Country in stadhampton

Note on scope: today the only pub content lives under `/country/pub` (food, drink, hospitality). Plan assumes `/pub` becomes the canonical home for those, with `/country/pub*` 301-redirecting in. If you'd rather keep both, say the word and I'll branch the plan.

## What gets built

1. **Routes**
  - `/pub` — new landing (CountryPub content retired in favour of this).
  - `/pub/food` — moved from `/country/pub/food`.
  - `/pub/drink` — moved from `/country/pub/drink`.
  - `/pub/hospitality` — moved from `/country/pub/hospitality`. *PLEASE DELETE PUB HOSPITALITY IT IS NO LONGER REQUIRED*
  - `/pub/snacks` — new (bar snacks / pork scratchings / scotch eggs menu card).
  - 301 redirects: `/country/pub*` to `/pub*` (server-side via prerender + client `<Navigate>`).
2. **Landing sections (in order)**
  - **Hero**: full-bleed dim photo (brass tap, etched glass, low light). Hand-painted style H1 "THE PUB". Eyebrow "Crazy Bear // Stadhampton". One-line manifesto: "Proper ale. Proper food. Proper pub."
  - **Three doors**: large tactile cards — Eat / Drink / Stay — each a wood-grain panel with a chalk-style label. Routes to `/pub/food`, `/pub/drink`, `/pub/hospitality`.
  - **Bar snacks strip**: horizontal scroll of pub snacks (pork pie, scotch egg, scratchings, pickled egg) with hand-drawn price tags. Tap-through to `/pub/snacks`.
  - **What's pouring**: live ale list (4-6 cask + keg) styled as a chalkboard. Pulled from existing CMS menu data (`useCMSMenuData('pub-drinks')`).
  - **Today's specials**: 2-3 dishes styled as a folded paper menu pinned to a corkboard.
  - **Hours + find us**: opening hours laid out like a pub door sign.
  - **Footer**: standard CBFooter.
3. **Design tokens (scoped, not global)**
  - New `pub-theme` wrapper class applied only on `/pub*`. Inside it:
    - Surface: deep oxblood `hsl(8 45% 18%)`, cream `hsl(40 35% 92%)`, brass `hsl(40 55% 55%)`.
    - Type: keep Bowlby One for H1s; introduce a secondary display face for chalk/sign feel (suggest **Alfa Slab One** or **Frijole** loaded only on `/pub` routes). Body stays Space Grotesk.
    - Texture: subtle paper grain SVG overlay on cards; wood-grain CSS gradient on door panels.
    - Borders: 2px solid cream, slight rotation (-0.5 to 0.5 deg) on labels for hand-pinned feel.
    - No animation flash. Slow, heavy. Static is fine.
  - All tokens live in a new `pub.css` imported only by the /pub route; no leak into global tokens.
4. **CMS integration** (per project rule: every new page goes in CMS)
  - Register `pub`, `pub-food`, `pub-drink`, `pub-hospitality`, `pub-snacks` in `cmsImageRegistry.ts` and `cbSiteMap.ts`.
  - Add `seo_pages` rows (title, description, h1) for each — picked up by prerender.
  - Hero copy (eyebrow, title, manifesto), bar snacks list, ale list section header, hours block — all editable via existing CMS text + image patterns (`CMSText`, `useCMSImages`, `useCMSMenuData`).
  - Add to `SeoPageEditor` route list automatically (driven by `seo_pages` table).
5. **Navigation / discovery**
  - Add "The Pub" link to `CBTopNav` primary nav and `CBFooter` site map (toggle pattern, mirroring Room Types: parent expands to Food / Drink / Stay / Snacks).
  - Add "The Pub" card to homepage `CBLandingSections`.
6. **SEO / prerender**
  - Each /pub route gets unique title, meta description, canonical, H1 via existing prerender pipeline (no new infra).
  - JSON-LD: `BarOrPub` schema on `/pub` with address, opening hours, servesCuisine.

## Technical details

- New files:
  - `src/pages/pub/PubHome.tsx`, `PubFood.tsx`, `PubDrink.tsx`, `PubHospitality.tsx`, `PubSnacks.tsx`
  - `src/components/pub/PubLayout.tsx` — wraps `pub-theme` class + CBTopNav (tone="dark") + Outlet + CBFooter
  - `src/components/pub/PubHero.tsx`, `ThreeDoors.tsx`, `SnacksStrip.tsx`, `Chalkboard.tsx`, `PinnedSpecials.tsx`, `DoorSignHours.tsx`
  - `src/styles/pub.css` — scoped tokens, paper-grain, wood-grain
- Route mount: add `<Route path="/pub" element={<PubLayout />}>` block in `App.tsx`, retire `/country/pub*` routes (replace with `<Navigate to="/pub*" replace />`).
- Prerender: `scripts/prerender.ts` already iterates `seo_pages` — just add the rows.
- Migration: insert seo_pages + cms_images rows for the five new pages; redirect rows if you keep a redirects table.

## Out of scope (flag if you want them in)

- Town getting its own /pub equivalent.
- A real-time tap list integration (currently CMS-driven static).
- Booking widget on `/pub` itself (defer to existing `/book`).

Confirm or tweak and I'll build.