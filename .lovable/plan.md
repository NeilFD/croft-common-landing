## The honest audit

Most pages already read their hero image from the CMS, but a handful never did. That's why The B&B looked stuck — its template (CBMenuPage, shared with Black Bear / Hom Thai) was hardcoded to the bundled image. I patched that one in the previous turn. The pages below are the remaining offenders.

### Already reading hero image from CMS (no work needed)

- All pages using `CBStaticPage`: Privacy, Careers, FAQHub, Gallery, Press, Journal, Merch, Contact, Treatments, Cookies, Terms
- All pages using `PropertyPage` (Town/Country property hubs, rooms, events, drink, etc.)
- About, Culture (Town + Country), Stories/Journal detail pages (use post `hero_url`)
- The B&B / Black Bear / Hom Thai (just fixed via `CBMenuPage`)  
  
  
Hang on youre saying BnB doesnt need work, but it isnt working IRL?

### NOT reading hero image from CMS — need fixing

1. **What's On** (`/whats-on`) — hero section has CMSText but no CMS image, just a plain black band.
2. **Gift Vouchers** (`/gift-vouchers`) — same, text only, no hero image slot.
3. **Members** (`/members`) — hero is a plain black band.
4. **Bear's Den** (`/bears-den`) — hero uses bundled bear mark only, no CMS image.
5. **Curious** (`/curious`) — uses a hardcoded bundled background image, not CMS.

## What I'll do

For each of the 5 pages above:

1. Add a `useCMSAssets(page, "hero")` (or single-row `cms_images` query) lookup using the page's existing CMS namespace.
2. Render the returned image as an absolute-positioned `<img>` behind the existing hero copy, with the same black overlay treatment used on CBStaticPage so text stays legible.
3. Keep the current bundled image (where one exists) as a fallback when no CMS row is published.
4. Register the new `hero` image slot for each page in `src/data/cmsImageRegistry.ts` so the CMS Assets screen exposes a "Replace" slot exactly like The B&B has now.

No changes to routing, copy, or business logic — image source only.

## Technical notes

- Single source of truth for the hero query: factor a small `useCMSHero(page)` hook (mirrors the inline query already in `CBStaticPage` and the new one in `CBMenuPage`) and reuse it across these 5 pages so we stop duplicating the same Supabase call.
- Registry entries follow the existing pattern: `{ page, slot: "hero", label: "<Page name> hero", defaults: [{ src: <bundled fallback>, alt: "" }] }`.
- Curious currently uses `cbBgImage` as a CSS `background-image`; switch to an `<img>` layer so the CMS image can override it cleanly.

## Out of scope

- Changing which images are currently published in the CMS (that's a content task in the CMS UI).
- Touching pages already wired correctly.