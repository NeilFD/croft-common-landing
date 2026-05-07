
# Phase 1: Crazy Bear Rebrand - Landing + Navigation

Scope is shaping the new architecture and porting text/branding from Croft Common to Crazy Bear. All app functionality, members area, secret gestures and Common Room logic stays intact and is reused under "Members" for both properties. Visual scheme stays black & white (Croft style), not the gold/dark of the old Bear projects.

## 1. Information Architecture

New top-level routes:

```text
/                     Landing chooser (Country | Town)
/country              Crazy Bear Country (Stadhampton) home
/town                 Crazy Bear Town (Beaconsfield) home
/members              Shared members entry (existing Common Room logic)
```

### Country (Stadhampton) sub-tree
```text
/country/pub
/country/pub/food
/country/pub/drink
/country/pub/hospitality
/country/rooms
/country/rooms/types
/country/rooms/gallery
/country/parties
/country/events
/country/events/weddings
/country/events/birthdays
/country/events/business
/country/members          -> reuses /members
```

### Town (Beaconsfield) sub-tree
```text
/town/food
/town/food/black-bear
/town/food/bnb
/town/food/hom-thai
/town/drink
/town/drink/cocktails
/town/rooms
/town/rooms/types
/town/rooms/gallery
/town/pool
/town/members             -> reuses /members
```

A `PropertyContext` (country | town) wraps each subtree so nav, theming accents and members deep-links know which property the user is in.

## 2. Landing Page (`/`)

Replaces current Croft `Index.tsx`. Two large split panels (stacked on mobile):

```text
+-------------------------+-------------------------+
|     CRAZY BEAR          |     CRAZY BEAR          |
|       COUNTRY           |        TOWN             |
|     Stadhampton         |     Beaconsfield        |
|   [stadhampton image]   |   [beaconsfield image]  |
+-------------------------+-------------------------+
```

Uses `stadhampton-property.jpg` and `beaconsfield-property.jpg` from Bear Compass (copied across). Black & white treatment, white serif display type, hover reveals a short tagline + ENTER chevron. Bottom strip: small "Members" link that goes to `/members` directly (preserves the gesture-access surface used by existing members).

## 3. Navigation Components

Replace the single `Navigation.tsx` with three cooperating components:

- `LandingNav.tsx` - minimal, only logo + Members link, used on `/`.
- `CountryNav.tsx` - top bar for `/country/*` with the Country menu.
- `TownNav.tsx` - top bar for `/town/*` with the Town menu.

Both property navs share a `PropertyNavShell` that handles:
- Logo (Crazy Bear mark, links back to property home)
- Property switcher chip on the right ("Switch to Town" / "Switch to Country")
- Desktop: top items with hover-reveal sub menu (matches current Croft black/white styling)
- Mobile: full-screen overlay with accordions per top item
- Members entry preserved on every nav (so secret gestures still work from anywhere)

Menu data lives in `src/data/navigation.ts`:

```ts
export const countryNav = [
  { label: 'Pub',     path: '/country/pub',     children: [
      { label: 'Food',         path: '/country/pub/food' },
      { label: 'Drink',        path: '/country/pub/drink' },
      { label: 'Hospitality',  path: '/country/pub/hospitality' },
  ]},
  { label: 'Rooms',   path: '/country/rooms',   children: [
      { label: 'Room Types', path: '/country/rooms/types' },
      { label: 'Gallery',    path: '/country/rooms/gallery' },
  ]},
  { label: 'Crazy Bear Parties', path: '/country/parties' },
  { label: 'Events',  path: '/country/events',  children: [
      { label: 'Weddings',  path: '/country/events/weddings' },
      { label: 'Birthdays', path: '/country/events/birthdays' },
      { label: 'Business',  path: '/country/events/business' },
  ]},
  { label: 'Members', path: '/members' },
];

export const townNav = [ /* mirrors structure above for Town */ ];
```

## 4. Page Scaffolding

For each route above, create a simple page component using a shared `PropertyPageLayout`:
- Hero image (placeholder from Bear Compass assets, mapped per page)
- Page title (serif), short body, "Coming soon" / placeholder copy
- Re-uses existing `MenuButton` + `MenuModal` so the secret "7" swipe gesture still works on every property page

This keeps Phase 1 focused on structure; real copy/menus land in Phase 2.

## 5. Branding Sweep (text only, no design overhaul)

Rename references project-wide while keeping the black & white Croft visual system:

- `Croft Common` -> `Crazy Bear`
- `The Common Room` -> `Members` (label) but keep underlying routes/components named CommonRoom internally to avoid touching members/auth logic
- Logo component: replace `CroftLogo` usage in the new landing/nav with a new `CrazyBearLogo` wrapper that renders `crazy-bear-logo.svg` (copied from Bear Compass)
- Update `index.html` title, meta description, OG tags
- Update `src/data/brand.ts` (name, tagline, social handles placeholders)
- Footer: replace Croft contact block with two-column "Country | Town" placeholder addresses

What is NOT changed in Phase 1:
- Member auth, push, WebAuthn, ledger, moments, lunch run, gestures - all retained as-is
- Management app and CMS - retained, only label strings updated where they say "Croft Common"
- Colour tokens - stay on existing black/white Croft palette
- All edge functions and database

## 6. Asset Migration

Copy from `Bear Compass` project into this repo:

```text
src/assets/crazy-bear-logo.svg
src/assets/crazy-bear-logo.png
src/assets/crazy-bear-full-logo.png
src/assets/stadhampton-property.jpg
src/assets/beaconsfield-property.jpg
```

Plus a curated set of hero images per section (pub, rooms, events, pool, food sub-pages) selected from the `idea-*` and `hero-*` images already in Bear Compass. Mapped in a new `src/data/propertyHeroMap.ts`.

## 7. Routing Wiring

Update `src/App.tsx`:
- `/` -> `LandingPage`
- `/country/*` -> `CountryLayout` (wraps `CountryNav` + `Outlet`)
- `/town/*` -> `TownLayout` (wraps `TownNav` + `Outlet`)
- `/members` and existing `/common-room/*`, `/check-in`, etc. unchanged
- All current Croft venue routes (`/cafe`, `/cocktails`, `/beer`, `/kitchens`, `/hall`, `/community`) get redirects to the new equivalents (or to landing) so existing inbound links don't 404

## 8. Out of scope for Phase 1 (logged for later phases)

- Final menus, room descriptions, real photography, pricing
- Booking integrations for rooms and events
- Pool page detail
- Crazy Bear Parties detail
- Mobile app (Capacitor) icon/splash refresh
- CMS content seeding for the new pages

## 9. Suggested implementation order once approved

1. Copy assets and add `CrazyBearLogo` + brand tokens
2. Build `LandingPage` and route `/`
3. Add nav data + `CountryNav`, `TownNav`, `PropertyNavShell`
4. Add `CountryLayout`, `TownLayout` and stub pages for every route
5. Add legacy redirects from Croft routes to new structure
6. Sweep visible "Croft Common" strings to "Crazy Bear" (excluding internal route/component names)

After this phase the site has the full new structure with placeholder content, members area fully working under both properties, and ready for Phase 2 content population.
