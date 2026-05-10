## Town Culture & Country Culture pages

Two new long-read, image-rich, playlist-driven culture pages, fully CMS-editable, sitting under each property and linked from the top nav.

### Routes & nav

- `/town/culture` → new `TownCulture.tsx` (inside `PropertyLayout property="town"`)
- `/country/culture` → new `CountryCulture.tsx` (inside `PropertyLayout property="country"`)
- `CBTopNav`: when on a `/town/*` route show a `Culture` link to `/town/culture`; when on `/country/*` show one to `/country/culture`. (Also added to the mobile sheet and to `CBFooter` site columns.)

### Page anatomy (shared structure, distinct content per site)

```text
[ Hero manifesto                        ]  full-bleed image, big Archivo Black headline, one-line tagline
[ Origin / soul of the place           ]  long-form intro (CMSText)
[ Image collage                         ]  3 to 6 hero images (CMS list, drag-reorder)
[ Britpop / soundtrack playlist        ]  Spotify embed (playlist URL editable via CMSText)
[ Culture timeline / vignettes          ]  CMS list: year + heading + body + optional image
[ House Rules — set the tone           ]  pulls live rules from existing house_rules source, styled bold
[ Pull-quote wall                       ]  CMS list of quotes + attribution
[ Closing CTA                          ]  Book a room / Eat with us / Join the Den
```

Same skeleton, but copy, palette accents, photography and playlist differ:

- **Town (Beaconsfield)** — koi cisterns, Hom Thai launch, burlesque nights, townhouse rooms, pool. Playlist: late-90s/early-00s Britpop + lounge.
- **Country (Stadhampton)** — turf-floor pub, treehouse suites, cow-in-dining-room, weddings, the gardens. Playlist: Britpop + folk-rock + Sunday-session.

### CMS

- Reuse existing `CMSText` for the manifesto headline, tagline, intro, playlist URL, closing copy.
- Reuse `useCMSList` (built for About) under namespaces:
  - `town-culture` sections: `collage`, `timeline`, `quotes`
  - `country-culture` sections: `collage`, `timeline`, `quotes`
- Pink-dot inline editing throughout, draft toggle, drag-reorder, add/remove — same UX as About.
- Hero image and collage images use existing `cms-assets` bucket via the existing image CMS picker.
- House Rules section reads the same live source as `/house-rules` (no duplication, no new table). Editing rules still happens in the existing house-rules CMS.

### Spotify integration

- Single editable field: the Spotify playlist share URL.
- Page converts it to `https://open.spotify.com/embed/playlist/{id}` and renders an `<iframe>` (lazy-loaded).
- Default seeds:
  - Town: a Britpop/lounge playlist URL placeholder
  - Country: a Britpop/folk Sunday playlist URL placeholder
- Respects existing global Spotify sticky widget (no conflict — embed is inline only).

### Design

- Inherits site B&W high-contrast system (Space Grotesk body, Archivo Black headings).
- More editorial than About: full-bleed images, asymmetric collage grid, larger pull quotes, generous whitespace.
- No AI-generated imagery, no lucide icons, no em dashes, £ only, anglicised spellings — per workspace rules.
- All colours via semantic tokens; no hard-coded hex.

### SEO

- Single H1 per page (the manifesto headline).
- Unique `<title>` and meta description per page (Town vs Country).
- Semantic `<section>`/`<article>` per timeline entry, alt text on every image.
- JSON-LD via existing `CBStructuredData`.

### Files

**New**
- `src/pages/town/Culture.tsx`
- `src/pages/country/Culture.tsx`
- `src/components/crazybear/culture/CultureHero.tsx`
- `src/components/crazybear/culture/CultureCollage.tsx`
- `src/components/crazybear/culture/CultureTimeline.tsx`
- `src/components/crazybear/culture/CultureQuoteWall.tsx`
- `src/components/crazybear/culture/SpotifyPlaylistEmbed.tsx`
- `src/components/crazybear/culture/HouseRulesInline.tsx` (renders shared House Rules data inline)

**Edited**
- `src/App.tsx` — add the two nested routes
- `src/components/crazybear/CBTopNav.tsx` — context-aware Culture link (Town vs Country)
- `src/components/crazybear/CBFooter.tsx` — Culture link in Town and Country columns

### Out of scope

- No new database tables (re-uses `cms_list_items`, `cms_text`, existing house-rules source).
- No real Spotify API auth — public embed only.
- No new admin UI surface; everything edits inline via pink-dot CMS.
