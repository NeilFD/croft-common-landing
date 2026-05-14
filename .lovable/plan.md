# Structural SEO & UX Plan (No Design Changes)

Frances is right on the substance. This plan keeps the current look, colours, typography and components exactly as they are. Only structure, content scaffolding, headings and links change.

## Guardrails

- No visual redesign. No new colour, no new font, no new component aesthetic.
- No nav swap between pages. One consistent group navigation everywhere.
- No URL changes without a redirect map.
- Reuse existing CBTopNav, CBFooter, CBSeo and CMS plumbing.

## Step 1 — One consistent group nav (kill the per-page nav swap)

Frances's point 1. Soho House model: same nav, choose the setting, go in.

- `CBTopNav` becomes the single global nav across `/`, `/town`, `/country` and every property subpage. No variants, no swap.
- Items mirror the real site map (see step 4): Stay, Eat & Drink, Celebrate, Discover, Bear's Den. Town/Country becomes a setting picker inside the nav, not a structural switch.
- Persistent `Book` CTA at all viewports — Frances explicitly calls this out as more important than the venue switcher.
- Mobile: hamburger opens the same items, no hidden links. Town/Country toggle is a clearly labelled control inside the menu, not a vanishing chip.
- Visual treatment unchanged — same mark, same typography, same B&W tokens.

## Step 2 — Homepage content that mirrors the menu

Frances's point 2. On-page sections in the same order as the nav, so scrolling = menu navigation.

Add stacked sections under the existing hero, all using existing components and tokens (no new design language). Each section is a signpost into a money page, not a rebuild of it.

1. **Stay** — short intro, link to Town Rooms and Country Rooms.
2. **Eat & Drink** — short intro, links to The Black Bear, B&B, Hom Thai, Cocktails, Country Pub.
3. **Celebrate** — Weddings, Parties, Business Events.
4. **Discover** — About, House Rules, Town Culture, Country Culture, Journal.
5. **The Bear's Den** — short pitch, link to `/bears-den` and `/curious`.
6. **Visit us** — Town and Country address blocks with Book a room / Reserve a table / Get directions.

Existing subscription form stays, moved just above footer. Hero, wordmark, Town/Country door — unchanged.

## Step 3 — Heading hierarchy (preserve SEO authority)

Frances's point 3. Right now `/` has one thin H1 and almost no semantic content.

- Single H1 on `/` — keep "Crazy Bear" as the visible mark, but the H1 carries the brand + descriptor ("Crazy Bear — Boutique Hotels in Beaconsfield and Stadhampton"), visually unchanged via existing display type.
- Each section in step 2 gets a real H2 (Stay, Eat & Drink, Celebrate, Discover, The Bear's Den, Visit us).
- Sub-items inside each section use H3.
- Audit existing pages (`/town`, `/country`, property subpages) for the same H1/H2/H3 discipline. No styling change — just correct tags.
- Add `BreadcrumbList` JSON-LD on subpages via existing `CBSeo` JSON-LD prop.
- Add `LodgingBusiness` JSON-LD for each property on `/` (in addition to current HotelGroup).
- Rewrite meta descriptions to be benefit-led, en-GB.

## Step 4 — Site map (real one, in code and in the footer)

Frances's point 6. A project begins with the site map.

- Author the canonical site map as a typed config (`src/data/cbSiteMap.ts`). The nav (step 1), the homepage section order (step 2), `public/sitemap.xml` (via `scripts/generate-sitemap.ts`), and the footer site map (below) all read from this single source.
- Footer: extend `CBFooter` with a full site map block — grouped columns (Stay / Eat & Drink / Celebrate / Discover / Bear's Den / Legal). Existing CBFooter styling preserved, just more links inside it.
- Generate `public/sitemap.xml` from the same config so Google sees what users see.

## Step 5 — Migration & redirects

Frances's point 4. Any URL that changes needs a redirect.

- Inventory current live URLs (from existing routes + sitemap + Search Console export if available).
- Compare to the site map from step 4. Flag every changed, removed or renamed path.
- For each changed path, add a client-side redirect route in the React Router config (`<Route path="/old" element={<Navigate to="/new" replace />} />`) so equity transfers and external links don't break.
- Document every redirect in a single file (`docs/redirects.md`) for Frances and for future audits.
- No URL changes go live without an entry in this file.

## Step 6 — User journey writeup (talk track for Frances)

Frances's point 6 (the second one). She wants to see the journey before more build.

- Produce a short doc: `docs/user-journey.md`. Three primary journeys (Book a room, Reserve a table, Enquire about a wedding) and three secondary (Join Bear's Den, Read Journal, Find directions). Each step references the route + section from the site map (step 4).
- This is the artefact you send Frances before the next build round.

## Step 7 — CMS coverage

Project rule: every new section is editable.

- Step 2 sections registered under a new `landing` CMS namespace (text + asset keys).
- Footer site map labels editable via the same `cbSiteMap.ts` (CMS-overridable).
- No hardcoded copy in any new section.

## Out of scope

- Any visual redesign (explicitly excluded per your instruction and Frances's recommendation to reskin the live site, not rebuild).
- Booking engine changes — `Book` continues to route to the existing `/book`.
- Real press logos / awards (deferred — not part of Frances's structural feedback).
- Switching off the live site. This plan is purely additive/structural on the new build.

## Build order

1. Site map config (step 4) — single source of truth.
2. Consistent group nav driven by it (step 1).
3. Footer site map driven by it (step 4 cont.).
4. Homepage sections mirroring the menu (step 2).
5. Heading hierarchy + JSON-LD + meta (step 3).
6. Redirect inventory + routes (step 5).
7. CMS wiring (step 7).
8. User journey doc to Frances (step 6).

Confirm and I'll start with step 1 (the site map config).

&nbsp;

Ignore Step entirely