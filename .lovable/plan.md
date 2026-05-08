## SEO maximisation pass

The on-page SEO + FAQ schema work is in. These are the gaps still hurting visibility on Google and AI search (ChatGPT, Perplexity, Gemini, AI Overviews).

### 1. Sitemap + robots (wrong site)

Currently `public/sitemap.xml` lists Croft Common URLs and `robots.txt` points to the Croft sitemap. Crazy Bear has zero sitemap coverage.

- Rewrite `public/sitemap.xml` with every Crazy Bear route under `https://www.crazybeartest.com` (Town + Country home, food/restaurants, drink, rooms, gallery, pool, parties, events, weddings, business, country pub).
- Update `public/robots.txt` to reference the Crazy Bear sitemap and keep AI bots (GPTBot, ChatGPT-User, PerplexityBot, Google-Extended, ClaudeBot, CCBot) explicitly allowed.

### 2. Richer entity schema

Right now `Hotel` / `Restaurant` schema is missing fields that Google and LLMs use to build the entity card.

Add to `src/components/seo/CBStructuredData.ts`:

- `telephone`, `email`, `geo` (lat/lng) for both Town and Country.
- `openingHoursSpecification` per property (rooms 24/7, restaurant + bar hours).
- `sameAs` pointing to Crazy Bear Instagram / Facebook (need URLs, see questions).
- A reusable `organizationSchema` for the brand parent ("Crazy Bear"), injected once on the home routes.
- `hasMap` linking to Google Maps for each property.
- For `Hotel`, add `starRating` if applicable and `checkinTime` / `checkoutTime`.

### 3. Default head metadata (`index.html`)

- Replace the OG/Twitter image (currently `/brand/logo.png`, a small square) with a proper 1200x630 hero. Use one of the existing carousel shots or a new branded card.
- Add `<meta name="theme-color">`, `<meta name="robots" content="index,follow,max-image-preview:large">`, and `<link rel="alternate" hreflang="en-GB">`.
- Tighten the default title to lead with the brand keyword: `Crazy Bear | Boutique Hotels in Beaconsfield & Stadhampton`.

### 4. Per-page polish

- Audit `seoDescription` strings in `src/pages/property/index.tsx` so each is 140-158 chars and front-loads location + offer (currently several are <90 chars and miss the place name).
- Make sure every `PropertyPage` `title` produces a unique `<title>` under 60 chars (a couple like "Drink", "Rooms", "Gallery" are too generic — prefix with property: "Drink at Crazy Bear Town").
- Add `ImageObject` JSON-LD on the gallery pages (uses captions already in `galleryData.ts`) so AI search can attribute images.

### 5. Performance signals (Core Web Vitals)

- Add `loading="lazy"` and explicit `width`/`height` to gallery images in `CBGallery.tsx`.
- Add `fetchpriority="high"` to the first hero carousel image.
- Preload the brand font CSS already done; also `preconnect` to the Supabase asset host if hero images come from there.

### 6. Internal linking + breadcrumbs UI

Schema breadcrumbs exist, but there's no visible breadcrumb on the page. Adding a small breadcrumb strip (Town › Rooms › Gallery) on nested pages reinforces the schema and helps both Google and users.

### Out of scope for this pass

- New copy beyond meta descriptions and titles.
- Image regeneration (we'll reuse existing assets for OG).
- Backlink / off-page work.

### Open questions

1. Live domain for canonical + sitemap: stick with `https://www.crazybeartest.com`, or is there a final domain to swap in now?
2. Social profiles for `sameAs` (Instagram / Facebook / TikTok handles for Crazy Bear)?
3. Phone numbers for Town and Country reception (for `telephone` in schema)?
4. OK to add a visible breadcrumb strip on nested property pages, or keep purely schema-only?
