## The real problem

Every page calls `<CBTopNav tone="light" | "dark" />` and the tone is a guess made once at author-time. The nav itself is `position: absolute` over a hero image whose brightness varies wildly (dark Crazy Bear bedrooms, bright daytime exteriors, busy carousels). A soft 120px gradient scrim is the only fallback. So:

- Dark hero + `tone="dark"` (black text) → invisible (your screenshot)
- Bright hero + `tone="light"` (white text) → invisible
- Once the page scrolls, the nav sits over arbitrary content with no scrim at all

Static tone props will never solve this. World-class implementations (Apple, Aesop, Hermès, Airbnb, Soho House) all use the same core pattern:

> **The nav adapts to whatever is behind it, in real time, with a guaranteed-legible fallback. The author never picks a tone.**

## The fix — three layers, applied site-wide

### Layer 1 — Adaptive contrast (the smart bit)

A new `useNavContrast()` hook decides "light" vs "dark" tone on its own, per page, per scroll position:

- On every route change and every scroll, sample the pixel luminance directly behind the nav (the top ~120px strip of the hero/page).
- For hero images that are CMS-driven, we already have the source — we compute average luminance once per image via an offscreen canvas, cache it by URL, and store it. No per-frame sampling needed for the static case.
- For pages with no hero (members, set-password, journal post body once scrolled), default to "dark" (black text on light background).
- Result: `tone` becomes derived state, not a prop. The 21 hardcoded `tone="light"` / `tone="dark"` calls all get removed.

### Layer 2 — Bullet-proof legibility primitive (the safety net)

Even adaptive tone fails on edge cases — half-and-half images, busy carousels mid-transition, bright cushions next to dark velvet (your screenshot). So the nav itself gets a permanent legibility treatment that works on **any** background, taken straight from the Apple / Hermès playbook:

- **Backdrop blur capsule**, not a gradient scrim. The nav lives inside a `backdrop-blur-md` strip with a faint tinted overlay (`bg-white/40` in dark tone, `bg-black/40` in light tone). Frosted-glass effect, always readable, never opaque enough to look like a corporate header.
- **Text shadow on both tones**, not just light. `0 1px 8px` of the opposite-tone color at low opacity. Invisible on flat backgrounds, lifesaver on photo edges.
- **No more gradient scrim** — replaced by the blur strip which is a fixed thin band, not a 120px wash that fights the hero image.

This is the brand-safe version of what you see on apple.com when you scroll over white product shots: the nav stays present without ever feeling like a heavy bar.

### Layer 3 — Scroll-aware solidification

After the user scrolls past the hero (~60px), the nav transitions to its "solid" state:

- Dark tone pages → solid white background, black text, hairline bottom border
- Light tone pages → solid black background, white text, hairline bottom border
- Smooth 200ms transition, no layout shift (nav is `fixed` not `absolute` once past threshold)

This is the only state where the nav is truly opaque — and it only happens once the hero is out of view, so it never competes with hero imagery.

## What changes in code

```text
src/hooks/useNavContrast.ts         NEW — luminance sampling + scroll state
src/lib/imageLuminance.ts           NEW — canvas-based average brightness, cached
src/components/crazybear/CBTopNav.tsx
                                    - remove `tone` prop (now derived)
                                    - replace gradient scrim with backdrop-blur capsule
                                    - add scroll-aware solid state
                                    - add text-shadow on both tones
src/components/crazybear/CBStaticPage.tsx    remove tone="light"
src/components/property/PropertyLayout.tsx   remove tone="dark"
src/pages/Landing.tsx                        remove tone
src/pages/HouseRules.tsx                     remove tone
src/pages/crazybear/About.tsx                remove tone
src/pages/crazybear/BearsDen.tsx             remove tone
src/pages/crazybear/GiftVouchers.tsx         remove tone
src/pages/crazybear/JournalPost.tsx          remove tone (3 instances)
src/pages/crazybear/Members.tsx              remove tone
src/pages/crazybear/SetPassword.tsx          remove tone
src/pages/crazybear/Stories.tsx              remove tone
src/pages/crazybear/StoryDetail.tsx          remove tone (3 instances)
src/pages/crazybear/WhatsOn.tsx              remove tone
src/pages/crazybear/WhatsOnDetail.tsx        remove tone (3 instances)
```

No CMS work, no new pages, no design-system colour changes. The nav stays minimal B&W and Bears Den.

## What you'll see after

- Open `/town` (your screenshot): nav text auto-flips to white because hero is dark, plus a faint frosted strip behind it. Readable on every carousel slide.
- Open `/country` mid-day shot: stays dark text with frosted white strip.
- Scroll down on any page: nav crisps into a solid bar, exactly like apple.com.
- New pages added later: no tone decision needed. The nav handles itself.

## One question before I build

Do you want the scrolled-state solid bar to be **white-on-black** site-wide (more dramatic, Apple keynote energy) or **adaptive** (white bar on dark-tone pages, black bar on light-tone pages, matching the hero tone)?
