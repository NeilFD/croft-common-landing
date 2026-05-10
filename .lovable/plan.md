# Why the audit looks so bad (read this first)

The tool you used is a **non-JavaScript crawler**. It downloads the raw `index.html` file and grades only what it sees there. It does **not** run React.

Everything we have built (per-route titles, descriptions, canonical tags, JSON-LD schema, breadcrumbs) lives inside React components (`CBSeo`) and is injected **after** the page loads. So:

- The audit tool sees: the bare `index.html` with one generic title, one generic description, no canonical, no schema.
- **Google sees the full thing.** Googlebot has run JavaScript since 2019 and renders pages exactly like a real browser. Bing does too.
- LLM crawlers (GPTBot, ClaudeBot, PerplexityBot) are a mixed bag. Some render JS, some do not.

So two things are simultaneously true:

1. Our SEO work **is** working for Google.
2. The audit tool **is** correctly telling us we are leaving easy wins on the table for non-JS crawlers, social previews, and LLMs, because the static HTML is thin.

The fix is to put the per-route SEO into the static HTML at build time, not just at runtime.

---

# The plan

## Phase 1 — Make our SEO visible to non-JS crawlers (the real fix)

This is the single highest-impact change. Right now `index.html` is one file with one generic title shipped to every route. We will pre-render a static HTML file per route at build time, each with its own title, description, canonical, OG tags, and JSON-LD baked in.

Approach: add a small post-build step that uses our existing route list (we already have it in `seo_pages` and `sitemap.xml`) plus the same `CBSeo` data, and writes:

```text
dist/index.html              ← home
dist/town/index.html         ← /town
dist/town/food/index.html    ← /town/food
dist/country/index.html      ← /country
... etc for every public route
```

Each file contains the correct `<title>`, `<meta description>`, `<link rel="canonical">`, OG/Twitter tags, and JSON-LD already in the HTML before React mounts. React then hydrates on top with no visible change to the user.

Result after Phase 1:

- Canonical, schema, per-route titles/descriptions all visible to **every** crawler, free tools, social scrapers, LLMs.
- Audit tool grades flip from F/D to A on On-Page SEO and GEO.
- Zero change to user experience.

## Phase 2 — Fix the specific On-Page SEO flags

These are quick wins, all CMS-driven so the team can keep tuning them:

1. **Title length** — current home title is 31 chars. Target 50 to 60. Update default in CMS to: "Crazy Bear | Boutique Hotels in Beaconsfield and Stadhampton" (60).
2. **Meta description length** — current is 85 chars. Target 120 to 160. Rewrite to ~150 chars in the brand voice.
3. **Header structure** — landing pages have one H1 and no H2/H3. Add a short H2 per section on `/`, `/town`, `/country` so crawlers see topical structure.
4. **Thin content on home** — 77 words. Add a short, brand-voice intro block (150 to 250 words) above the fold of `/` so the homepage has real text content. Manageable through the existing CMS.
5. **Local Business schema** — extend our existing JSON-LD with two `LocalBusiness` entries (Town and Country), each with full address, phone, geo, opening hours. Add `Organization` schema with `sameAs` linking to social profiles (once they exist, see Phase 4).

## Phase 3 — Performance (mobile 45, desktop 81)

Mobile score is the worst grade in the report. Three concrete actions:

1. **Images = 6.26 MB of the 7.32 MB page weight.** This is the headline issue. Audit hero images on `/`, `/town`, `/country`. Convert to WebP/AVIF, ship responsive `srcset` sized to viewport, and lazy-load anything below the fold. Realistic target: cut image weight by 70% to under 2 MB total.
2. **Reduce unused JavaScript (640 ms saving).** Code-split the heavy admin/management bundle out of the public site so visitors do not download CMS code.
3. **Avoid multiple page redirects (630 ms saving).** Audit the redirect chain: apex → www, http → https, any trailing-slash logic. Collapse to a single redirect at the edge.

Target: mobile 45 → 80+, desktop 81 → 95+.

## Phase 4 — Brand presence (Social, GEO, Local)

Cheap visibility wins that the audit tool flags as Low Priority but matter for trust signals:

1. Create or claim **Facebook, Instagram, X, LinkedIn, YouTube** profiles. Link them in the footer with `rel="me"` and add to `sameAs` in the Organization JSON-LD.
2. Create or claim **Google Business Profile** for both Town (Beaconsfield) and Country (Stadhampton). This is the single biggest local SEO lever.
3. Add `**/llms.txt**` at the site root, summarising who Crazy Bear is, the two properties, and key URLs in plain markdown. Cheap, takes 30 minutes, helps LLMs cite us correctly.
4. Add **SPF record** for the sending domain.  
  
DO NOT DO POINTS 1 AND 2 IN Phase 4

## Phase 5 — Analytics

The tool says it cannot detect an analytics tool because, again, JS has not run. But we should still pick one and add it as a lightweight tag in `index.html`:

- Recommended: **Plausible** or **Umami** (privacy-friendly, no cookie banner needed) or **GA4** if you want the Google ecosystem.
- Tag fires on every route via SPA pageview events.

## Phase 6 — Backlinks (the F grade)

This is the most misunderstood part of the report. The "55 backlinks" listed are almost all **spam directories** (`bitcoinmix.biz`, `quero.party`, `urls-shortener.eu`, etc). They are not real backlinks. Google ignores or penalises these. Your real authority from real domains is close to zero, which is normal for a brand-new domain.

Backlinks are **earned, not built in code**. There is no code change that fixes this. The plan is editorial and PR work, run as an ongoing programme:

1. **Foundational citations (week 1, 1 to 2 days work).**
  List the two hotels on: TripAdvisor, Booking.com (you may already be there), Hotels.com, Mr & Mrs Smith, Sawday's, Visit Buckinghamshire, Visit Oxfordshire, Conde Nast Traveller hotel directory, The Times' best hotels, Yelp UK, OpenTable for the restaurants. Each is a high-authority dofollow link.
2. **Press and editorial (ongoing).**
  The Crazy Bear has historic press (Sunday Times, Tatler, etc). Reach out to journalists who covered it pre-rebrand and ask them to update old links to point at `crazybear.dev`. Pitch new angles: refurbishment, Bear's Den Gold, the chef, the gardens.
3. **Local partnerships.**
  Wedding directories (Hitched, Bridebook), corporate-event directories, local business chambers (Beaconsfield, Thame, Oxford), nearby attractions cross-linking ("Where to stay near Waddesdon Manor").
4. **Disavow file (optional).**
  Once the spam directory list is large enough to worry about, submit a disavow file in Google Search Console so those low-quality links cannot harm us.
5. **Measurement.**
  Track referring-domain growth monthly in Ahrefs or the free Google Search Console "Links" report (Search Console is free and accurate; the audit tool's data is third-party and stale).

Realistic timeline: 6 to 12 months of consistent work to move from grade F to grade C. Backlinks are the slowest SEO lever there is.

---

# Technical details (for the engineers)

- **Pre-rendering**: use `vite-plugin-prerender` or a lightweight custom script that imports the route list, runs each through `react-dom/server` with the Helmet provider, and writes the resulting HTML into the build output. Keep the SPA fallback so deep links still work.
- **Route source of truth**: read from the `seo_pages` Supabase table at build time so the CMS remains the single source of truth for titles, descriptions, and JSON-LD overrides.
- **JSON-LD**: emit at least `Organization`, `WebSite` (with `SearchAction`), and per-property `LocalBusiness`/`Hotel` graphs. Keep using `CBSeo` at runtime as a fallback for any route the build step missed.
- **Images**: add a build-time image-optimisation step (Vite plugin or `sharp` in CI) to emit WebP + AVIF + responsive sizes.
- **Analytics**: install as a static `<script>` in `index.html` so non-JS audit tools still detect it via the script tag, and route changes fire pageviews from the React router.
- **CMS coverage**: every new route added must register in the route list so the pre-render step picks it up. Bake this into the page-creation flow.

---

# What I am asking you to confirm

Before I implement, two decisions:

1. **Pre-rendering**: green light to add a build-time pre-render step? This is the keystone change that makes everything else show up in audits.
2. **Analytics**: which tool? Plausible (paid, privacy-first, recommended), Umami (free, self-hosted), or GA4 (free, Google)?

Phases 4 and 6 are mostly outside the codebase; happy to draft outreach copy and a citations checklist if helpful.