## What you're looking at

The screenshot is the full-screen **menu overlay** (`CBNavOverlay`). It currently dumps every public route into four flat columns (Stay / Eat & Drink / Celebrate / Discover). It's long because Rooms alone contributes 14 lines (Types + 4 categories + Gallery × 2 sites).

The cleanest fix is to flip the model from **"by topic"** to **"by site"** (Town / Country) and use **concertinas** for the deep groups. Topic-mixed lists are why every line reads "Town/Country X" — once you nest under the site, the label noise vanishes.

## New structure

Two big columns, mirrored:

```text
┌─ CRAZY BEAR TOWN ──────────┐   ┌─ CRAZY BEAR COUNTRY ───────┐
│  Town home                 │   │  Country home              │
│  ▸ Food            [+]     │   │  ▸ Food            [+]     │
│  ▸ Drink           [+]     │   │  ▸ Pub             [+]     │
│  ▸ Rooms           [+]     │   │  ▸ Rooms           [+]     │
│    Pool                    │   │    Terraces & Gardens      │
│    Karaoke                 │   │    Parties                 │
│    Culture                 │   │  ▸ Events          [+]     │
│    Playlist                │   │    Culture                 │
│                            │   │    Playlist                │
└────────────────────────────┘   └────────────────────────────┘

┌─ ACROSS BOTH ──────────────────────────────────────────────┐
│  What's Happening · Stories from the Bear · Gift Vouchers  │
│  About · House Rules · The Bear's Den                      │
└────────────────────────────────────────────────────────────┘

[ BOOK ]   [ ENQUIRE ]      Privacy · Unsubscribe · Switch site
```

Concertinas (`<details>`) expand to reveal sub-pages, e.g.:

- **Town → Rooms** → Snug · Cosy · Boujee · Decadent · Room Types · Gallery
- **Town → Food** → Menus · The Black Bear · B&B · Hom Thai · Afternoon Tea
- **Country → Rooms** → Snug · Cosy · Boujee · Decadent · Room Types · Gallery
- **Country → Food** → Menus · Afternoon Tea
- **Country → Pub** → Food · Drink · Hospitality
- **Country → Events** → Weddings · Birthdays · Business

That collapses the menu from ~45 visible links to **~16 lines closed**, with everything one tap away.

## Why this is best practice

**UX**
- **Mental model matches the brand.** Town and Country are the two products. Topic-bucketing forces every label to disambiguate ("Town Cocktails", "Country Pub Drink"); site-bucketing lets labels be short ("Cocktails", "Drink").
- **Progressive disclosure.** ~7±2 visible items per column is the comfortable scan limit; concertinas hide depth without losing it.
- **One scroll, one screen.** On a laptop the whole menu fits without scrolling once concertinas are closed.
- **Single source of truth.** `Open` defaults differ by viewport — on mobile everything starts collapsed, on desktop the two `Rooms` groups can default open since that's the most-clicked area.

**SEO**
- Use semantic `<details>/<summary>` so collapsed links **stay in the DOM** — Google indexes hidden-by-default content as long as it's in the rendered HTML, which `<details>` guarantees.
- Keep every `<a href>` (no JS-only reveal). Crawlers follow them regardless of open state.
- Add `aria-label="Site menu"` (already there) and `aria-expanded` on `<summary>` (browser handles for `<details>`).
- No change to `sitemap.xml` / `llms.txt` — those already enumerate everything.
- Avoid duplicating links in multiple columns; one link per route prevents internal-link dilution.

## Build steps

1. **Extend `src/data/cbSiteMap.ts`** with a new `SITE_TREE` export that groups by site:
   ```ts
   export const SITE_TREE = {
     town:    { label, home: "/town",    sections: [ {label, path?, links?}, ... ] },
     country: { label, home: "/country", sections: [ ... ] },
     both:    [ {label, path}, ... ]   // What's Happening, Stories, Gift Vouchers, About, House Rules, Bear's Den
   }
   ```
   Keep the old `SITE_MAP` export untouched so `CBFooter` and `CBLandingSections` don't break — they can be migrated in a follow-up if you want.

2. **Rewrite `CBNavOverlay.tsx`**:
   - Top bar unchanged.
   - Body becomes a `grid-cols-1 md:grid-cols-2` for Town / Country, with a third "Across both" row below.
   - Use a small `<NavGroup>` component that renders `<details>` when `links` exist, otherwise a flat `<Link>`.
   - Defaults: closed on mobile (`<details>` no `open`), `open` on `md:` and up for Rooms only (via a CSS-only `md:[&]:open` trick or a tiny `useMediaQuery`).
   - Keep Book / Enquire / property switch / legal in the footer row, but slim them into one line.

3. **Style**:
   - `<summary>` styled to look like the current section H2 but one size smaller (`text-2xl md:text-3xl font-display uppercase`), with a `+` / `–` indicator using `::after` and `[open]:` variant.
   - Removes the redundant "Town"/"Country" prefix from every child label.
   - No focus rings on the summary (per project rule) — use underline-on-focus instead.

4. **Telemetry-friendly**: each `<summary>` gets `data-nav-section="town/rooms"` etc., so analytics can see which concertinas users open.

5. **No DB, no route, no sitemap changes.** Pure presentation refactor of one component plus an additive data export.

## Out of scope (flag for later)

- Migrating `CBFooter` and `CBLandingSections` to the same Town/Country structure — they currently use the topic columns. Worth doing for consistency, but it's a separate visual change.
- Adding a search input at the top of the menu (often useful on sites this deep).

## Open question before I build

The "Across both" row currently lists 6 links flat. If you'd prefer those split into **Visit** (What's Happening, Stories, Gift Vouchers) and **About** (About, House Rules, The Bear's Den) — say the word, otherwise I'll keep them as one tidy row.
