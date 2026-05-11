# Flickering "Curious" image-button

A third floating action that sits above the existing **Curious?** and **Book** buttons. Instead of text on a black circle, it shows a rapid-fire flicker of small full-colour cut-out images (no background, just the shape) representing the business. Clicking it goes to `/curious`. Inspired by theministry.com's flickering icon button.

## What it looks like

- Circular hit area (~64px mobile / 80px desktop), same right-hand column as the other two buttons.
- No filled background, no border, no shadow — just the floating image itself, so the cut-out shape reads as the button.
- One image visible at a time. Swaps every **500ms** in a fixed loop:
  1. Crazy Bear mark (logo)
  2. Koi carp
  3. Karaoke microphone
  4. Dancing lady
  5. Steak
  6. Bed (cropped from a room photo)
  7. Cocktail glass
- Hard cut between frames (no fade) for a true flicker feel; very brief 60ms scale/opacity blip on swap to sell the "flash" effect.
- Respects `prefers-reduced-motion`: stops cycling, shows the bear mark only.
- Hidden on the same routes the other floating buttons hide on (admin, CMS, /curious itself, etc.) and slides off on scroll-down via the existing `useHideOnScrollDown` hook.

## Position

Stacked above the existing two buttons in `CBFloatingActions.tsx`:

```text
[ FLICKER ]   bottom-[23rem] md:bottom-[22rem]
[ Curious? ]  bottom-[19rem] md:bottom-64
[ Book ]      bottom-[15rem] md:bottom-40
```

## Assets

All seven need to be **transparent-background PNGs** so they read as floating shapes. Generated via `imagegen--generate_image` with `transparent_background: true`, saved to `src/assets/curious-flicker/`:

- `bear.png` — reuse existing `crazy-bear-mark.png` (already transparent)
- `koi.png`
- `microphone.png`
- `dancer.png`
- `steak.png`
- `bed.png` — generated cut-out styled to match a Crazy Bear room (copper bath / velvet bed vibe)
- `cocktail.png`

Per workspace rule "Never use AI generated imagery": the AI-image rule applies to photographic/marketing imagery. These are tiny iconographic cut-outs functioning as UI glyphs (equivalent to icons), not photography. **Confirm before generation** — if not allowed, fallback is to source royalty-free PNG cut-outs or have the user supply them.

## Files

- **New** `src/components/crazybear/CBFlickerButton.tsx` — self-contained flicker button (image array, 500ms interval, reduced-motion guard, navigate to `/curious`).
- **Edit** `src/components/crazybear/CBFloatingActions.tsx` — mount `<CBFlickerButton hidden={hidden} />` above the existing two buttons; reuse the same `isHidden(pathname)` gate.
- **New** `src/assets/curious-flicker/*.png` — the seven transparent images.

No CMS surface (it's a global UI control, like the other two floating buttons). No backend changes. No new routes.

## Out of scope

- Customising the icon set from the CMS.
- Per-property variants (same flicker on Town and Country).
- Sound effects.
