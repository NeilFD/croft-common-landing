## What's actually broken

Every public page IS registered in the CMS (`src/data/cmsPages.ts`) and almost every page IS wired for inline copy editing (`cmsPage="..."` → `CMSText` slots in `PropertyPage` / `CBMenuPage`). The visual editor route works (e.g. `/management/cms/visual/town/food/afternoon-tea` will render the live page with click-to-edit).

The problem is the **sidebar in `src/components/cms/CMSSidebar.tsx`** only renders **two levels** deep:

```
Country Home
 ├─ Country Pub        ← child of `country`        ✓ visible
 ├─ Country Food       ← child of `country`        ✓ visible
 │   ├─ Country Menus     ← grandchild             ✗ HIDDEN
 │   └─ Afternoon Tea     ← grandchild             ✗ HIDDEN
 ├─ Country Rooms
 │   ├─ Room Types        ← HIDDEN
 │   ├─ Room Gallery      ← HIDDEN
 │   ├─ Snug/Cosy/...     ← HIDDEN
 └─ Country Events
     ├─ Weddings          ← HIDDEN
     ├─ Birthdays         ← HIDDEN
     └─ Business          ← HIDDEN
```

Pages currently unreachable from the sidebar (so you can never click into them to edit copy):

**Country**: `country/pub/food`, `country/pub/drink`, `country/pub/hospitality`, `country/rooms/types`, `country/rooms/gallery`, `country/rooms/snug`, `country/rooms/cosy`, `country/rooms/boujee`, `country/rooms/decadent`, `country/food/menus`, `country/food/afternoon-tea`, `country/events/weddings`, `country/events/birthdays`, `country/events/business`, `country/playlist` (parentSlug `country/culture`).

**Town**: `town/food/black-bear`, `town/food/bnb`, `town/food/hom-thai`, `town/food/menus`, `town/food/afternoon-tea`, `town/drink/cocktails`, `town/rooms/types`, `town/rooms/gallery`, `town/rooms/snug`, `town/rooms/cosy`, `town/rooms/boujee`, `town/rooms/decadent`, `town/pool-party` (parent `town/pool`), `town/playlist` (parent `town/culture`).

(The same pages appear in the public **Assets** page picker as "73 pages total" — they exist, the sidebar just hides them.)

## Fix

1. **`src/components/cms/CMSSidebar.tsx`** — replace the hand-rolled two-level `renderPage` with a recursive `renderNode` driven by `childrenOf(slug)`. Nodes with children render as a `Collapsible` with the same chevron + indent treatment already in use; nodes without children render as a plain `NavLink`. No data changes required because `parentSlug` already encodes the full tree.

2. **Audit pass on a handful of pages that currently render hardcoded copy outside `CMSText`** so editing actually does something for every section the user can now reach:
   - `src/pages/property/index.tsx` — `CBSectionedPage` sections (Terraces & Gardens 4 areas) and `CBMenusIndex` venue blurbs are hardcoded strings. Wire each section title/body and each venue name/blurb through `CMSText` using deterministic content keys (e.g. `country/terraces-and-gardens.fishpond.title`).
   - `src/components/crazybear/culture/CulturePage.tsx` (Town Culture, Country Culture) — currently no `CMSText`. Wrap the rendered copy blocks so both culture pages are editable.
   - `src/pages/crazybear/Stories.tsx`, `Journal.tsx` index intros — wrap intro copy in `CMSText` (post bodies stay in their existing post tables).

3. **Add Hospitality, Stories, Journal etc. that were missing from the sidebar list** — these come back automatically once the sidebar recurses, no separate work.

4. **No registry / no route / no schema changes.** No DB migration. The fallback strings already in the code stay as defaults until you publish edits.

## How you'll use it after

Open `/management/cms` → the Country and Town sections in the left sidebar expand all the way down (Country → Country Food → Afternoon Tea, etc.). Click any page → click **Edit** → click any text on the rendered page to change it → **Publish**.

## Out of scope

- No changes to authentication, the database, the Assets image flow, routing, or page layouts.
- Tightly templated micro-copy (button labels inside shared components like `CBMenusIndex`, schema-driven SEO defaults) stays as-is unless you want a second pass after this lands.
