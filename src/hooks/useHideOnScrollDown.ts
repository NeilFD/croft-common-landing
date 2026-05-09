import { useEffect, useRef, useState } from 'react';

/**
 * Hide-on-scroll-down / show-on-scroll-up hook.
 * Mobile only — desktop returns `false` (never hidden).
 *
 * - threshold: minimum px delta before toggling (debounces jitter)
 * - topOffset: always show when window.scrollY is below this value
 */
export function useHideOnScrollDown(threshold = 10, topOffset = 80): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 767px)');
    if (!mq.matches) return; // desktop: never hide

    lastY.current = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY.current;
        if (y < topOffset) {
          setHidden(false);
        } else if (delta > threshold) {
          setHidden(true);
        } else if (delta < -threshold) {
          setHidden(false);
        }
        lastY.current = y;
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold, topOffset]);

  return hidden;
}

export default useHideOnScrollDown;
