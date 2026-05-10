## Align Town & Country culture pages with the edited About page

Reading the published About content, the key factual updates are:

- Founder = **Jason Hunt** (1993, Stadhampton)
- Town walls = **silver/gold/copper leaf** (not silver only)
- Koi swim **behind the cisterns** (not "behind the urinals")
- Country rooms = roll-top baths, **mirrored ceilings, velvet walls**, breakfast by hand
- "Today" tone = **"Same spirit. Slightly better behaved. Only slightly."** + millennial-Britpopper energy
- Long lunches that roll out of breakfast

Edits in `src/components/crazybear/culture/CulturePage.tsx` only — no DB changes (live editor copy on these pages already uses the in-code seeds).

### TOWN — changes

- **metaDescription**: "Koi behind the urinals" → "Koi behind the cisterns". "silver-leaf walls" → "silver, gold and copper leaf".
- **tagline**: "black, silver and Thai gold" → "black, silver, gold and copper".
- **introBody**:
  - "lined in silver leaf" → "lined in silver, gold and copper leaf"
  - "Koi went in behind the urinals" → "Koi went in behind the cisterns"
  - Closing line tightened: "Heels on the staircase by ten. Cocktails by eleven. Breakfast that rolls into the longest lunch of your life."
- **collage tile 4** caption: keep "Black on black on black." but body → "Buttoned walls. Gilded beds. Silver, gold and copper leaf catching every candle."
- **timeline**:
  - "The townhouse opens." body → "Eight bedrooms. Two bars. Two kitchens. Repainted in black and lined in silver, gold and copper leaf in under a year."
  - Add new entry between "Glass loos" and "Hom Thai upstairs": **"The koi move in." / "Behind the cisterns. Conversation starters since." / year: 2002.**
  - "Today." body → "Same building. Same spirit. Slightly better behaved. Only slightly."

### COUNTRY — changes

- **introBody** middle paragraph → "The dining room got a cow. The bedrooms got mirrored ceilings, velvet walls, and roll-top baths. The garden got treehouses with baths above the canopy. Breakfast brought up by hand, slowly. Lunch followed, slower."
- **collage tile "The cow"** body → "Taxidermy. Dining room. Watching you eat."
- **collage tile "Treehouse suites"** body → "Roll-top bath above the canopy. Mirrored ceilings. Velvet walls. Breakfast by hand."
- **timeline**:
  - "The pub reopens." body → "Jason Hunt takes on a wonky little local in Stadhampton. Gives it a name, a kitchen, and a real turf floor. Sheep optional."
  - "The cow moves in." body → "Taxidermy, mirrors, chandeliers in places chandeliers don't belong. The Crazy Bear look starts to harden."
  - "Treehouse suites." body → "Bedrooms in the trees. Roll-top baths above the canopy. Mirrored ceilings, velvet walls, breakfast brought up by hand."
  - "Today." body → "Two restaurants, a pub, treehouses, and the same spirit. Slightly better behaved. Only slightly."

### Out of scope

- No image changes.
- No nav, House Rules, playlists, quotes or hero changes.
- No DB migration; About page itself stays as the user edited it.
