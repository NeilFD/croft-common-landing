## Goal

Give you a single place in the Management area to:
1. **See** how every public page is performing for SEO (clear A–F score, what's wrong).
2. **Fix** anything wrong from a simple form (no code, no jargon).
3. **Re-test** on demand and track progress over time.

You won't need to know what a meta tag is. The form labels are plain English ("Page title shown on Google", "Short summary under the title", "Sharing image for WhatsApp/Facebook"). The audit explains every issue in plain English with a fix.

---

## What gets built

### 1. Per-page SEO editor (the "Fix" side)

A new section under `/management/seo` listing every public route from your sitemap (around 25 pages: `/`, `/town`, `/town/food`, `/country`, `/about`, `/house-rules`, `/bears-den`, etc.).

For each route you can edit:
- **Page title** (the blue link on Google) — with a live preview of how Google will show it
- **Description** (the grey snippet under the title) — same live preview
- **Sharing image** (what shows up on WhatsApp / Facebook / iMessage) — pick from CMS assets
- **Keywords** (optional, low priority)
- **Hide from Google** toggle (for pages you don't want indexed)

Stored in a new `seo_pages` table. A single `<CBSeo>` component already exists; it gets upgraded to read overrides from this table (with sensible Bears Den defaults baked in as fallback). So if the table is empty, nothing breaks — defaults still apply.

### 2. The auditor (the "See" side)

A `seo-audit` edge function that, when triggered, does two passes per route:

**Pass A — Internal scan (fast, free, runs in seconds):**
Fetches the page HTML and checks:
- Title present, 30–60 chars
- Description present, 70–160 chars
- Exactly one `<h1>`
- All `<img>` have `alt` attributes
- Canonical URL set
- Open Graph + Twitter card tags present
- JSON-LD structured data present
- Sharing image resolves (not 404)
- Internal links not broken
- Robots not accidentally blocking the page

**Pass B — Google PageSpeed Insights (real Lighthouse, slower, ~20s/page):**
Calls Google's free PageSpeed API and stores the four official Lighthouse scores:
- Performance
- SEO
- Accessibility
- Best Practices
Plus Core Web Vitals (LCP, CLS, INP).

Results saved to `seo_audits` (one row per page per run) so you build up history.

### 3. The dashboard (what you'll actually look at)

`/management/seo` opens to a page that shows:

```text
Overall site score:  B+   (was B last week)

Pages needing attention                Score   Issues
-----------------------------------------------------
/town/food/black-bear                  D       Missing description, no H1, 3 images without alt
/about                                 C       Title too long (74 chars), slow LCP (3.8s)
/                                      A       
/country                               A-      Sharing image is 1.2MB (compress)
... etc
```

Each row clicks through to:
- The Google preview of how it currently looks in search
- The list of issues with **plain English explanations and an "Edit page SEO" button** that drops you straight into the editor with the right field highlighted
- Lighthouse score breakdown
- History chart (score over the last 30 days)

### 4. Re-test controls

- "Re-test this page" button on any page row
- "Re-test entire site" button on the dashboard
- Optional weekly automatic re-test via `pg_cron` (every Sunday night) so scores stay current without you doing anything

### 5. Behind the scenes (always-on, no UI needed)

These get wired up site-wide so the score floor goes up immediately, before you touch anything:
- One `<h1>` enforced per page (audit existing pages, fix offenders)
- All `<img>` get `alt` attributes (sweep components)
- `robots.txt` and `sitemap.xml` already exist — sitemap gets auto-regenerated when you add a route
- JSON-LD `Organization` + `LocalBusiness` schema added to home/town/country
- Canonical URLs on every page
- Default OG image for any page that doesn't have a custom one

---

## Coverage

All 25 public routes from your existing `sitemap.xml`. Member, management, admin, CMS routes are explicitly excluded (they shouldn't be indexed anyway).

---

## Permissions

Same access model as the rest of `/management`. Visible to admins. Editors with CMS access can edit per-page SEO; only admins can trigger full-site re-audits (PageSpeed API has rate limits).

---

## Technical details

- **New tables:** `seo_pages` (one row per route, holds overrides), `seo_audits` (audit run history), `seo_settings` (global defaults: site name, default OG image, organisation JSON-LD)
- **New edge function:** `seo-audit` — accepts `{ route }` or `{ all: true }`, runs internal scan + PageSpeed call, writes to `seo_audits`
- **Google PageSpeed Insights API** — free, no auth required for low volume, but adding a Google API key (free) raises the limit to 25k/day. Will ask you to add `GOOGLE_PAGESPEED_API_KEY` when we get there
- **CMS routes:** `/management/seo` (dashboard), `/management/seo/:route` (per-page editor), `/management/seo/settings` (global defaults)
- **Existing `<CBSeo>` component** is extended to merge defaults + per-page overrides from the database, cached client-side
- **`sitemap.xml`** moves from static file to a generated route (or a build-time script) so new pages auto-appear
- **Cron:** weekly re-audit via `pg_cron` + `pg_net`

---

## Build order

1. Schema + `seo_pages`/`seo_audits`/`seo_settings` tables with RLS
2. Upgrade `<CBSeo>` to read overrides + sensible defaults
3. Sweep existing pages to fix obvious issues (single H1, alt text, canonical) so baseline score is decent
4. `seo-audit` edge function (internal scan only first)
5. Management dashboard + per-page editor UI
6. Add PageSpeed Insights integration (will request the API key here)
7. History charts + weekly cron
8. Auto-generated sitemap

Each step is shippable on its own; you'll see progress straight away.

---

## What I will NOT do

- Won't add Google Analytics / Search Console here — that's a separate connect-and-paste job we can do anytime
- Won't pretend to score things Google doesn't actually care about (keyword density, etc.)
- Won't expose the editor to non-management users