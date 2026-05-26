## Goal

Add Mews rooms reservations to the site, opened from `/book` via a branded full-screen modal that mirrors the existing SevenRooms `BookTableButton` UX, with property-scoped accent (Town red / Country teal).

## Mews identifiers (captured)

- **Town — Crazy Bear Beaconsfield**
  - Configuration ID: `690b25ab-866e-447f-aedd-b1490084c2bb`
  - City ID: `4f085e2c-9847-4551-a6f6-b14900838fa5`
- **Country — Crazy Bear Stadhampton**
  - Configuration ID: `475876b0-3ae2-4a28-8c0e-b14900821585`
  - City ID: `eb0fb60d-8188-4108-8e7a-aee400d0f366`

## What gets built

### 1. Mews data source
New file `src/data/mewsHotels.ts` — single source of truth for both Mews configurations (id, label, property scope, currency `GBP`). Pattern mirrors `src/data/sevenroomsVenues.ts` so future surfaces (room pages, header CTA) can reuse it without duplication.

### 2. Branded Mews loader hook
New file `src/hooks/useMewsDistributor.ts` — injects the official Mews `distributor.min.js` once per page lifecycle, exposes a `openMews(configurationId)` function that calls `Mews.Distributor.open()` with the given config. Handles script-loaded readiness, avoids double-injection, and silently no-ops if the SDK fails (with console warn).

### 3. BookRoomButton component
New file `src/components/booking/BookRoomButton.tsx` — same API surface as `BookTableButton` (`hotel`, `label`, `variant`, `tone`, `className`).

Behaviour:
- Click opens our own full-screen `Dialog` styled identically to the table-booking modal (black background, white border, property accent bar at top, eyebrow + display title).
- Inside the modal we render a single container `<div id="cb-mews-mount-{configurationId}">` and call the Mews distributor with `openElementId` pointing to it (Mews mounts its widget inline into our container).
- Same dialog conventions as `BookTableButton`: `data-property` scope, no focus rings, opaque footer with "Open in new tab" fallback link to the Mews-hosted booking page for that hotel.

Because Mews's distributor is a self-contained widget, the inner booking flow remains Mews's UI — but the chrome around it (open trigger, modal frame, eyebrow, property accent, fallback link) is fully Crazy Bear. This is the most branded outcome without a custom Mews API integration.

### 4. /book — new "Stay the night" section
Edit `src/pages/Book.tsx`. Below the existing 3-card restaurant grid, add a clearly delineated second block:

- Section heading: `Stay the night` (display font), eyebrow `Rooms`.
- Two-card grid (Town + Country), styled identically to the restaurant cards: property accent bar, eyebrow, hotel name, one-line blurb, `BookRoomButton` outline/light CTA `Book a room`.
- Cards use `data-property` so Town gets red accent, Country gets teal.

Restaurant section gets a small sub-heading `Tables` for symmetry with `Stay the night`, so the page reads as two clearly separated booking categories.

### 5. SEO + meta
Update the `/book` page title and meta description to mention both tables and rooms. Keep canonical handling as-is.

### 6. CMS hookup
Per project rule "every new page is added to CMS": no new page is added here (everything stays on `/book`), but the new section eyebrow + heading + two card blurbs are wired through `CMSText` with `page="book"`, `section="rooms"`, so they're editable in the existing Book CMS surface without a new registry entry.

## Technical detail

```text
src/
  data/
    mewsHotels.ts            (new)  configIds + labels
  hooks/
    useMewsDistributor.ts    (new)  script loader + open()
  components/
    booking/
      BookRoomButton.tsx     (new)  branded modal + Mews mount
  pages/
    Book.tsx                 (edit) add Stay the night section
```

Mews script URL: `https://app.mews.com/distributor/distributor.min.js` (same one shown in your screenshots). It's loaded once, lazily, when the first `BookRoomButton` mounts. No edge function, no API key, no Supabase changes — Mews handles availability, payment, confirmation entirely inside its widget.

## Out of scope (for this round)

- Embedding Mews CTAs on individual room-type pages (Town/Country room detail pages). You said /book only for now — easy to add later because `BookRoomButton` is reusable.
- Per-room-type pre-selection (deep-linking a specific room category into Mews). Possible later via Mews's `rooms` parameter once we map our room slugs to Mews category IDs.
- A fully custom pre-flight (dates/guests in our UI, hand off to Mews pre-filled). Bigger build; revisit once the basic flow is live.

## Risks

- Mews's distributor renders its own DOM inside our modal — we cannot restyle its internals. Branding is limited to the modal frame around it. If that's not enough, the next step is the "Pre-flight then Mews" option from the earlier question.
- Mews script is third-party and loads on demand; if it's blocked, the "Open in new tab" footer link is the fallback.