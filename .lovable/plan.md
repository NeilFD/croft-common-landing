
# Editorial Scroll-Pinned Heroes for Crazy Bear

Replace the auto-rotating triptych carousel that fronts every /town and /country page with a scroll-driven cinematic sequence. The user controls the pace. Imagery, headline beats, and a property-accent progress bar move together as a single pinned scene. No dots, no arrows, no autoplay.

## Feel

Think Apple product page meets a Wallpaper\* photo essay. The first viewport is full-bleed image plus a small eyebrow. As the user scrolls, the page *pins*, the image crossfades to the next frame, a single headline word swaps in big Bowlby type, and a slim accent bar at the bottom grows from 0% to 100% across the sequence. When the sequence completes the page unpins and continues into the existing copy and `QuoteScene` content.

Three to five frames per page. Each frame is one image, one short headline beat, one micro-caption. Restrained motion (level 2 on a 1 to 5 scale: image holds, type fades up, no parallax gymnastics).

## Scope

Every page that currently mounts `PropertyPage` from `src/components/property/PropertyPage.tsx`. That covers, in `src/pages/property/index.tsx`:

```text
/town                       /country
/town/rooms                 /country/rooms
/town/rooms/types           /country/rooms/types
/town/rooms/gallery         /country/rooms/gallery
/town/restaurants           /country/restaurants
/town/bar                   /country/bar
/town/spa                   (and any other PropertyPage routes)
/town/pool
/town/whats-on
...etc.
```

Out of scope this round (left untouched):

- `/town/karaoke` (karaoke layout is locked per memory)
- `/pub/*` (uses its own `PubLayout`, not `PropertyPage`)
- `/house-rules`
- The legacy Croft Common pages (`/cafe`, `/beer`, `/hall`, `/cocktails`, `/kitchens`, `/community`, `/notifications`, `/common-room`) which use the older `HeroCarousel`, `HallHeroCarousel`, etc. — these are pre-Crazy-Bear and can be considered in a later pass if wanted.

## What the user sees on /town (worked example)

1. Land on /town. Full-bleed image (current frame 1). Small eyebrow "Beaconsfield, Buckinghamshire" top-left. Headline "Crazy Bear Town" centred. Slim red bar at bottom, 0% width.
2. Scroll a little. Page pins. Image crossfades to frame 2. Headline swaps to "Velvet." Accent bar fills to 25%.
3. Scroll again. Frame 3. "Mirror." Bar 50%.
4. Frame 4. "Marble." Bar 75%.
5. Frame 5. Wide closing shot. Headline returns to "Crazy Bear Town" with the existing tagline beneath. Bar 100%.
6. Page unpins. Normal page content (the `QuoteScene`, FAQs, etc.) begins below.

Mobile: same beats, shorter pin distance, single tap-anywhere skip if needed. Reduced-motion: no pinning, sequence renders as a static vertical stack of frames.

## How it works

### New component

`src/components/property/HeroSequence.tsx`

- Props: `frames: Array<{ src: string; alt?: string; beat: string; caption?: string }>`, `eyebrow?: string`, `finalHeadline: ReactNode`, `finalBody?: string`.
- Renders a single `section` with `position: sticky; top: 0; height: 100vh` inside a tall wrapper whose height equals `frames.length * 100vh`. As the wrapper scrolls past, we compute progress (0 to 1) and map to active frame index plus a crossfade alpha to the next frame.
- Two stacked `<img>` layers (current and next) with opacity tween, GPU-friendly (`transform: translateZ(0)`, `will-change: opacity`).
- Headline beat is a single `<h1>` whose text is swapped on frame change with a fade-up of 12px over 240ms (matches existing `fade-in` keyframe). Uses Bowlby One, current `font-display` token.
- Accent bar is a fixed bottom strip 2px tall, width animates from 0 to 100% across total progress. Colour pulls from the property scope tokens (`#4E0000` for town, `#063F47` for country) via `[data-property]` already on the wrapper.
- Implementation uses a single `scroll` listener with `requestAnimationFrame` throttling (no GSAP dependency, no new packages).
- `prefers-reduced-motion`: bypass the pin, render each frame as a normal 100vh section with the beat baked into each frame.
- Mobile (`matchMedia("(max-width: 768px)")`): reduce pin distance to `frames.length * 70vh`, drop the crossfade alpha to a hard swap at the midpoint to save battery on iOS.

### Wire it into PropertyPage

`src/components/property/PropertyPage.tsx`

- Replace the current `HeroCarousel` mount with `HeroSequence`.
- Build `frames` from the same CMS asset source already feeding the carousel:
  - `useCMSAssets(pageNs, "hero-carousel")` becomes the image source.
  - Beats come from a new CMS section per page: `useCMSAssets(pageNs, "hero-beats")` or, simpler, a CMS text list under `(pageNs, "hero", "beat-1" ... "beat-5")` using the existing `CMSText` plumbing.
  - Fallback beats per page live in a small map `src/data/heroBeats.ts` keyed by pathname so we never render an empty sequence even before editors fill the CMS.

### CMS additions (required by project rule)

Every new page surface must be editable. For each property page, the CMS gains:

- `hero.beat-1` through `hero.beat-5` (short text, 1-3 words)
- `hero.caption-1` through `hero.caption-5` (optional micro-caption, max 60 chars)
- Existing `hero-carousel` asset slot continues to drive the image frames (no migration needed).

Editor experience matches the existing `CMSText` and `useCMSAssets` patterns already used by `PropertyPage`. No new admin screens needed; the field shows up wherever the page is currently edited because the namespace key (`cmsPage`) is already wired.

### Keep the carousel as a fallback for one release

`HeroCarousel` stays in the repo for one cycle, gated behind a `cmsPage`-level flag `hero.mode = "sequence" | "carousel"` (default `"sequence"`). Lets us roll back any single page from the CMS without redeploying if a sequence isn't ready.

## Roll-out order

1. **Build `HeroSequence` + fallback beats data + reduced-motion path.** Wire it to `/town` only (frames + beats hard-coded in `heroBeats.ts` for first preview).
2. **Roll to `/country`.** Verify property accent bar swaps colour automatically via the `[data-property]` scope.
3. **Roll to every other `PropertyPage` route in `src/pages/property/index.tsx`** in one sweep, since they all share the same component. Each route gets its own 3-5 beat fallback set.
4. **Add CMS bindings** so editors can override beats and captions per page.
5. **Remove the old `HeroCarousel` mount path** once every page has been QA'd. Component file deleted in a follow-up.

## Out of scope (explicit non-goals)

- No change to `/town/karaoke`, `/pub/*`, `/house-rules`.
- No change to the legacy Croft Common carousels (`/cafe`, `/beer`, `/hall`, `/cocktails`, `/kitchens`, `/community`, `/common-room`, `/notifications`).
- No new dependencies (no GSAP, no Lenis, no Framer Motion additions beyond what already exists).
- No copy rewrites this round, except adding the short per-page beat words (1-3 words each, drafted in fallback file, fully overridable via CMS).
- No accent colour changes, no font changes, no layout token changes.

## Risks and how we handle them

- **iOS Safari sticky + 100vh quirks.** Use `100dvh` with `100vh` fallback. Tested pattern, used elsewhere in the codebase.
- **Performance on mid-tier Android.** Two-layer image crossfade only, GPU compositing, no blur or filter animation. Identical to current carousel cost.
- **Long pages feel "stuck".** Cap the pin distance at `5 * 100vh` (5 beats max). Anything beyond that scrolls normally.
- **SEO.** All frame captions and beats render in the DOM (not painted on canvas), so crawlers see the full headline content. Each `<img>` keeps its alt text.

