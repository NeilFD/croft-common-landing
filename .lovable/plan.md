## Goal

Add a member-only "secret 7" gesture across Town and Country pages. When a signed-in member draws a 7, a Crazy Bear styled modal opens with a contextual perk. Also remove "Crazy Bear" from the Parties nav label.

## Pages and what each gesture reveals

### Town
- `/town/food`, `/town/food/black-bear`, `/town/food/bnb`, `/town/food/hom-thai` → **Recipe of the Month** modal. One main course recipe per kitchen, written in-house. Shows dish name, story line, ingredients list, method steps.
- `/town/drink`, `/town/drink/cocktails` → **Roll the Dice** modal. Same mechanic as Croft Common: 5 dice, each face = a category (spirit, citrus, sweet, bitter, twist). Roll, get a random Crazy Bear cocktail spec.
- `/town/rooms`, `/town/rooms/types`, `/town/rooms/gallery` → **Members Room Offer** modal. Room package + bold "Reserve" button → fake link `/book?offer=members-town` (placeholder until booking engine).
- `/town/pool` → **Day Bed Discount** modal. Members-only discount code + booking CTA.

### Country
- `/country/pub`, `/country/pub/food` → **Recipe of the Month** modal (separate dish from Town).
- `/country/pub/drink` → **Roll the Dice** modal.
- `/country/rooms`, `/country/rooms/types`, `/country/rooms/gallery` → **Members Room Offer** modal.
- `/country/parties` → **Secret Cinema** modal (existing `SecretCinemaModal` reused, restyled wrapper if needed).
- `/country/events` → no gesture yet (TBC).

### Nav
- `src/data/navigation.ts`: change `"Crazy Bear Parties"` → `"Parties"`.

## Gesture mechanics

- Reuse existing `useGestureDetection` + `GestureOverlay` pattern (already used on `/den` and old Calendar).
- Mount overlay only if `useAuth().user` is signed in. No member → no gesture, no hint.
- Add tiny mono hint at the bottom of each enabled page: `Members: draw 7` (existing visual language).
- Cooldown: 2s after a successful gesture before another can fire (existing hook handles this).

## New components

```
src/components/secrets/
  SecretGestureHost.tsx        // wraps page, runs gesture detection, renders chosen modal
  RecipeOfTheMonthModal.tsx    // dish, story, ingredients, method
  RollTheDiceModal.tsx         // 5 dice, animated roll, generated cocktail spec
  RoomsOfferModal.tsx          // hero image, perk copy, fake reserve link
  PoolDayBedModal.tsx          // discount code, CTA
src/data/
  secretRecipes.ts             // 5 recipes: black-bear, bnb, hom-thai, town-pub, country-pub
  secretCocktailDice.ts        // dice face data for Town + Country
  secretRoomOffers.ts          // 2 offers (town, country)
```

`SecretGestureHost` takes a `variant` prop (`'recipe-blackbear' | 'recipe-bnb' | 'recipe-homthai' | 'recipe-townpub' | 'recipe-countrypub' | 'dice-town' | 'dice-country' | 'rooms-town' | 'rooms-country' | 'pool' | 'cinema'`). Wrap each target page (or its layout) with it.

## Recipe content (written in-house, sample shape)

- **The Black Bear (Town)**: Slow-Braised Beef Cheek with Bone Marrow Mash. Story line, 8 ingredients, 6 steps.
- **B&B (Town)**: Roast Cod with Brown Shrimp Butter and Sea Aster.
- **Hom Thai (Town)**: Massaman Lamb Shank with Crisp Shallots and Roti.
- **Country Pub**: Steak and Stout Suet Pudding with Bone Gravy.
- **Country Pub Food (alt)**: Whole Plaice with Caper Brown Butter and Triple-Cooked Chips.

(Will write proper ingredients + method copy per dish in implementation.)

## Roll the Dice spec

5 dice. Each rolls a category:
1. Base spirit
2. Modifier (vermouth, amaro, liqueur)
3. Citrus or acid
4. Sweet (syrup, fruit, honey)
5. Twist (garnish, bitters, smoke)

After roll → composed recipe shown in Crazy Bear typography (`Archivo Black` heading, `Space Grotesk` body, `font-cb-mono` ratios). Re-roll button.

Town and Country share the engine; different garnish/twist pools so each location feels distinct.

## Rooms / Pool / Cinema modals

- **Rooms offer (each property)**: B&W hero, eyebrow `MEMBERS ONLY`, headline `THE INSIDER NIGHT`, perk copy (e.g. "Suite upgrade. Late checkout. Breakfast on us."), `RESERVE` button → `window.open('/book?offer=members-' + property)` (placeholder route, no booking engine yet).
- **Pool**: eyebrow `MEMBERS ONLY`, headline `THE DAY BED`, copy + code `BEAR25`, `RESERVE` button (placeholder).
- **Cinema**: reuse `SecretCinemaModal`, opened from gesture host.

## Design

- All modals: `bg-black text-white` or `bg-white text-black`, no rounded corners, no focus rings (use border highlight), Archivo Black headings, Space Grotesk body, mono eyebrows tracked `[0.4em]`. Match existing `MembershipCard` aesthetic.
- No lucide icons. Plain glyphs / unicode where needed (✕ for close).
- Backgrounds use existing assets where possible; no AI-generated imagery.

## Out of scope

- Real booking engine wiring.
- CMS-driven recipes (hard-coded for now).
- Events page gesture (TBC).
- Persisting roll history.

## Files touched

- `src/data/navigation.ts` (rename label)
- `src/pages/property/index.tsx` (wrap target pages with `SecretGestureHost`)
- New files under `src/components/secrets/` and `src/data/`
