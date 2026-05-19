
# Fix prerender so each route ships correct static HTML

## The problem

Lovable hosting serves a single `index.html` for every URL (SPA fallback). React Helmet only rewrites `<head>` after JS runs. Right now:

- Googlebot's first fetch of `/town`, `/country`, `/journal/x` all return the same `<title>` and the same body shell (currently the "Start-up error" placeholder from the early-error catcher script).
- Google can execute JS, but on a brand-new domain with zero trust it indexes the static HTML first, sees identical content across 50 URLs, and demotes everything as duplicate.
- Social previewers (LinkedIn, Slack, WhatsApp) don't run JS at all — they only ever see the static head.

We don't need full SSR. We're not a Node app, and Lovable hosting is static. We need **build-time prerender**: one real `.html` file per route, with the correct head and a minimal H1 baked in. Lovable's hosting serves real files before falling back to the SPA, so crawlers see clean, unique HTML on byte one.

## Approach: static prerender at build time

Two options, ranked.

**Option A (recommended): head-and-shell prerender via a postbuild script.**
Fast (under 5s for all ~50 routes), no headless browser, no flakiness. For each route the script writes `dist/<route>/index.html` — a copy of `dist/index.html` with:
- `<title>` replaced
- `<meta name="description">` replaced
- `<link rel="canonical">` injected
- `og:title`, `og:description`, `og:url`, `og:image` replaced
- `twitter:*` replaced
- per-route JSON-LD injected
- a real `<h1>` written into `<div id="root">` (positioned offscreen so it's invisible to users but parsed by crawlers and screen readers)

When React hydrates it replaces `#root` and Helmet keeps the head in sync. No visible flash.

**Option B: full prerender via headless Chromium (`react-snap`, `vite-plugin-prerender-spa`).**
Renders each route in real Chromium and dumps the DOM. Higher fidelity but adds 60-120s to every build, flakes in CI, and needs CMS-driven hero images reachable from the build worker.

I recommend **A**. Google's actual ranking-recovery requirements are: unique title, description, canonical, H1, og:*, JSON-LD in the static HTML. Option A delivers all of that, fast, with no new runtime dependency.

## What gets built

### 1. Source of truth (already exists)
- `CMS_PAGES` registry — every public route + default title/description
- `seo_pages` table — per-route editorial overrides
- `syncSeoPagesFromRegistry()` — keeps them in sync

The prerender script reads both: registry for the route list, `seo_pages` for live edits (a title change ships without a code change).

### 2. New: `scripts/prerender.ts`
Runs after `vite build`. For each route:
1. Compute final title, description, canonical, og:*, JSON-LD via a shared helper.
2. Read `dist/index.html` once.
3. Replace head tags; append JSON-LD `<script>` blocks.
4. Inject body shell:
   ```html
   <div id="root">
     <h1 style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden">{H1}</h1>
   </div>
   ```
5. Write `dist/<route>/index.html` (e.g. `dist/town/index.html`).

For dynamic routes (`/journal/:slug`, `/whats-on/:slug`, `/stories/:slug`), it fetches published slugs from the backend the same way the sitemap generator does, one file per slug.

### 3. New: `src/lib/seo/buildHead.ts`
Pure function that returns the final head tags + H1 for a given route. Used by both CBSeo (runtime) and the prerender script (build time) so output is byte-identical and there's no drift between what crawlers see and what hydrated React renders.

### 4. Per-route H1
Add an `h1 text` column to `seo_pages` (defaults to `title` if null). CBStaticPage already renders `title` as the H1, so 90% of routes need no change. Editors can override per route in the SEO CMS.

### 5. Wire it in
- Add `"postbuild": "bunx tsx scripts/prerender.ts"` to `package.json`. Runs automatically after every Lovable build.
- Keep `react-helmet-async` as is. It still owns runtime updates when users click between SPA routes. The static HTML is just the first byte Google sees.
- Keep root `index.html` as the SPA fallback for any route the registry misses.

## Why this works on Lovable hosting

Lovable serves `dist/<path>/index.html` if it exists, before falling back to the SPA shell. Writing real files per route means Googlebot's first request for `/town` returns the prerendered HTML with the right title and H1, not the generic SPA shell. Confirmed by Lovable's SPA-routing behaviour.

## Routes excluded from prerender
Admin (`/admin/*`, `/management/*`, `/cms/*`), auth callbacks (`/set-password`, `/click`), and anything marked `noindex: true`. They fall through to the SPA shell as today.

## Verification before launch
After build, a script curls all ~50 URLs with `User-Agent: Googlebot` and asserts each one returns its expected title and H1. Plus spot-check with Google Search Console URL Inspection on the top 3 (`/`, `/town`, `/country`).

## Files to add / change (build mode)
1. `scripts/prerender.ts` (new)
2. `src/lib/seo/buildHead.ts` (new shared helper)
3. `src/components/seo/CBSeo.tsx` (refactor to use shared helper, no behaviour change)
4. `package.json` (add `postbuild`)
5. Migration: add `h1 text` column to `seo_pages`
6. `src/pages/management/seo/SeoPageEditor.tsx` (CMS field for H1)
7. `scripts/verify-prerender.ts` (new, runs the curl check)

## Out of scope
- Full Node SSR (not needed, would force a hosting change)
- React Server Components / streaming SSR (same reason)
- Headless Chromium prerender (kept as fallback if Option A ever falls short)

## Order on launch day
1. Ship prerender, verify locally
2. Publish to crazybear.dev
3. Run verify script + Search Console URL Inspection
4. **Then** swap DNS from crazybear.co.uk with 301s in place

Prerender must be live and verified before the DNS swap, not after.
