# Auto-hide floating actions on mobile scroll

Apply the Instagram / Material pattern: hide the floating Curious?, Book and Spotify buttons on **scroll down**, reveal on **scroll up**. Mobile only — desktop keeps them static.

## Behaviour

- Threshold: hide only after scrolling **down** more than 10px past the previous position
- Reveal immediately on any **upward** scroll movement
- Always visible when `window.scrollY < 80` (top of page)
- Animation: slide off the right edge with `translate-x-[120%]`, 300ms ease
- Mobile only (`md:` breakpoint and below). On desktop the buttons never hide.
- Honour `prefers-reduced-motion`: skip the transform, just stay visible
- Applies uniformly to Curious?, Book **and** the Spotify widget so all three floating elements move together

## Implementation

### 1. New shared hook: `src/hooks/useHideOnScrollDown.ts`

```ts
import { useEffect, useState, useRef } from 'react';

export function useHideOnScrollDown(threshold = 10, topOffset = 80) {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    if (!isMobile) return; // desktop never hides

    lastY.current = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (y < topOffset) setHidden(false);
        else if (delta > threshold) setHidden(true);
        else if (delta < -threshold) setHidden(false);
        lastY.current = y;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, topOffset]);

  return hidden;
}
```

### 2. Wire into `CBFloatingActions.tsx`

Wrap both buttons in a container that applies `translate-x-[120%]` when `hidden`, with `transition-transform duration-300 ease-out motion-reduce:transition-none motion-reduce:translate-x-0`. Each button keeps its existing `bottomClass` — only the horizontal transform changes.

### 3. Wire into `CBSpotifyPlayer.tsx`

Same hook, same transform on the player container. Keeps the three floating elements visually coordinated.

## Out of scope

- No change to the `HIDDEN_PREFIXES` route logic (forms still hide them entirely)
- No change to desktop behaviour
- No change to button positions, sizes or styling
