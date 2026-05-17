# Homepage rethink — Stay / Eat & Drink / Celebrate / Discover / Visit Us

## Diagnosis

The new menu is organised by **site** (Town column / Country column). The homepage is still organised by **topic** with flat lists of every leaf page underneath (Stay = 15 links, Eat & Drink = 13, Celebrate = 9, Discover = 7). Two problems:

1. **Mental model clash.** Menu says Town/Country, homepage says topic. Users have to re-orient on every section.
2. **Sitemap, not keynote.** Long flat lists feel like a footer dumped into the body. No air, no authority, no editorial voice. Apple keynote homepages don't list every product variant — they show the headline and trust users to drill in.

## Best practice (the rule of thumb)

A homepage section should answer three things, in order:
1. **What is this?** (headline + one line)
2. **Where do I go next?** (max 4–5 curated destinations per column, not every leaf)
3. **Where's the full set?** (one "see all" link)

Miller's 7±2 caps the scan. Mirror the menu structure (Town | Country) so the muscle memory carries from nav to body. Keep the deep leaves (Snug, Cosy, Boujee, Decadent etc.) on the property hub pages where they belong — not on the homepage.

## Proposed structure

Each topic section becomes a **two-column mirror**: Country left, Town right. Same number of links per side. Same visual weight. Big headline stays.

```text
01 / STAY
STAY
Two hotels. One spirit.

COUNTRY / STADHAMPTON          TOWN / BEACONSFIELD
Country Rooms              →   Town Rooms                  →
Room Types                 →   Room Types                  →
Snug · Cosy · Boujee · Decadent (one row of 4 chips)
Gallery                    →   Gallery                     →
                               Pool                        →
See all Country rooms      →   See all Town rooms          →
```

Same pattern for every section. Removes the 15-link wall, keeps every page reachable, and the page now reads as Country|Town top-to-bottom.

## Per-section plan

**01 / Stay** — 2 columns. Each side: Rooms hub, Room Types, a single chip row for the four variants (Snug / Cosy / Boujee / Decadent), Gallery. Town gets an extra "Pool". Variant chips link out but don't shout.

**02 / Eat & Drink** — 2 columns. Town: The Black Bear, B&B, Hom Thai, Afternoon Tea, Cocktails, All menus. Country: The Pub (food), Pub Drink, Pub Hospitality, Afternoon Tea, All menus. Sunday Lunch / Breakfast / Lunch slot in as a single "Menus" link per side, not as separate cards.

**03 / Celebrate** — Asymmetric, on purpose. Country is the events engine, Town is the night out. Country column: Weddings, Parties, Birthdays, Business Events, Terraces & Gardens, All events. Town column: Karaoke (with the new "Tonight you are Celine" line as the strapline). Underneath the two columns, a full-width footer row: **What's Happening** and **Gift Vouchers** (both apply across sites).

**04 / Discover** — 2 columns. Country: Culture, Playlist. Town: Culture, Playlist. Full-width row underneath for the cross-site: **About**, **House Rules**, **Stories from the Bear**. Discover is shorter than the others — that's fine, it gives the page rhythm.

**05 / Visit Us** — Already correct (Country left, Town right with address + CTAs). Keep as-is. It's the proof that the mirror model works.

## What we keep

- Section numbering (01 / 02 / 03 / 04 / 05) — gives it editorial confidence.
- Alternating black/white sections — keeps the rhythm.
- Big display headlines, mono eyebrows, generous vertical padding.
- Bear's Den strip at the very bottom.

## What we lose

- Every leaf page listed on the homepage. The deep variants live on `/country/rooms` and `/town/rooms` — homepage trusts the user to click through. SEO impact is negligible: the variants are still internally linked from the rooms hubs and the menu overlay (in DOM via `<details>`).

## SEO note

Internal links from the homepage carry slightly more weight than links from a hub page. To not lose ranking on the variant pages, every removed link is still surfaced via:
- the menu overlay (always in DOM)
- the property hub pages (`/country`, `/town`)
- the footer site map
- `sitemap.xml`

Net SEO change: neutral. Homepage clarity: significant gain.

## Technical scope

- Rewrite `src/components/crazybear/CBLandingSections.tsx` to render Town/Country columns per section instead of a flat list.
- Replace the topic-flat `SITE_MAP[].links` consumption with a new shape: `SITE_MAP[].country[]` and `SITE_MAP[].town[]`, plus an optional `bothBelow[]` row for cross-site links (used by Celebrate and Discover).
- Update `src/data/cbSiteMap.ts`:
  - Change `SiteMapGroup` type to `{ id, label, intro, country: SiteMapLink[], town: SiteMapLink[], bothBelow?: SiteMapLink[] }`.
  - Move every existing link into the right bucket. Stay: 5 Country + 5 Town. Eat & Drink: 6 Town + 5 Country. Celebrate: 6 Country + 1 Town (Karaoke), 2 `bothBelow`. Discover: 2 Country + 2 Town, 3 `bothBelow`.
  - Add tiny "see all" link per column pointing at the property's hub for that topic.
  - `allPublicPaths()` keeps working — flatten across `country + town + bothBelow`.
- No DB, no route, no sitemap changes. Visit Us section untouched.

## Open question

Stay variants (Snug / Cosy / Boujee / Decadent) — should they appear on the homepage as a **single chip row per column** (recommended, mirrors the menu) or be **dropped entirely** from the homepage and only live on the menu + rooms hub? Dropping them is more keynote, less SEO-belt-and-braces. The plan above assumes the chip row; say the word and I'll cut them.
