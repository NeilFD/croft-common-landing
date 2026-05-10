## What you'll get

A single black button on `/management/seo` labelled **"✨ AI complete every page"**. One click. The AI writes title, description and keywords for every tracked page, then shows you a review modal listing all changes side-by-side (old vs new) before anything is saved. You confirm once, everything saves, dashboard refreshes. You can still go into any individual page editor afterwards to tweak.

---

## 1. The new global AI tool

**Location:** Top-right of `/management/seo`, next to "Re-test entire site".

**Flow**

1. Click "✨ AI complete every page".
2. Progress bar runs the existing `seo-copywriter` edge function once per page, one at a time, with a small delay so we don't hit Lovable AI rate limits. Live counter: "Writing 7 / 41…".
3. When done, a full-screen review dialog opens. Each page is a row:
  - Route + label
  - Title: old → new (with character count, green/yellow)
  - Description: old → new
  - Keywords: old → new
  - Per-row checkbox (default on) so you can deselect any page you don't want changed
  - "Skip unchanged" toggle to hide rows where AI returned the same copy
4. Two buttons at the bottom: **Cancel** (throws everything away) and **Save selected** (writes to `seo_pages` in one batch via `upsert`).
5. Toast confirms how many pages updated. Dashboard reloads.

**Per-page editor stays exactly as it is** — same "✨ Suggest with AI" button, same Save flow, so you can still edit individually anytime.

---

## 2. Are changes actually going live? (Straight answer)

**Yes, with two caveats I want to fix in this same plan.**

How it works today:

- `seo_pages` rows are read by `<CBSeo>` on every page load and injected into `<head>` via `react-helmet-async`. Title, description, canonical, OG image, JSON-LD, noindex — all real meta tags.
- Googlebot renders JavaScript, so it sees these tags. This is the standard approach for Vite/React SPAs and it works.
- No publish/deploy step needed. Edit in CMS → save → next page load shows new tags. Google picks them up on its next crawl (usually days).

**Caveats found while planning — fixing as part of this work:**

a. `**public/robots.txt` and `public/sitemap.xml` still reference `https://www.crazybeartest.com**` (the old test domain). The live site is `www.crazybear.dev`. Right now we're telling Google the sitemap lives at a domain that's gone. This is a real, live SEO bug. I'll rewrite both files to point at `www.crazybear.dev`.

b. **Not every page wraps itself in `<CBSeo>` yet.** Pages without it fall back to whatever is in `index.html`, which means CMS edits do nothing for those routes. I'll grep the route list against `<CBSeo>` usage and surface a "❌ Not wired to CMS" badge on the dashboard for any page where edits won't take effect, so you can see exactly which ones are wasted effort.

After (a) and (b), every CMS save genuinely changes what Google sees.

---

## 3. Alt tags and other "moves the dial" gaps

You're right, alt text matters — both for SEO and accessibility (which Google scores). Here's the honest gap list. I'll add each as an **internal check** in the existing audit so it shows on the dashboard, not as silent background work.

**Image alt audit** (new check per page)

- Crawl the rendered HTML, count `<img>` tags, count ones missing `alt` or with `alt=""` on non-decorative images. Fail if any are missing.

**Other high-value gaps to add as automated checks**

1. **Canonical URL present and matches current route** — stops duplicate-content penalties.
2. **One single H1 per page** — Google uses it heavily.
3. **Heading hierarchy** (no jumping H1 → H4) — accessibility + SEO.
4. **OG image present and ≥1200×630** — controls how the page looks shared on WhatsApp/iMessage/socials, which drives clicks.
5. **JSON-LD structured data present** (Organization / Hotel / Restaurant / Breadcrumb) — already partly built in `CBStructuredData.ts`; check it's actually emitted.
6. **Internal link count** — orphan pages get crawled less.
7. **Lang attribute on `<html>**` — small but free.
8. **Title and description length sanity** (already there for the editor; add to the dashboard checks too).

Each becomes a row in the existing "Checks" panel with pass / warn / fail, so the AI tool can be told "fix the warnings on this page" in a future iteration.  
  
Please provide fixes for all the above, and tools within SEO monitor tool to ensure we test, score and improve these issues within the /management/seo page

---

## Technical detail (for the record)

- New component `SeoBulkAiReview.tsx` rendered as a `Dialog`. Holds an array of `{ route, current, suggested, fields }`.
- Dashboard adds `runBulkAi` mutation: loops `pages`, calls `supabase.functions.invoke('seo-copywriter', { body: { route, label, fields: ['title','description','keywords'], current } })` with a 1.5s delay between calls and a try/catch per page so one failure doesn't kill the batch. Stores results in component state, opens the review dialog.
- "Save selected" does a single `await supabase.from('seo_pages').upsert(rows, { onConflict: 'route' })`.
- Dashboard query `['seo-pages']` invalidated on save. No DB schema changes required for the AI feature itself.
- New audit checks added to `supabase/functions/seo-audit/index.ts` in the existing `internal_checks` array — no new tables, no new function.
- `public/robots.txt` and `public/sitemap.xml`: search-and-replace `crazybeartest.com` → `crazybear.dev`.
- "Not wired to CMS" badge: a small build-time map of routes that import `CBSeo`, exported from a new `src/data/seoWiredRoutes.ts`, compared against `seo_pages.route` on the dashboard.

No new secrets, no migrations, no breaking changes. Existing per-page editor untouched.