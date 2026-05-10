
# About page — "Born in 1993, yet to grow up."

A new long-form storytelling page for the Crazy Bear, reachable from the top nav on every page. Built in the existing high-contrast B&W editorial style, every block editable through the pink-dot CMS so copy can keep evolving as more stories surface.

## Where it lives

- New route: `/about`, rendered by a new `src/pages/crazybear/About.tsx`
- Wired into `src/App.tsx` alongside the other top-level Crazy Bear routes (`/house-rules`, `/bears-den`)
- Top nav: add an `About` link to `CBTopNav` between `House Rules` and `Town`, in the same `font-cb-mono` style. Same link added to `CBFooter` under "Discover" so it's reachable from every page footer too.

## Page structure

1. **Hero manifesto**
   - Full-bleed black hero, single archive photograph (Stadhampton exterior or a vintage interior shot — placeholder image to start, swappable via CMS asset slot)
   - Eyebrow: `Est. 1993 / Stadhampton + Beaconsfield`
   - Headline (Archivo Black, oversized): `Born in 1993. Yet to grow up.`
   - Sub: a short two-line manifesto (e.g. "Two hotels. One spirit. A thirty-year run of bad behaviour, good food and the occasional fish in the cistern.")
   - Slow scroll cue at the bottom

2. **Origin paragraph (long-read intro)**
   - Narrow column, Space Grotesk, generous leading
   - 150–220 word narrative opener — how Jeremy Mogford bought a wonky country pub in Stadhampton in '93, why the bears, why the chaos. Editable as one CMS rich-text block.

3. **Timeline: "A short history of bad ideas that worked"**
   - Vertical timeline, year markers down the left, story cards on the right
   - Each card = year + headline + 2–4 sentence anecdote + optional caption/source line
   - Seeded entries (each a separate editable CMS block so you can rewrite, reorder, add, remove):
     - **1993 — A pub, a punt, a turf floor.** The Stadhampton local reopens with real grass laid across the bar floor. Sheep optional.
     - **Late 90s — The cow in the dining room.** Taxidermy, mirrors, chandeliers in places chandeliers don't belong.
     - **2002 — Town arrives.** The Beaconsfield coaching inn is taken on and rebuilt as a townhouse hotel, all glass loos and silver-leaf walls.
     - **The cisterns.** Live koi swimming behind the gents' urinals. Still there. Still a talking point.
     - **The Thai room.** Hom Thai opens upstairs in Town — gold leaf, lanterns, proper heat.
     - **The burlesque years.** Saturday nights you don't put in the brochure.
     - **The treehouse suites.** Bedrooms in the trees at Country. Roll-top baths above the canopy.
     - **Today.** Two hotels. Same spirit. Slightly better behaved. Only slightly.
   - Each block has a small `Source` line for press cuttings/links, also CMS-editable.

4. **Quote wall**
   - Three to five short pull quotes from press over the years (Times, Telegraph, Guardian, Tatler — sources to be confirmed during build via web search and pasted in as editable CMS text)
   - Big serif treatment, one per row on mobile, three-up on desktop
   - Each quote = headline text + attribution line, both editable

5. **Closing CTA**
   - Two big edge-to-edge buttons mirroring the Landing chooser: `Town` and `Country`
   - Footer (CBFooter) follows

## CMS / editability

- Reuse the existing `CMSText` pattern (as on `PropertyPage`) under namespace `about`, sections `hero`, `intro`, `timeline`, `quotes`, `cta`
- Hero image uses `useCMSAssets("about", "hero")` so it's swappable from the pink-dot editor
- Timeline + quotes use the same FAQ-style add/remove pattern just shipped (`useCMSFaqs`) — generalised to `useCMSList` (or a new `useCMSTimeline` / `useCMSQuotes` hook with the same pink-dot add/remove/reorder UX). One row per anecdote, fields: year, headline, body, source.
- All edits live in the existing CMS tables — no new schema needed beyond a small list/sequence table if we don't already have a generic one (will check `useCMSFaqs` table during build and reuse if shape fits; otherwise add `cms_list_items` keyed by `(page, section)` with `position`, `heading`, `body`, `meta jsonb`).

## Story sourcing during build

- Use `websearch--web_search` (and `firecrawl` if needed) to pull real cuttings about: turf floor at Stadhampton, koi in the Beaconsfield cisterns, treehouse suites, Hom Thai opening, burlesque/late-night era, Jeremy Mogford profiles
- Paste verified quotes + source URLs straight into the CMS seed values so the page ships with real material; you then refine via pink-dot

## SEO

- `<title>About | The Crazy Bear`
- Meta description ≤158 chars, e.g. "Born in 1993. Two hotels, one spirit. The story of The Crazy Bear at Stadhampton and Beaconsfield — turf floors, fish cisterns and thirty years of mischief."
- Single H1 ("Born in 1993. Yet to grow up."), semantic `section`/`article` per timeline entry
- JSON-LD: reuse `organizationSchema()` and `breadcrumbSchema('/about')` from `CBStructuredData`

## Visual / typography

- Tokens only: `bg-background`, `text-foreground`, `border-border`
- Headings `font-display` (Archivo Black), body `font-cb-sans` (Space Grotesk), eyebrows `font-cb-mono`
- High-contrast B&W, single accent: thin pink-dot rule under each timeline year marker (`hsl(var(--accent-pink))`) — purely decorative, in keeping with the CMS aesthetic
- No AI-generated imagery; placeholder slot for archive photos until real ones are uploaded

## Files touched

- new: `src/pages/crazybear/About.tsx`
- new (if needed): `src/hooks/useCMSList.ts` + small migration for `cms_list_items` (only if existing FAQ table can't be reused)
- edit: `src/App.tsx` (route)
- edit: `src/components/crazybear/CBTopNav.tsx` (add link)
- edit: `src/components/crazybear/CBFooter.tsx` (add link)

## Out of scope (for this pass)

- Real photography upload (placeholder slots only — you can drop images in via CMS after)
- Press cuttings as actual scanned imagery (text quotes + source links only for now)
