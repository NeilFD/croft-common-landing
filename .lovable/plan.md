# Top Nav Restructure + New Landing Pages

## 1. Top nav (CBTopNav + CBMemberNavItems)

Rebuild the nav order so BOOK sits at the far right, and Members links toggle by auth state.

Order (left → right after the logo):

1. Our Rooms → `/rooms`
2. Food → `/food`
3. Offers → `/offers`
4. What's Happening → `/whats-on`
5. Weddings → `/country/events/weddings`
6. Members log-in (button, opens existing `CBMemberLoginModal`) — only when **not** signed in
7. Members → `/members` — only when signed in
8. Sign out (button) — only when signed in
9. BOOK → `/book` (existing `PRIMARY_CTAS.book`) — far right, keeps current button styling

Mobile: same order, collapses behind the Menu button as today. The Menu overlay (`CBNavOverlay`) stays as-is for now (separate site-map view).

## 2. New pages

All three follow the same split-screen Town/Country pattern (vertical 50/50, full-bleed hero image each side, hover/tap reveals CTA). Built as reusable `<SplitLanding>` component to keep them consistent.

### `/rooms` — `src/pages/crazybear/RoomsLanding.tsx`
- Left: Town → `/town/rooms`
- Right: Country → `/country/rooms`
- CTA label: "See Rooms"

### `/food` — `src/pages/crazybear/FoodLanding.tsx`
- Left: Town → `/town/food/menus`
- Right: Country → `/country/food/menus`
- CTA label: "Click to see Menus"

### `/offers` — `src/pages/crazybear/OffersLanding.tsx`
- Empty scaffold: hero, intro line, CMS-driven offer cards grid (renders nothing until offers exist).
- No Town/Country split — single page per your answer.

Each page: standard `CBTopNav` (light tone over imagery), `CBFooter`, SEO via `useSEO`.

## 3. CMS coverage

Per project rule, every new page goes into CMS. Add three new CMS content entries using the existing `useCMSContent` pattern (same approach as other landing pages):

- `rooms-landing` — hero image L/R, headline L/R, CTA label
- `food-landing` — hero image L/R, headline L/R, CTA label
- `offers-landing` — hero image, intro copy, list of offer cards `{ title, image, body, ctaLabel, ctaPath }`

Register each in `src/data/cmsImageRegistry.ts` and surface them in the CMS admin (`src/admin/...`) under a new "Landing Pages" group so they're editable like existing CMS pages.

## 4. Routing

Add to `src/App.tsx`:
```
<Route path="/rooms" element={<RoomsLanding />} />
<Route path="/food" element={<FoodLanding />} />
<Route path="/offers" element={<OffersLanding />} />
```

## Technical notes

- `CBMemberNavItems.tsx`: replace current markup. Use `useCBMember().isMember` to switch between `Member Login` button + (hidden Members link) vs `Members` link + `Sign out` button. Apply same `linkCls` from parent.
- `CBTopNav.tsx`: insert the new link list between the logo and the existing right-side group. BOOK button moves to be the **last** child of the right-side `<nav>` (currently first). Keep scroll-aware backdrop, property accents, safe-area padding untouched.
- `SplitLanding` lives at `src/components/crazybear/SplitLanding.tsx`. Props: `left`, `right` each `{ label, image, href, cta }`. Mobile: stacks vertically (50vh each).
- New CMS content reads via existing `useCMSContent` hook; defaults baked into the component so pages render before CMS is populated.
- No backend/auth changes. No restyle of /house-rules, /karaoke, footer.

## Out of scope

- No changes to `CBNavOverlay` (full site-map menu) — same content stands.
- No new `/town/offers` / `/country/offers` routes.
- No copy changes elsewhere.
