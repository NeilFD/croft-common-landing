
## Goal

Make every public marketing page editable in the CMS, sync the same list into SEO Monitor, and prevent any future page from being added without showing up in both places.

## Architecture: one registry, three consumers

Create a single source of truth: **`src/data/cmsPages.ts`**.

Every public page is declared once, with everything the CMS, SEO panel, sidebar, overview cards, and visual editor need. Today's three hardcoded lists (`CMSOverview.tsx`, `CMSSidebar.tsx`, `CMSVisualEditor.tsx`) and the `seo_pages` DB table all become consumers of this registry.

```text
src/data/cmsPages.ts  ──┬──>  CMSOverview (cards)
                        ├──>  CMSSidebar (nav tree)
                        ├──>  CMSVisualEditor (component map)
                        ├──>  SEO sync (upserts seo_pages)
                        └──>  Route audit (dev warning + build check)
```

Registry shape (per entry): `slug`, `route`, `title`, `description`, `group` (Country / Town / Members / Global / Standalone), `icon`, `componentLoader` (lazy import), `seo: { include: true, defaultTitle, defaultDescription, noindex }`, `parentSlug` (for nesting in sidebar).

## Pages added to the registry

Currently missing public pages, all to be added and made editable:

- Standalone: `/` (Landing), `/members`, `/bears-den`, `/curious`, `/house-rules`, `/community`, `/cafe`, `/cocktails`, `/beer`, `/kitchens`, `/onekitchen-menu`, `/hall`, `/event-enquiry`, `/book`, `/privacy`
- Already present: About, all Country/*, all Town/*, Global Footer, Global Navigation, Email Templates

Excluded (per your decision): `/den/*`, `/check-in`, `/calendar`, `/branding`, `/push-setup`, `/set-password`, redirects, admin routes.

## Full inline edit on every new page

For each missing page, wire CMS hooks so text, images, buttons, and lists are editable in the visual editor:

- Headings, paragraphs, button labels: `useCMSContent` via `<CMSText page="..." section="..." fallback="..." />`
- Hero / inline images: `useCMSImages` (fallback to current import)
- Repeating items (list cards, menus, FAQs): `useCMSList` (now safe after the per-row publish fix)
- Page-level SEO `<title>` / meta: `<CBSeo route="..." />` reading from `seo_pages`

Each page gets a unique `page` slug matching its registry entry (e.g. `members`, `bears-den`, `cafe`, `landing`, `house-rules`). All current hardcoded copy on those pages becomes the `fallback` value, so nothing changes visually until an admin edits.

## SEO auto-sync

- On admin login to the CMS / SEO Dashboard, run a one-shot upsert: every registry entry where `seo.include === true` gets a row in `seo_pages` (route, default title/description, noindex flag) if missing. Existing rows are never overwritten — admin edits win.
- New page added to the registry → next admin visit upserts it into `seo_pages` automatically. No manual SQL.
- SEO Dashboard shows registry entries with badges: "In SEO" (has row) / "Auto-syncing…" (about to upsert) / "Excluded" (registry says `seo.include: false`).

## Future enforcement (both layers)

**Dev warning** — `src/lib/routeAudit.ts` runs in `App.tsx` only when `import.meta.env.DEV`:
1. Reads all `<Route path="...">` declarations (statically extracted via a small build step / or by exporting a `ROUTES` array used by `App.tsx` so both files share one list).
2. Diffs against the registry.
3. Logs `console.warn` and renders a dismissible yellow banner at the top of `/management/cms` listing unregistered public routes.

**Build-time check** — `scripts/check-cms-registry.ts` runs as a `prebuild` script in `package.json`:
- Parses `src/App.tsx` route paths.
- Reads `src/data/cmsPages.ts`.
- Fails the build with a clear message if any public route (i.e. not in an explicit excluded-list) is missing from the registry.
- Same script also flags registry entries whose route no longer exists in `App.tsx`.

## Database changes

Single migration:
- Idempotent SQL function `seed_seo_page(route, title, description, noindex)` that `INSERT ... ON CONFLICT (route) DO NOTHING`. Called from the client after admin auth via `supabase.rpc`.
- No schema change to `seo_pages` itself — it already has what we need.

## Step-by-step

1. **Create registry** — `src/data/cmsPages.ts` with all current + missing entries.
2. **Refactor consumers** — `CMSOverview.tsx`, `CMSSidebar.tsx`, `CMSVisualEditor.tsx` to map over registry instead of hardcoded arrays.
3. **Wire CMS hooks into missing pages** — Landing, Members, Bears Den, Curious, House Rules, Community, Cafe, Cocktails, Beer, Kitchens, OneKitchen Menu, Hall, Event Enquiry, Book, Privacy. Each gets `<CMSText>` for copy, `useCMSImages` for hero/inline imagery, `useCMSList` where there are repeating cards, and `<CBSeo route="...">` at the top.
4. **SEO sync** — Add `seedSeoPagesFromRegistry()` helper, call it from `SeoDashboard.tsx` on mount. Add migration with `seed_seo_page` RPC.
5. **Dev warning** — `src/lib/routeAudit.ts` + banner component in CMS overview.
6. **Build check** — `scripts/check-cms-registry.ts`, add `"prebuild": "tsx scripts/check-cms-registry.ts"` to `package.json`.
7. **Smoke test** — Visit each new page in CMS visual editor, confirm preview renders and at least one inline edit works; confirm SEO Dashboard now lists all 15 new routes.

## What you'll see when it's done

- CMS Overview shows cards for every public page grouped by Country / Town / Members / Standalone / Global.
- CMS Sidebar lists every page; clicking opens the visual editor with the real page rendered and inline-editable copy/images.
- SEO Monitor shows a row for every public route with default meta seeded from the page itself.
- Add a new `<Route>` to `App.tsx` and forget the registry → dev console warns, CMS shows a banner, `bun run build` fails with: `Missing CMS registry entries: /your-new-route`.

## Out of scope (confirm if you want any added)

- Member-only `/den/*` pages
- Utility pages (`/check-in`, `/calendar`, `/branding`, `/push-setup`)
- Admin/management routes
- Visual page-builder style block reordering (this plan keeps existing layouts; only copy/images/lists/SEO are CMS-driven)
