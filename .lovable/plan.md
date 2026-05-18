## Goal
Make the CMS Assets section cover every page automatically (so new pages can't be missed), replace the long dropdown with a fast searchable picker, and let editors pull free imagery straight from Unsplash.

---

## 1. Every page in the Assets directory (auto-synced)

Today `src/data/cmsImageRegistry.ts` is a hand-maintained list of ~28 slots, while `src/data/cmsPages.ts` knows about 80+ public pages. Drift is guaranteed.

Fix: make `cmsPages.ts` the single source of truth, the same way the text CMS already does.

- Add a small `assets?: { hero?: boolean; carousel?: boolean; gallery?: boolean }` hint to each page entry in `cmsPages.ts`. Default = `{ hero: true }` if omitted, so simply adding a page gives it a hero slot for free.
- Rewrite `cmsImageRegistry.ts` to derive `cmsImageRegistry` by mapping over `cmsPages` and emitting the right slot(s) per page. Existing bundled defaults (`propertyHeroMap`, `heroCarouselMap`, `townGallery`, `countryGallery`, culture collages) stay where they are and are looked up by route.
- Pages that already have bespoke slots (`town/rooms/gallery` gallery, `town-culture` collage, etc.) get explicit `assets: { hero, gallery: true }` flags.
- Keep `findSlot`, `slotsForPage`, `allPagesWithAssets` — same signatures, just now driven by the derived list.
- Update `scripts/check-cms-registry.ts` so CI fails if a page in `cmsPages.ts` ends up with zero asset slots when it should have one.

Net result: every existing public page (Bears Den, Careers, Press, Treatments, all the new rooms/snug/cosy/boujee/decadent variants, Karaoke, Parties, Birthdays, Terraces, Playlist, etc.) appears in Assets with at least a hero slot. Adding any future page to `cmsPages.ts` auto-adds it to Assets.

---

## 2. Better page picker (replaces the dropdown)

Replace the current `<Select>` in `src/components/cms/AssetsManager.tsx` with a shadcn `Command` palette inside a `Popover`, mirroring what good admin tools do (Linear, Vercel, Stripe).

Picker UX:
- Trigger button shows the current page + small chevron, full-width on mobile.
- Click opens a popover with:
  - Sticky search input at the top (autofocus, fuzzy match on slug, title, and `group`).
  - Results grouped by section using `CommandGroup`: **Country**, **Town**, **Global**, **Legal**, **Membership** — pulled from the existing `group` field in `cmsPages.ts`.
  - Each row: page title in bold, route in muted mono, small badge showing slot count (`1 slot`, `2 slots`).
  - Keyboard navigation (up/down/enter) and `⌘K` shortcut to open from anywhere on the Assets page.
- Recently edited pages (last 5) pinned to a "Recent" group at the top, stored in `localStorage`.
- No transparent backgrounds (per project rules) — solid `bg-popover` with border.

This scales cleanly to 80+ pages and matches what users expect.

---

## 3. Unsplash search inside Assets

Add an "Add from Unsplash" button next to "Replace / Add" on every slot.

Backend:
- New edge function `supabase/functions/unsplash-search/index.ts` with two actions:
  - `search`: proxies `GET https://api.unsplash.com/search/photos?query=…&per_page=24&orientation=…` using `UNSPLASH_ACCESS_KEY` (added via `add_secret`). Returns id, thumb, regular URL, alt, photographer name + profile URL, and the `links.download_location` ping URL.
  - `import`: takes a photo id + slot context, calls the `download_location` (required by Unsplash terms), fetches the full image, uploads it into the existing `cms-assets` Supabase storage bucket under `<page>/<slot>/unsplash-<id>.jpg`, and inserts a draft `cms_images` row with alt text auto-filled and a caption credit like `Photo by <name> on Unsplash`.

Frontend:
- New `UnsplashPicker` dialog component opened from the slot card.
- Search box (debounced), orientation toggle (landscape/portrait/square — defaults to landscape for hero, square for gallery), grid of results, hover shows photographer credit.
- Selecting one or more thumbnails calls `import`, then refreshes the slot. Drafts behave exactly like uploaded files (publish/discard already works).
- Loading + empty + error states; rate-limit message surfaces the Unsplash 50/hour demo limit if hit.

Compliance:
- Photographer credit stored in `caption` and rendered where the slot allows (already supported for gallery; for hero slots, credit lives in alt/caption metadata and is shown in the CMS card but not on the public site, which matches Unsplash terms).
- The `download_location` ping is always fired on import — required by the Unsplash API guidelines.

---

## Files touched

- `src/data/cmsPages.ts` — add optional `assets` hint per page.
- `src/data/cmsImageRegistry.ts` — rewrite as derived list; keep public API.
- `scripts/check-cms-registry.ts` — add coverage check.
- `src/components/cms/AssetsManager.tsx` — Command-palette picker, Unsplash button per slot, recent-pages memory.
- `src/components/cms/UnsplashPicker.tsx` — new dialog.
- `supabase/functions/unsplash-search/index.ts` — new edge function (search + import).
- `supabase/config.toml` — register the new function (no JWT needed since it's CMS-gated by the admin route, but we'll require the user session to call `import`).
- Secret: `UNSPLASH_ACCESS_KEY` requested via `add_secret`.

No DB schema changes — reuses existing `cms_images` table and `cms-assets` storage bucket.

---

## Out of scope
- Replacing the global Marketing Assets library (`/management/marketing/assets`). The new Unsplash flow lives inside CMS Assets only; we can extend it to that page later if useful.
- Image cropping/editing UI.
- Auto-generating slots beyond hero/carousel/gallery (e.g. inline section images) — those can be added per-page when needed.
