## The Look — /town/culture

You uploaded four photos. Three of them don't match the existing tile titles (Silver leaf, The koi, Hom Thai, The pool), so I'll rewrite the tiles to fit the actual imagery, then bind one image per tile in display order.

### Image → Tile mapping

| # | Photo | New tile title | Caption (Bears Den voice) |
|---|---|---|---|
| 1 | Disco-ball-head dancers on the dance floor | The burlesque years. | Saturday nights. Mirrorball heads. Heels louder than the music. |
| 2 | Pineapple prawn curry in low light | Hom Thai. | Lanterns. Gold leaf. Proper heat upstairs. Quietly one of the best. |
| 3 | Red velvet bedroom with copper bath | Bedrooms with baths. | Crushed velvet, copper tubs, a tassel for everything. Black on black on red. |
| 4 | Black & gold rococo bedroom | Black on black on black. | Buttoned walls. Gilded beds. Lanterns dimmed to "consequences". |

Section headline stays **"The look."** Kicker stays **"Black on black on black"**.

### What I'll do

1. Copy the four uploads into `src/assets/cb-town-culture-look-*.jpg` (filenames matching the order above).
2. Register a `town-culture / collage` slot in `src/data/cmsImageRegistry.ts` with these four images as bundled defaults so they ship live without needing a CMS upload first.
3. Update the `collageSeed` for Town in `src/components/crazybear/culture/CulturePage.tsx` with the new titles + captions above.
4. Confirm `useCMSAssets("town-culture", "collage")` resolves these defaults in order so each tile lines up with its caption.
5. Country Culture is untouched (different shoot to come).

### Live + CMS behaviour

- Live `/town/culture`: shows the four photos with the new captions immediately.
- CMS visual editor (`/management/cms/visual/town/culture`): tiles remain individually editable, and the photos can be replaced per-slot via the existing image picker without losing the captions.

### Out of scope

- No timeline, playlist, or House Rules changes.
- No new database migration. Defaults live in code; CMS overrides still take precedence when added.
