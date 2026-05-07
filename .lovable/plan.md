You are right. I checked the live mapping and the issue is that the images shown on `/country` and `/town` are still the old property hero files:

- `/country` is still using `stadhampton-property.jpg`, the copper bath crop
- `/town` is still using `beaconsfield-property.jpg`, another copper bath crop
- The better glamorous room images were copied in, but they were mainly wired to `/country/rooms` and `/town/rooms`, not the two property landing pages you are looking at

Plan to fix this properly:

1. Replace the main property landing heroes
   - Change `/country` from the copper bath image to the strongest Stadhampton glamour image, the deep red/zebra lampshade interior already used on the main landing hero.
   - Change `/town` from the copper bath image to a more glamorous Beaconsfield image from the reference assets, not the current bath crop.

2. Improve the rooms route heroes as well
   - Use the most eye-catching wide suite image for the main Rooms pages, especially the black four-poster, red drapery and gold suite image.
   - Keep the copper/tub close-ups only where they make sense as supporting room type or gallery imagery, not as the first thing you see on a property page.

3. Remove the confusing old mapping
   - Stop reusing the old `stadhampton-property.jpg` and `beaconsfield-property.jpg` as the primary `/country` and `/town` hero images.
   - Import named, glamorous assets so it is obvious which image powers each route.

4. Verify the visible result
   - After updating, check `/country`, `/town`, `/country/rooms`, and `/town/rooms` so the first-screen hero is no longer the poor copper-bath crop and looks much more Crazy Bear.

Technical detail:

- Main file to update: `src/data/propertyHeroMap.ts`
- Likely assets to use:
  - `src/assets/cb-landing-hero.jpg` for the dramatic Stadhampton red/zebra interior
  - `src/assets/cb-rooms-chateau-suite.jpg` for the strongest suite/rooms hero
  - `src/assets/cb-rooms-copper-suite.jpg` where a copper suite is still useful, but not as the main property landing image