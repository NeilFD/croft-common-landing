## Phase A — Roll out editable text to every CMS-wired page

Apply the same `CMSText` pattern that now works on Black Bear to every other page exposed in the visual editor.

**Pages to wire (using existing `cmsPage` namespacing):**

Town

- `town` (TownHome — eyebrow, title, body)
- `town/food` (TownFood)
- `town/food/black-bear` (done — verify)
- `town/food/bnb` (full menu via CBMenuPage, like Black Bear)
- `town/food/hom-thai`
- `town/drink`, `town/drink/cocktails`
- `town/rooms`, `town/rooms/types`, `town/rooms/gallery`
- `town/pool`

Country

- `country`, `country/pub`, `country/pub/food` (menu), `country/pub/drink`, `country/pub/hospitality`
- `country/rooms`, `country/rooms/types`, `country/rooms/gallery`
- `country/parties`, `country/events`, `country/events/weddings`, `country/events/birthdays`, `country/events/business`

**How:**

1. Add an optional `cmsPage` prop to `PropertyPage.tsx`. When present, wrap `eyebrow`, `title`, `body`, FAQ section heading and breadcrumb labels in `CMSText` with stable keys (`hero.eyebrow`, `hero.title`, `hero.body`).
2. In `src/pages/property/index.tsx`, pass a `cmsPage` matching the route slug to every `PropertyPage` and `MenuRoute`.
3. Pass `cmsPage` into `CBMenuPage` for the remaining menu pages (BnB, Country Pub Food) so dish names/prices/descriptions get pink dots like Black Bear.
4. Add `CMSText` wrapping inside `CBGallery` captions for the gallery routes.
5. Verify the EditMode dot indicator now appears on every editable string and that publish enables/clears correctly across all pages.

---

## Phase B — Assets section: edit > publish for all imagery

A single "Assets" area in the CMS sidebar where every image used on the live site can be swapped, reordered and published, including page hero singles, triptych carousels, and gallery grids.  
  
  
ALSO NEED TO BE ABLE TO ADD MORE IMAGES TO CAROUSELS THAN JUST FOUR, THREE IS NOT A LIMIT

### B1. Inventory & registry

Create `src/data/cmsImageRegistry.ts` listing every image slot the site renders, grouped by page and slot type:

- `hero` (single image) — e.g. `town/pool`, `country/parties`
- `carousel` (ordered list) — e.g. `town` triptych, `country` triptych, `town/rooms`, `country/rooms`, cocktails hero
- `gallery` (ordered grid with captions) — `town/rooms/gallery`, `country/rooms/gallery`

Each entry declares: `page`, `slot`, `kind` (`hero | carousel | gallery`), `label`, `defaultImages[]` (the current hard-coded imports from `propertyHeroMap.ts`, `heroCarousels.ts`, `galleryData.ts`, `heroImages.ts`).

This registry is the source of truth the Assets UI iterates over, and it provides fallbacks if no CMS row exists.

### B2. Database (single table, draft+publish)

Extend the existing `cms_images` table (already has `page`, `section`, `image_url`, `alt_text`, `sort_order`, `published`) with the columns we need to support drafts and slot semantics:

- `slot text` — matches registry slot key (replaces ad-hoc `section` use; keep `section` as alias)
- `kind text` — `hero | carousel | gallery`
- `caption text` — for gallery items
- `is_draft boolean default false`
- `updated_at timestamptz`
- index on (`page`, `slot`, `published`, `sort_order`)

Drafts are rows with `is_draft = true, published = false`. Publishing for a slot = transactionally delete the slot's published rows and flip drafts to `published = true, is_draft = false`. Mirrors the text publish flow in `useDraftContent`.

Storage: reuse an existing public bucket (or create `cms-assets`) for uploads, with admin-only insert/update/delete and public read.

### B3. Read path (live site + preview)

New hook `useCMSAssets(page, slot)`:

- In CMS preview/edit mode → returns drafts merged over published.
- On the live site → returns published only.
- Falls back to registry `defaultImages` when no rows exist (so nothing breaks until an admin uploads).

Refactor consumers to use it:

- `propertyHeroMap` lookups in `PropertyPage` → `useCMSAssets(page, 'hero')`
- `getHeroCarouselFor` in `PropertyPage` → `useCMSAssets(page, 'hero-carousel')`
- `CBGallery` items → `useCMSAssets(page, 'gallery')`
- `CocktailHeroCarousel` (already uses `useCMSImages`) → migrate to the new hook
- `useCMSImages` becomes a thin compat wrapper

### B4. Assets UI (in `/management/cms`)

New left-sidebar section "Assets" with two views:

1. **By page** — pick a page, see all its slots (hero, carousel, gallery), thumbnails, with a single "Publish page assets" button.
2. **All assets** — flat searchable list across all pages.

Slot editor card per slot:

- **Hero**: drop-zone, replace single image, alt text field.
- **Carousel**: thumbnail strip, drag-to-reorder, add/remove, alt text per slide.
- **Gallery**: same as carousel plus caption field per item.

Common controls per card: Save draft (auto), Discard draft, Publish slot. A global "Publish all drafts" mirrors the text publish flow.

Uploads use the storage bucket; on success the public URL is written as a draft row.

### B5. Visual editor integration

In edit mode (`/management/cms/visual/...`), images rendered through `useCMSAssets` get a pink overlay icon (matching the text dots). Clicking opens the same slot editor as a side panel, so admins can edit imagery in context and publish from the same Publish button as text.

---

## Technical notes

- All new tables/columns via `supabase--migration`; keep RLS admin-only writes, public read.
- Reuse `EditModeContext` and `useDraftContent` patterns so the existing Publish button enables for image drafts too (extend `draftCount` to include image drafts).
- No new image hosting — Supabase Storage public bucket.
- No AI generation; only admin uploads (workspace rule).
- Live site reads stay fast: TanStack Query with the same staleTime as `useCMSImages`, fallback to bundled imports for instant first paint.

## Suggested order of work

1. Phase A (text rollout) — quick, mechanical, unblocks copy editing everywhere.
2. B1 + B2: registry + migration.
3. B3: read hook + refactor consumers (site keeps working off defaults until uploads exist).
4. B4: Assets management UI.
5. B5: in-context editing in the visual editor.