## Remaining work

Pages and infra files already exist (Treatments, Merch, Gallery, FAQHub, Press, Contact, Careers, Terms, Cookies, CBStaticPage, CBCookieBanner, useCookieConsent, SocialIcons, footer updates, `cb_journal_posts` migration). What's left is fixing the FAQ field bug, mounting the banner, building the Country event + Journal pages, and registering everything into the routing/CMS/site map so the build passes the registry check.

## 1. Fix FAQHub field mapping

`cbFaqs` uses `question` / `answer` (and groups by `page`). Update `src/pages/crazybear/FAQHub.tsx` to read those fields, group by page key, and provide a search across both fields.

## 2. Mount cookie banner globally

In `src/App.tsx`, render `<CBCookieBanner />` once at the app root (alongside Toaster) so it appears on every route. The `/cookies` page already exposes a "Manage preferences" button via the `useCookieConsent` hook.

## 3. Country event pages (mirror of Town Celebrate trio)

Add three Country-only pages following the same CMS pattern used for `/town/parties`, `/town/birthdays`, `/town/pool-party`:

```text
/country/pub-quiz          Pub Quiz at Stadhampton
/country/cinema-nights     Cinema Nights at Stadhampton
/country/outdoor-feasts    Outdoor Feasts at Stadhampton
```

Implementation:
- Add entries to `src/pages/property/index.tsx` under the Country branch.
- Add to `src/data/cmsPages.ts` so each appears in CMS visual editor + SEO monitor.
- Add to `src/data/cbSiteMap.ts` Country / Discover column (already has Culture, Playlist).

## 4. Dogs page (Country only)

`/country/dogs` — dog-friendly rooms, walks, house rules, treats. Built into `src/pages/property/index.tsx` (Country branch), CMS-registered, linked from Country / Stay chips in `cbSiteMap.ts`.

## 5. Journal (front-end)

Two routes:

```text
/journal             Index — published posts from cb_journal_posts (cards, tag filter)
/journal/:slug       Detail — markdown body, cover, author, date, related
```

- New page files `src/pages/crazybear/Journal.tsx` and `src/pages/crazybear/JournalPost.tsx`, both using `CBStaticPage` shell.
- Query Supabase via existing client; respect `status = 'published'`.
- Markdown rendering via the project's existing markdown approach (check `cb_stories` detail for the precedent and re-use it).

## 6. Journal (admin authoring)

- New `src/admin/pages/JournalPage.tsx` modelled directly on `StoriesPage.tsx` (list, create, edit drawer, draft/publish toggle, cover upload to `cms-assets`).
- Add route `management/journal` in `src/admin/AdminApp.tsx`.
- Add link in `src/admin/components/AdminSidebar.tsx` under Management.

## 7. Route registration

In `src/App.tsx`, add lazy routes for:

```text
/treatments  /merch  /gallery  /faq  /press  /contact  /careers  /terms  /cookies
/journal     /journal/:slug
```

## 8. CMS + site map wiring

For every new public route, add an entry to:
- `src/data/cmsPages.ts` (so the CMS visual editor + SEO monitor pick it up — project rule).
- `src/data/cbSiteMap.ts`:
  - Dogs → Country / Stay chips
  - Pub Quiz / Cinema Nights / Outdoor Feasts → Country / Discover column
  - Treatments → Country Stay + Town Eat & Drink columns
  - Merch, Journal, Gallery, Press, Contact, Careers → footer "Across both" (extend `SITE_TREE.both`)
  - FAQ → footer "Across both" + nav utility
  - Terms, Cookies → `LEGAL_LINKS`

## 9. Verification

- Run `scripts/check-cms-registry.ts` mentally against the changes (every new route must be in `cmsPages.ts`).
- Smoke the build, then load `/`, `/journal`, `/faq`, `/cookies`, and `/country/pub-quiz` to confirm shells render.

## Build order

1. FAQHub field fix + mount cookie banner (quick wins).
2. Register all already-built static pages in `App.tsx`, `cmsPages.ts`, `cbSiteMap.ts`.
3. Country events + Dogs (property index + CMS + sitemap).
4. Journal front pages.
5. Journal admin page + sidebar + admin route.
6. Final registry check, build.

## Out of scope

- No new DB tables (only `cb_journal_posts`, already migrated).
- No Stripe / checkout (Merch stays showcase only).
- No live IG/TikTok embeds (Gallery stays curated grid v1).
- No new edge functions.
