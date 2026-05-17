
# Build plan — site map round one

Based on your answers. Every new route is added to `src/App.tsx`, registered in `src/data/cmsPages.ts`, linked from `src/data/navigation.ts` + `src/data/cbSiteMap.ts`, and added to `public/sitemap.xml` and `public/llms.txt`.

---

## 1. Rooms — category pages (Town + Country)

Four character pages per site, each with image carousel + Book CTA. Linked from the existing Rooms landing and from Room Gallery.

New routes:
- `/town/rooms/snug`, `/town/rooms/cosy`, `/town/rooms/boujee`, `/town/rooms/decadent`
- `/country/rooms/snug`, `/country/rooms/cosy`, `/country/rooms/boujee`, `/country/rooms/decadent`

One shared `RoomCategoryPage` component, driven by `{site, category}` so all eight pages share layout and CMS keys.

---

## 2. Food landing pages with video

- `/town/food` — already exists, retrofit with a hero video slot (CMS asset).
- `/country/food` — **new**. Sits above the pub. Video hero, intro, tiles to: Pub, Restaurant (TBC), Thai (TBC), Terraces & Gardens, Afternoon Tea, Sunday Feasts.

(Existing `/country/pub/*` stays. `/country/food` becomes the parent hub.)

### Dinner / Lunch / Breakfast / Sunday — best practice

You said: no separate Lunch pages; menus shown somewhere. Recommendation:

- Keep one page per **venue** (Black Bear, B&B, Pub, plus the future Country Restaurant / Thai).
- On each venue page, expose **all relevant menus as tabs**: Breakfast · Lunch · Dinner · Sunday. Tabs only render if a menu exists; placeholder copy "Coming soon" otherwise. Menus already drive off `src/data/menus.ts` + CMS, so this is a tab wrapper, not new routes.
- Add a single **`/town/food/menus`** and **`/country/food/menus`** index page listing every menu PDF/HTML in one place for guests who just want the menu.

Net new routes: `/country/food`, `/town/food/menus`, `/country/food/menus`. No `/lunch` or `/breakfast` routes.

---

## 3. Afternoon Tea

- `/town/food/afternoon-tea` — new
- `/country/food/afternoon-tea` — new

Text + opening times + images + menu + Book CTA. Shared `AfternoonTeaPage` component.

---

## 4. Terraces & Gardens (Country only)

- `/country/terraces-and-gardens` — new, one page, four anchored sections:
  - The Fishpond
  - Secret Garden
  - Garden Terrace
  - Woodland

Each section: hero image, short copy, gallery strip, "Book a table" / "Enquire" CTA. In-page nav (sticky chip row) jumps between the four.

---

## 5. Karaoke Room (Town/Beaconsfield)

- `/town/karaoke` — new, own look-and-feel (per the spreadsheet). Branded page, text, imagery, "Book a slot" CTA. Sits under Town events grouping.

---

## 6. What's Happening (single page, both sites)

- `/whats-on` — new. One page, clever split: a top toggle pill ("Town · Country · Both") filters a unified events grid below. Default "Both" with each card tagged by site colour. Cards are CMS-driven (event poster, title, date, site, link).

Add a new `events` table (or extend existing one) — see Technical section.

---

## 7. Playlists (both sites, linked from Culture)

- `/town/playlist` — new
- `/country/playlist` — new

Reuses `SpotifyPlaylistEmbed`. Each Culture page (`/town/culture`, `/country/culture`) gets a "Playlist" link added to its in-page nav.

---

## 8. Stories from the Bear

- `/stories` — new index of wild stories from the past, simple list view.
- `/stories/:slug` — new story detail.

Linked from both Culture pages.

---

## 9. Gift Vouchers

- `/gift-vouchers` — new. Info, denominations, "Buy" CTA (placeholder until commerce wired up).

---

## Routes summary

13 new pages + 8 room-category pages = **21 new routes**.

```text
Rooms        /town/rooms/{snug,cosy,boujee,decadent}
             /country/rooms/{snug,cosy,boujee,decadent}
Food         /country/food
             /town/food/menus
             /country/food/menus
             /town/food/afternoon-tea
             /country/food/afternoon-tea
Country      /country/terraces-and-gardens
Town         /town/karaoke
Site-wide    /whats-on
             /town/playlist
             /country/playlist
             /stories
             /stories/:slug
             /gift-vouchers
```

---

## Out of scope this round (parked from earlier audit)

So you can decide on them next: Country Restaurant + Country Thai (naming TBC), Weddings hub (Town vs unified), Meetings & Celebrations hub, Dogs page, Treatments, Merch, Journal/blog, Social Gallery, Neighbourhood, Cocktail comic, Terms, FAQ hub, Cookies, Press, Contact, Careers, Pub Quiz, Cinema Nights, Outdoor Feasts, Friday Nights.

---

## Technical section (for reference)

- **CMS registration:** every new route added to `src/data/cmsPages.ts` (`CMS_PAGES` array) with parent grouping. Build-time `scripts/check-cms-registry.ts` enforces this; missing entries fail the build.
- **Shared components:** `RoomCategoryPage`, `AfternoonTeaPage`, `MenusIndexPage`, `VenueMenuTabs`. Keeps page files thin and lets the CMS drive content.
- **Events data:** `whats-on` needs a `cb_events` table — fields: title, slug, site (`town`|`country`|`both`), starts_at, ends_at, poster_url, body, external_url, published. RLS: public select where published; admin all. CMS list page under `/management/cms/events` to add/remove.
- **Stories data:** `cb_stories` table — title, slug, body (markdown), hero_url, published, published_at. Same RLS pattern.
- **Navigation updates:** `src/data/navigation.ts` gets new entries under Town (Karaoke, Afternoon Tea, Playlist, Menus) and Country (Terraces & Gardens, Afternoon Tea, Playlist, Menus, Food).
- **Sitemap + llms.txt + cbSiteMap.ts** updated in lockstep.
- **SEO:** each new page wired through existing `CBSeo` + structured data helpers (Restaurant / Event / WebPage as appropriate).

---

## Build order

1. Scaffolding: shared components, CMS registry entries, route stubs.
2. Rooms category pages (8) — pure UI/CMS, fastest win.
3. Food landings + menu tabs + `/menus` indexes.
4. Afternoon Tea (both sites).
5. Terraces & Gardens.
6. Karaoke.
7. Playlists.
8. Gift Vouchers.
9. DB migrations + admin UI for **What's Happening** and **Stories**, then their public pages.
10. Update sitemap.xml, llms.txt, navigation, cbSiteMap.

Confirm and I'll start at step 1.
