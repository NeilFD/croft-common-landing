## Scope

New pages to add, plus footer + cookie infrastructure. Per the answers:

- **Dogs**: Country only (`/country/dogs`)
- **Both sites**: Treatments, Merch, Journal, Social Gallery, Terms, FAQ Hub, Cookies, Press, Contact, Careers — implemented as **root-level** pages that speak for both sites (one canonical page each, with Town + Country sections inside where it makes sense). Keeps the nav lean and avoids per-site duplication for content that isn't venue-specific.
- **Country events**: Pub Quiz, Cinema Nights, Outdoor Feasts (mirror of the Town Celebrate trio just added)
- **Merch**: showcase only (no checkout)
- **Cookies**: lightweight banner + generated policy
- **Socials**: IG `@crazybearhotels`, TikTok `@crazybeargroup`

## Page list and routes

```text
Country only
  /country/dogs                  Dogs at Stadhampton

Country "What's happening" (Discover)
  /country/pub-quiz
  /country/cinema-nights
  /country/outdoor-feasts

Root (both sites)
  /treatments                    Spa & treatments (Country-led, Town beauty add-ons)
  /merch                         Showcase grid, "Buy in venue / enquire"
  /journal                       Blog index (CMS-driven)
  /journal/:slug                 Blog post
  /gallery                       Social gallery (IG + TikTok embeds, curated grid)
  /press                         Press kit, logos, downloads, contact
  /contact                       Contact hub (Town + Country cards, form)
  /careers                       Roles, culture, apply CTA
  /faq                           Aggregated FAQ hub
  /terms                         Terms & conditions
  /cookies                       Cookies policy + manage preferences
```

## Journal / Blog (CMS authoring)

New `cb_journal_posts` table (same shape as `cb_stories`): `id, slug, title, excerpt, body_md, cover_image, author, published_at, status (draft|published), site_scope (both|town|country), tags[]`. RLS: public read for `published`, admin write.

Admin: new `JournalPage` in `src/admin/pages/` modelled directly on `StoriesPage`, added to `AdminSidebar` under Management. Markdown body, cover image upload via existing bucket, draft/publish toggle.

Front: `/journal` lists published posts (cards, filter by tag); `/journal/:slug` renders markdown with hero, author, date, related posts.

## FAQ Hub

`/faq` reads `cbFaqs` (already structured by page) and renders a single searchable, grouped accordion ("Stay", "Eat & Drink", "Celebrate", "Discover", "Membership", "Practical"). Each page-level FAQ already exists — hub just aggregates with deep-link anchors back to source pages.

## Cookie consent

- New `CookieBanner` component, mounted once in `App.tsx`. Sticky bottom-left, B&W, two buttons: "Accept" / "Reject non-essential". Choice persisted in `localStorage` under `cb-cookie-consent` (`accepted | rejected | null`).
- A `useCookieConsent()` hook exposes status. Analytics scripts (if/when added) gate on `accepted`.
- `/cookies` page: generated UK-compliant policy (essential, analytics, embeds: Spotify, YouTube, IG, TikTok), plus a "Manage preferences" button that re-opens the banner.

## Footer socials

Add IG + TikTok icon buttons (inline SVGs — no Lucide) to `CBFooter` "Across both" column, linking to:
- `https://instagram.com/crazybearhotels`
- `https://tiktok.com/@crazybeargroup`

## Social Gallery (`/gallery`)

Curated B&W grid. v1: static masonry of brand images grouped by tag (Food / Rooms / Nights / Dogs), with prominent "Follow on Instagram" and "Follow on TikTok" CTAs. v2 (out of scope here): live IG embed.

## Treatments, Merch, Dogs, Press, Contact, Careers, Terms

All use the existing `PropertyPage` / standard CB page shell (top nav + logo + CBFooter) with bespoke body content. Notable bits:

- **Treatments**: Country-led (spa lists), Town section for beauty add-ons. Booking CTA → enquire flow.
- **Merch**: 6–9 product cards, photo + price + "Available in venue", enquire link. No cart, no Stripe.
- **Dogs (Country)**: dog-friendly rooms, walk routes, house rules, treats. Photo-led.
- **Press**: short bio, downloadable logo pack (static assets), contact email, recent coverage list.
- **Contact**: Town card + Country card (address, phone, email, map link), plus enquiry form posting to existing `cb_enquiries` table.
- **Careers**: punchy culture intro (bold, irreverent — matches Bears Den voice), open roles list, apply CTA to careers email.
- **Terms**: standard UK hospitality T&Cs scaffold, editable via CMS.

## CMS + site map integration

For each new page:
1. Route registered in `src/App.tsx` (lazy).
2. Entry added to `src/data/cmsPages.ts` so the CMS visual editor, sidebar, and SEO monitor pick it up automatically (project rule: every new page must fit the CMS).
3. Linked from `src/data/cbSiteMap.ts` in the correct section so the homepage, top nav, and `CBFooter` all surface it without further edits:
   - Dogs → Country / Stay chips
   - Pub Quiz, Cinema Nights, Outdoor Feasts → Country / Discover
   - Treatments → both sites / Stay (Country) and Eat & Drink chips (Town)
   - Merch, Journal, Gallery, Press, Contact, Careers → footer "Across both"
   - Terms, Cookies → footer legal row
   - FAQ → footer "Across both" + top nav utility link

## Technical details

- Icons: inline SVGs for IG/TikTok (no Lucide).
- Tokens: B&W only, Bowlby One headings, Space Grotesk body. No new colours.
- Spellings: UK throughout (£, "favourite", "personalise", etc.).
- DB change required only for Journal: one migration creating `cb_journal_posts` + RLS + `updated_at` trigger. Awaiting approval before code.
- No new edge functions. No Stripe changes. No auth changes.
- Existing `cb_stories` admin pattern is the template for `JournalPage`.

## Build order

1. Migration: `cb_journal_posts` (await approval).
2. Cookie banner + `/cookies` page + footer socials (no DB).
3. Static pages: Dogs, Treatments, Merch, Press, Contact, Careers, Terms, FAQ hub, Gallery.
4. Country events: Pub Quiz, Cinema Nights, Outdoor Feasts.
5. Journal: front pages + admin authoring page.
6. Wire everything into `cmsPages.ts`, `cbSiteMap.ts`, `App.tsx`; verify build passes the CMS registry check.
