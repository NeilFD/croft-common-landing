## Goal
Replace the four images in **The Look** section on `/country/culture` with the four uploaded Stadhampton photos, and rewrite each tile's caption + body to match.

## Image mapping

| Slot | Upload | New asset path | Tile |
|---|---|---|---|
| 1 | `20240523-CRAZYBEAR627.jpg` (red Routemaster reception) | `src/assets/cb-country-culture-look-1-routemaster.jpg` | Reception by Routemaster |
| 2 | `Stad_Room1.jpg` (copper bath, gold tufted bed, red velvet) | `src/assets/cb-country-culture-look-2-bedroom.jpg` | Bedrooms with copper |
| 3 | `Crazy_Bear_Autumn_2022-14-2-2.jpg` (Thai/seafood spread) | `src/assets/cb-country-culture-look-3-feast.jpg` | The long Thai lunch |
| 4 | `Stad_Outsdie_Terrace.jpg` (firepit terrace at night) | `src/assets/cb-country-culture-look-4-terrace.jpg` | Firepit, after dark |

## Copy changes (`src/components/crazybear/culture/CulturePage.tsx`)

Update **COUNTRY** block:
- `collageKicker` from "Antlers, mirrors, candlelight" → **"Red bus. Copper bath. Open fire."**
- `collageSeed` → four tiles:
  1. **Reception by Routemaster.** — "Check in via the old red bus. Neon sign. Ivy round the door. The arrival sets the tone."
  2. **Bedrooms with copper.** — "Roll-top copper baths. Gold tufted walls. Red velvet. Rooms that don't ask permission."
  3. **The long Thai lunch.** — "Lobster, prawns, curry, carved fruit. Thai kitchen taking itself seriously. Sunday slips into evening."
  4. **Firepit, after dark.** — "Logs stacked. Fire lit. Lanterns in the palms. Dinner outside until the embers go down."

## Registry changes (`src/data/cmsImageRegistry.ts`)

- Import the four new `cb-country-culture-look-*` assets.
- Add a new `country-culture` registry entry (`page: "country-culture", slot: "collage", kind: "gallery"`) with the four images and matching alt + caption strings, mirroring the existing `town-culture` collage entry. This wires them into the CMS so the team can re-edit later.

## Out of scope
Town culture, hero, playlist, timeline, quotes, closing, layout, design tokens. Image-only + caption swap on the Country culture "The Look" grid.