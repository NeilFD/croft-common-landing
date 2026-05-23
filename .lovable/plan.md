# Brand 2026 — Evolution Plan

The current site is a confident B&W system (Bowlby One + Space Grotesk, "Bears Den" staccato voice). The 2026 deck doesn't replace that — it **adds warmth, property-specific colour, and a more grown-up voice**. The recommendation is evolution, not redesign: keep the B&W chassis as the global frame, and let Town and Country each bloom inside it.

## What changes, what stays

**Stays (the chassis)**

- Bowlby One display + Space Grotesk body + Space Mono labels
- High-contrast B&W as the global / homepage / shared system (CBLandingSections, footer, nav, Bear's Den)
- Editorial layout language (mono eyebrows, big numbered sections, thin rules)

**Evolves**

- Two new property-scoped palettes layered on top of B&W
- Tone of voice softened and warmed (still punchy, less cold)
- Photography moves from product/architectural to candid, Nick Tucker–style event
- New visual motifs: door hangers, wax seals, neon, disco balls, "Press for Champagne" buttons
- One naming conflict to resolve: **"Decadent"** is one of our room types and is on the brand's words-to-avoid list  
  
IGNORE THE DECADENT ROOM TYPOE CONFLICT - THIS IS STRUCTURAL AND NEEDS TO BE KEPT FOR NOW. JUST DONT USE THE WORD IN ADDITIONAL CONTENT AND COPY

---

## 1. Colour — property-scoped accents

Keep `--background` / `--foreground` as B&W globally. Introduce two scoped token sets that only activate inside `/town/*` and `/country/*` route trees (via a `data-property="town|country"` attribute on the layout wrapper). Components keep using semantic tokens; the values swap by scope.

**Town — glamour, after-hours, townhouse**

- Moonless Night `#0F1418` (deep ink base)
- Red Inferno `#B0271E` (signature accent)
- Aubergine Gleam (deep plum support)
- Potters Clay (warm orange highlight)
- Coffee Bean (rich brown neutral)
- Gold Coast (rare metallic accent — buttons, seals)

**Country — nostalgic, garden, wild luxe**

- Moonless Night `#0F1418` (shared anchor)
- Pesto `#4A7E39` (signature accent)
- Copper Brown (warm support)
- Desert Mirage (sand neutral)
- Midnight Rose `#6A0409` (rare deep accent)

The homepage, `/curious`, Bear's Den, members, journal, gallery, footer stay pure B&W — they're the cross-brand layer.

## 2. Typography — no changes, light additions

Bowlby + Space Grotesk + Space Mono already match the deck's bold/editorial register. Two small additions:

- Allow an **italic serif** (e.g. PP Editorial / Instrument Serif) for handwritten-style pull quotes ("You look like trouble", "8ish") — used sparingly, only on Town pages and journal posts
- A **brush/marker script** as an image asset only (not a webfont) for poster-style overlays — matches the "Garden Groove" / "Pop Up Party" collateral

## 3. Tone of voice — recalibrate "Bears Den"

Current voice is short, staccato, confident — good foundation, but currently a touch cold and slightly nightclub. The deck explicitly says **not** nightclub-heavy, not gimmicky, not overly luxurious. Shift the dial:

- Keep: punchy, short lines, confident, irreverent
- Add: warmth, welcome, dry wit, understatement, references to 33-year history
- Drop from copy across the site: *decadent, indulgent, hidden gem, unforgettable, hedonistic, exclusive, vibrant atmosphere, luxury escape, escape, "fear not", "we got you covered"*

**Rewrites to schedule** (audit pass, not destroy):

- Hero subtitles on `/town`, `/country`, `/town/karaoke`, `/town/food/*`, `/country/food/*`
- Bear's Den / Gold subscription copy ("25% off everywhere" is on-brand; "membership" framing already aligned)
- Footer subscribe line
- House Rules pages (deck supplies a finished set — see §6)

## 4. Photography & imagery — yes, use the deck

The deck imagery (event shots, door hanger, champagne button, neon karaoke, disco ball in water, vinyl, fire pit, fur coats, balloon) is on-brand reference material and can be brought into the site. Recommended use:

- **Town hero carousel**: swap to glamour/after-hours frames (champagne button, late checkout phone, neon karaoke, red door hanger)
- **Country hero carousel**: nostalgic/garden frames (fire pit + string lights, vinyl, long table, disco ball in dark)
- **Karaoke page**: lean into the neon + disco ball assets — already fits
- **Journal / Stories**: Nick Tucker event photography becomes the house photo style
- **Social / OG images**: the "SUGGESTIVE NOT EXPLICIT / GLAMOUR NOT GARISH / TASTEFUL NOT TACKY" triptych is a great share card
- **Visual motifs as SVG/PNG accents**: wax seal "B", three-lips illustration, martini trio, bear-in-crown mark — usable as section dividers, loading marks, button stamps

Caveat: the deck is a mood board. Several images are sourced references (Rodial, Almost Friday, Chateau Marmont note, Studio 54 poster) — those are **inspiration only**, not for direct publication. Safe to use: anything credited to Nick Tucker, generic textures, and any Crazy Bear property shots. I'd recommend a quick rights pass before pushing the mood images live; happy to flag each one.  
  
IGNORE RIGHTS ISSUES FOR NOW.THIS IS DRAFT NOT FOR PUBLIC.CAN YOU SOURCE ADDITIONAL SIMILAR IMAGERY ONLINE SO WE ARE NOT RESTRICTED PLEASE - STRICT KEEP ON TEH STYLEING OF TEH IMAGERY THO

## 5. New visual components to introduce

Small, additive — no existing component gets destroyed:

- **PropertyAccentBar** — thin top rule in the property's signature colour, replaces the current white/black hairline inside `/town` and `/country`
- **PressForChampagne button variant** — ornate gold-framed CTA, used once per Town page (booking, concierge)
- **DoorHangerCard** — vertical card with a tassel motif, for "Late Checkout", "Do Not Disturb", "Press for Champagne" feature blocks
- **PosterTile** — bold-type event poster style for What's On entries (matches Sunday Club / Shrimp Party / Garden Groove collateral)
- **WaxSealMark** — small "B" wax seal as a section terminator
- **PullQuoteSerif** — italic serif pull-quote block for editorial moments

## 6. House Rules — adopt the deck's set

The deck supplies a finished, on-brand House Rules list ("Read once. Never think twice."). Replace the current Karaoke HouseRules copy and the standalone `/house-rules` page with this canonical set, styled as a numbered editorial list on Moonless Night.  
  
LEAVE KARAOKE AS A STANDALONE PIECE OF DESIGN. DO NOT CHANGE. DO NOT CHANGE TEH HOUSE RULES PAGE EITHER. THE PUB PAGES USE THE NEW COUNTRY COLOUR PALLETE, KEEP PAGE STRUCTURE

## 7. Naming conflict to resolve

The current room-type taxonomy is **Snug / Cosy / Boujee / Decadent**. "Decadent" is on the brand's words-to-avoid list. Suggested rename of that single tier — options to choose from: **Grand, Lavish, Hideaway, Suite, Headliner, Top Floor**. This needs your call before we touch the room pages, nav data, and CMS.

## 8. Rollout — staged, non-destructive

```text
Phase 1  Tokens + scope    Add Town/Country token sets, scope wrapper, no visual change yet
Phase 2  Town pages        Apply Town palette + new motifs to /town tree
Phase 3  Country pages     Apply Country palette + nostalgia imagery to /country tree
Phase 4  TOV audit         Rewrite hero/sub copy site-wide against the new word list
Phase 5  House Rules       Replace with deck-canonical set
Phase 6  Photography swap  Carousels, journal, social cards
Phase 7  Room rename       Resolve "Decadent" + update CMS + nav data
```

Each phase is independently shippable and reversible.

---

## Technical notes

- Token scoping uses `[data-property="town"] { --primary: ... }` blocks in `index.css`. No tailwind config change needed — semantic tokens already map through HSL.
- New colours must be added as HSL triplets to keep with project convention.
- Property scope wrapper goes in the `town/` and `country/` layout components (already exist).
- Deck images extracted to `parsed-documents://...` — for live use, copy chosen ones into `src/assets/brand-2026/` and import as ES6 modules; carousel data files (`src/data/heroCarousels.ts`) get the new entries.
- CMS: any new page or rename (room type) will need matching CMS editing surfaces per project rules.
- All copy edits will use Anglicised spellings, £ only, no em dashes.

## Open questions for you

1. Approve property-scoped colour (Town red/aubergine, Country pesto/copper) — or keep one global palette?
2. Pick a replacement for the "Decadent" room tier.
3. Confirm we can use the Nick Tucker event photography from the deck on the live site (rights).
4. Want me to start with Phase 1+2 (Town) as the first build, or audit copy site-wide first?