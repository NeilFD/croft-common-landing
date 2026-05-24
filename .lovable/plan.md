# Keep the Town/Country header tinted but never fully solid

## Problem
On `/town` and `/country` the header strip currently ramps from 30% accent + blur (over the hero) to 100% accent (once scrolled). The scrolled state loses the photographic interplay and reads as a flat red/teal bar.

## Fix
Inside the property scope, drop the "solid on scroll" behaviour. Keep `backdrop-blur-md` on at all times and only nudge the accent alpha up slightly when scrolled, so the bar stays glassy but reads a touch firmer once you're past the hero.

Proposed opacities (Red Inferno `#4E0000` / Abyssal Teal `#063F47`):
- Over hero: ~30% alpha (`4D`) — same as now
- Scrolled:  ~55% alpha (`8C`) — denser, still see-through, blur carries it

Global (non-property) pages are unaffected — they keep the existing B&W frosted-to-solid behaviour.

## Files touched
- `src/components/crazybear/CBTopNav.tsx` — only the backdrop-strip styling for the `accent` branch. Logo, wordmark, links, and CTA stay as they are.

## Out of scope
- Footer tinting (unchanged)
- Any change to `index.css` tokens or the global shell
- Karaoke / house-rules pages (left alone per memory)
