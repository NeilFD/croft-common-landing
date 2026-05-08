## SEO + AI search optimisation for Crazy Bear

Lightweight, copy-minimal upgrade. No long marketing paragraphs. Focus on signals that traditional search engines (Google) and AI search (ChatGPT, Perplexity, Gemini, Google AI Overviews) actually consume: structured metadata + FAQ schema.

### Scope

- Town and Country property pages (all `/town/*` and `/country/*` routes).
- Two new landing-style files only. No edits to component design, no changes to existing copy on the page.

### What gets added

1. **Per-route SEO meta** (one liner each) — title, description, canonical, OG/Twitter, via `react-helmet-async` already in use.
2. **JSON-LD structured data** on every page:
  - `Hotel` + `LocalBusiness` for `/town` and `/country` roots (NAP, geo, hours, priceRange, sameAs).
  - `Restaurant` for food pages (Black Bear, B&B, Hom Thai, Country Pub).
  - `BarOrPub` for drink pages.
  - `BreadcrumbList` on every nested page.
  - `FAQPage` wherever an FAQ is rendered.
3. **FAQ accordion** on key pages — short, on-brand, 4–6 Q&As each. AI engines lift these almost verbatim.

### Routes that get FAQs (Crazy Bear voice — short, witty, irreverent)

Town:

- `/town` — about, location, parking, dress code, dogs, check-in/out
- `/town/rooms` — what makes a room, accessibility, kids, pets
- `/town/food` — three restaurants overview
- `/town/drink` / `/town/drink/cocktails` — bar hours, walk-ins
- `/town/pool` — guests-only, opening hours

Country:

- `/country` — about, location, parking, dogs, check-in/out
- `/country/rooms` — same pattern
- `/country/pub` — food service times, walk-ins, dogs
- `/country/events` / `/weddings` / `/business` — capacities, exclusive hire
- `/country/parties` — late licence, group size

### File changes (small, contained)

1. **New** `src/components/seo/CBSeo.tsx`
  - Props: `title`, `description`, `path`, `image?`, `type?`.
  - Renders `<Helmet>` (title, meta description, canonical, OG, Twitter) + `<script type="application/ld+json">` for breadcrumbs.
2. **New** `src/components/seo/CBStructuredData.tsx`
  - Exports helpers: `hotelSchema(property)`, `restaurantSchema(...)`, `barSchema(...)`, `faqSchema(faqs)`. Hard-coded Crazy Bear NAP for Town (Beaconsfield) and Country (Stadhampton). No Croft Common references anywhere.
3. **New** `src/components/seo/CBFAQ.tsx`
  - Self-contained accordion (uses existing `@/components/ui/accordion`). Renders questions + injects matching `FAQPage` JSON-LD. No CMS dependency, no `useFAQContent` (that's Croft Common).
  - Styling matches Crazy Bear tokens (`font-cb-sans`, black/white minimal).
4. **New** `src/data/cbFaqs.ts`
  - Static FAQ map keyed by route. ~6 questions per page max. Crazy Bear tone.
5. **Edit** `src/components/property/PropertyPage.tsx`
  - Accept optional `seo?: { description: string }` and `faqKey?: string` props.
  - Render `<CBSeo />` (always) and `<CBFAQ route={...} />` (when `faqKey` present, sits below the body section).
  - Render hotel/restaurant/bar JSON-LD based on route prefix.
6. **Edit** `src/pages/property/index.tsx`
  - Add a one-line `seo.description` per route and `faqKey` for routes that get FAQs (list above). All copy in Crazy Bear voice, no Croft Common phrasing.
7. **Edit** `index.html`
  - Verify `<meta name="description">` is generic Crazy Bear, not Croft Common. Update if needed.
  - Add `<link rel="canonical">` placeholder (handled per-page by Helmet anyway).

### What is explicitly NOT in scope

- No changes to Croft Common SEO files (`src/components/SEO/*`, `useFAQContent`, CMS FAQ manager).
- No long-form copy added to pages. FAQs are the only new visible text.
- No sitemap regeneration logic (existing `public/sitemap.xml` left alone for now — flag if you want it refreshed in a follow-up).
- No image alt-text audit (separate task).

### AI search specifics

Why this works for ChatGPT / Perplexity / Google AI Overviews:

- `FAQPage` schema is the single most-quoted source by LLM search.
- `Hotel` / `Restaurant` schema feeds the entity graph (location, hours, price).
- Concise meta descriptions (≤155 chars) get used verbatim as snippets.
- Canonical URLs prevent duplicate-page dilution between `crazybeartest.com` and the lovable preview.

### Confirm before implementing

- OK with **static FAQs in code** (fast, simple, no admin UI) vs CMS-managed? Static is recommended — fewer moving parts, easier to keep tone consistent.  
  
STATIC IS FINE  

- Production domain to use in canonical / schema URLs: `https://www.crazybeartest.com` — confirm or give the live domain.  
  
i DONT UNDERSTAND DO WHAT IS MOST LIKE TEH REAL THING