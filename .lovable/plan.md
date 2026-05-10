## What "Performance" actually measures

Your Performance score (the 34 you keep seeing) is a Google **Lighthouse mobile** score from PageSpeed Insights. It's a weighted blend of these lab metrics, simulated on a slow 4G phone (Moto G Power class):

| Metric | Weight | What it means | Your number |
|---|---|---|---|
| **LCP** Largest Contentful Paint | 25% | Time until the biggest visible thing (usually the hero image) finishes drawing | **17.9s** ❌ should be < 2.5s |
| **TBT** Total Blocking Time | 30% | Total time the main thread was frozen by JavaScript | not shown, almost certainly bad |
| **CLS** Cumulative Layout Shift | 25% | How much stuff jumps around as the page loads | 0.00 ✅ |
| **FCP** First Contentful Paint | 10% | First pixel of content drawn | likely 3-5s |
| **SI** Speed Index | 10% | How quickly the visible page fills in | likely 8s+ |

Translation: you're failing **only because of LCP and probably TBT**. CLS is fine. Fix the two and the score will move from 34 to 80+ on most pages.

---

## Why it is 34 — the real bottlenecks I found

I crawled the repo. The cause is not subtle.

### 1. Hero images are catastrophically large

The biggest LCP element on every landing page is a hero image. A sample of what's being shipped:

- `cb-hero-blackbear.jpg` — **2.4 MB**
- `cb-hero-pool.png` — **2.4 MB** (PNG of a photo, should be JPG/WebP)
- `cb-hero-events.jpg` — **1.2 MB**
- `cb-hero-parties.jpg` — **1.1 MB**
- `cb-country-culture-look-1-routemaster.jpg` — **2.6 MB**
- Carousel slides: `town-01.jpg` 2.7 MB, `town-06.jpg` 2.4 MB, `country-06.jpg` 2.7 MB, etc.
- `public/lovable-uploads/*.png` — **dozens of files between 1.7 MB and 3.1 MB**, all PNG photos

A mobile hero image should be ~80-150 KB in modern AVIF/WebP. You are shipping 20-30× that. On simulated 4G that is literally 15+ seconds of download before the LCP element can paint.

### 2. No modern formats, no responsive sizes

- Every hero is a single JPG/PNG. No `<picture>` with AVIF/WebP. No `srcset` so a phone downloads the same 2400×1600 image a desktop gets.
- Vite has no image optimization plugin configured.

### 3. Hero images are not preloaded

`index.html` only preloads `/brand/logo.png`. The actual hero — the LCP element — is discovered by the browser only after React mounts and renders, which is the worst possible timing.

### 4. Carousels eagerly load every slide

The triptych hero carousels on `/town` and `/country` mount all slides at once. Three 2.5 MB images = 7.5 MB before LCP can settle.

### 5. Google Fonts block rendering

`<link rel="stylesheet">` for Archivo Black + Space Grotesk (5 weights) blocks the first paint. Preconnect is there but the stylesheet itself is render-blocking.

### 6. JavaScript bundle is monolithic

Vite config has zero `manualChunks`. The whole app — admin, management, CMS, Capacitor, Stripe, AI, charts — is downloaded for a visitor who just wants the home page. That's where TBT comes from.

### 7. PageSpeed measures the rendered React shell

Because the SPA waits for JS to mount before painting the hero, every metric (FCP, LCP, TTI) is delayed by however long it takes to parse and run the bundle. Code-splitting the marketing pages from the management bundle is the single biggest TBT win.

---

## Action plan to move from 34 → 80+

I'll order this by **dial-moved per hour-of-work**. We don't need all of it for the score to jump.

### Phase 1 — One afternoon, worth ~30-40 score points

**A. Convert hero + carousel images to optimised WebP + responsive `srcset`**
- Build script that takes every image in `src/assets/` and `public/lovable-uploads/` over 200 KB and outputs `image.avif`, `image.webp`, `image.jpg` at 480w / 960w / 1600w (sharp via `bun add -d sharp`).
- Replace direct `<img src>` with a `<ResponsiveImage>` component that emits `<picture>` with AVIF + WebP sources, `srcset`, `sizes`, `loading="eager"` only for the hero, `loading="lazy"` for the rest, plus `decoding="async"` and explicit `width`/`height` to keep CLS at 0.
- Drop `cb-hero-pool.png` (2.4 MB PNG of a photo) → JPG/WebP.
- Target: every hero ≤ 150 KB on mobile.

**B. Preload the actual LCP image per route**
- Each landing page (`/`, `/town`, `/country`, `/town/food`, `/country/pub`, etc.) gets a `<link rel="preload" as="image" imagesrcset="..." imagesizes="100vw" fetchpriority="high">` injected via Helmet so the browser starts the hero download in parallel with the JS bundle, not after it.

**C. Carousel: only load the active slide**
- The two triptych carousels (`/town`, `/country`) currently mount all three images. Lazy-mount slides 2 and 3 after first interaction or after 2s idle.

These three steps alone should take LCP from 17.9s to under 3s on most pages.

### Phase 2 — Same day, worth ~10-15 more points

**D. Self-host the two fonts**
- Download Archivo Black + the four Space Grotesk weights actually used (300/400/500/700) as WOFF2 to `public/fonts/`. Replace the Google Fonts `<link>` with `@font-face` in `index.css` and a single `<link rel="preload" as="font" type="font/woff2" crossorigin>` for the two LCP-critical weights.
- Removes a render-blocking request and a third-party DNS hop.

**E. Code-split management + admin out of the marketing bundle**
- Add `manualChunks` to `vite.config.ts`:
  - `vendor-react` (react, react-dom, react-router-dom)
  - `vendor-supabase`
  - `vendor-charts` (recharts, etc.)
  - `vendor-ui` (radix, framer-motion)
- Convert `/management/*`, `/cms/*`, `/admin/*` and `/research`, `/checkin`, `/proposal-redirect` etc. routes to `React.lazy()` + `Suspense`. None of these need to ship for `crazybear.dev/`.
- Lazy-load Capacitor and Stripe on demand (they're already in `optimizeDeps.exclude` so it's a small change in their importers).

This is the single biggest **TBT** win and will also drop "unused JavaScript" Lighthouse warnings.

### Phase 3 — Polish, worth the last ~5-10 points

**F. Fix `index.html` hygiene**
- Canonical and hreflang in `index.html` still point at `crazybeartest.com` — should be `crazybear.dev`. Real SEO bug, not just a perf one.
- `<title>` and OG image are static — fine as a fallback, but make sure CBSeo overrides in head are reachable (already true via Helmet).
- Add `<link rel="dns-prefetch">` for `szokkwlleqndyiojhsll.supabase.co` so the first auth/`seo_pages` fetch starts faster.

**G. Service worker is currently caching everything aggressively**
- Verify `public/sw.js` doesn't serve stale 2MB images from cache for repeat scoring runs (Lighthouse runs in incognito so it shouldn't, but worth checking it isn't intercepting the preload).

**H. Add a perf budget check to the SEO dashboard**
- New tile per page: "Hero image weight" (HEAD request to the OG image / preloaded LCP) showing KB and a pass/warn/fail (≤200/≤500/>500).
- New check row: "Bundle size for this route" (parse `dist/assets/*.js` after build, sum what the route loads). Optional, can defer.

---

## How we'll prove it worked

After Phase 1+2 ship to `crazybear.dev`:
1. Hit "Re-test entire site" in the SEO dashboard.
2. Performance scores on landing pages should go from 34 → 75-90.
3. LCP on /, /town, /country should drop under 2.5s.
4. The dashboard's "Image alt text", "Tap targets", "Heading order" checks (already added) will surface any straggler accessibility issues that affect the SEO category too.

---

## Technical detail (for the record)

- Image pipeline: `bun add -d sharp glob` then `scripts/optimise-images.ts` traverses `src/assets` + `public/lovable-uploads`, writes sibling `.webp`/`.avif` + `-480w/-960w/-1600w` variants, idempotent (skip if newer than source). Run in CI and committed to repo to keep build deterministic.
- New `src/components/ui/ResponsiveImage.tsx`: takes `src` (the original), reads a manifest produced by the script, emits `<picture>` with AVIF/WebP/original sources and correct `srcset`/`sizes`. Default `loading="lazy"`, `priority` prop forces eager + fetchpriority high.
- Per-route hero preload: extend `CBSeo` to accept a `lcpImage` prop and emit the `<link rel="preload">` with `imagesrcset`. Each landing page passes its hero.
- Code-split: wrap `/management`, `/cms`, `/admin`, `/research`, `/proposal-redirect`, `/notifications`, `/checkin` in `lazy()` inside `App.tsx`. Add a minimal `<Suspense fallback={null}>`.
- Fonts: WOFF2 in `public/fonts/`, `@font-face` with `font-display: swap` in `index.css`, drop the Google Fonts stylesheet link.
- `vite.config.ts`: add `build.rollupOptions.output.manualChunks` for the four vendor groups above.
- `index.html`: replace `crazybeartest.com` strings with `crazybear.dev`.

Nothing in this plan touches the database, edge functions, or auth. Existing CMS edits keep working the same way.
