# Sharpen /pub

Three sections still look home-made: Bar Snacks (cream tags), What's Pouring (chalkboard with double brass frame), Pinned Specials (tilted cream cards with cork dots). Replace with editorial, photography-led blocks. Pull food content from the real country Pub menu, not invented copy.

## What changes

### 1. Bar Snacks → "At the bar" editorial strip
- Drop the tilted cream price tags.
- Two-column layout: left = fireside photo full-height; right = clean menu list, oxblood background, cream type, hairline rules, brass price column.
- Items pulled from `countryPubMenu` "To Start" section: Scotch Egg £8 · nam jim jaew, Sausage Roll £7 · smoked chilli jam, Pork Scratchings £5 · apple sauce, Crispy Wings £9, Padron Peppers £6, Prawn Crackers £5.
- One CTA, mono caps: "Full menu →" → `/pub/food`.

### 2. What's Pouring → "On the bar today" chalk wall
- Drop the double brass-bordered green box; it reads as a Word-art frame.
- Full-bleed deep ink background (no inner borders). Slim Bowlby section number "01 / Cellar". Single hairline brass rule. Two-column grid of pours: name + provenance left, ABV right in mono. No price tag styling, no dashed dividers.
- Add a small photo strip at the bottom: 3 thumbnails (cask ales sign, copper-table pint, dim window) at 16:9, brass 1px frame, no shadows.

### 3. Pinned Specials → "From the kitchen" plate gallery
- Drop the cork-board dot background, the drawing-pin dots, and the cream tilted cards.
- Layout: oversized fish & chips photo bleeds top-left; type sits on a flat cream slab next to it. Below, an editorial 3-up list, no cards — just rules between rows.
- Items pulled from `countryPubMenu` "The Pub" section (trad anchors only):
  - Wild Mushroom & Ale Pie £18 — shortcrust, mash, buttered greens
  - Slow-Roast Pork Shoulder £20 — crackling, burnt apple, cavolo nero
  - Smoked Haddock £19 — grain mustard cream, poached egg, chives
  - Bavette Steak £26 — dripping chips, béarnaise
  - Braised Ox Cheek £22 — horseradish, bone marrow crumb, greens
  - Roast Bone Marrow £13 — parsley, capers, sourdough
- Header changes from "Pinned Specials" → "From the kitchen". Eyebrow "The Pub menu".

### 4. Door Sign Hours
- Keep the photographic spine, but strip the brass 6px frame and dotted leader lines (they're the last clip-arty detail). Single hairline rule, mono columns for day/hours.

## Design tokens
- No new tokens. Reuse `--pub-oxblood`, `--pub-cream`, `--pub-brass`, `--pub-ink`.
- Remove these CSS classes from `src/styles/pub.css` once unreferenced: `.pub-chalkboard`, `.pub-pinned`, `.pub-pinned-tilt-l`, `.pub-pinned-tilt-r`, `.pub-grain`, `.pub-wood`. Keep `.pub-display`, `.pub-brass-rule`, `.pub-etched`.

## Files touched
- `src/components/pub/SnacksStrip.tsx` — rebuild as photo+list editorial block.
- `src/components/pub/Chalkboard.tsx` — rename component intent, drop frame, add photo thumb row. Pull from a small in-file `DEFAULT_POURS` list (CMS later).
- `src/components/pub/PinnedSpecials.tsx` — rebuild as plate + list. Source items inline from `countryPubMenu`'s "The Pub" trimmed to 6 trad picks.
- `src/components/pub/DoorSignHours.tsx` — minimal pass: remove brass frame + dotted leaders.
- `src/styles/pub.css` — delete dead classes listed above.

## Out of scope
- No new routes, no DB migration, no CMS schema changes.
- `/pub/food`, `/pub/drink`, `/pub/snacks` sub-pages untouched this round.
- No new photography — reuse the six bundled pub assets.
