import { useCallback, useEffect } from 'react';

/**
 * Route-local guard to neutralise invisible, large overlays that block interactions.
 * Heuristic: fixed/absolute, pointer-events not none, opacity <= 0.05, covering >50% viewport.
 */
export default function DeadZoneGuard() {
  const scan = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = Math.round(vw / 2);
    const cy = Math.round(vh / 2);

    const points = [
      [cx, cy],
      [Math.round(vw * 0.25), cy],
      [Math.round(vw * 0.75), cy],
    ];

    const neutralised: Element[] = [];

    for (const [x, y] of points) {
      const stack = document.elementsFromPoint(x, y);
      for (const el of stack) {
        const he = el as HTMLElement;
        if (!he) continue;
        const cs = getComputedStyle(he);
        if (cs.pointerEvents === 'none') continue;
        if (!(cs.position === 'fixed' || cs.position === 'absolute')) continue;

        const rect = he.getBoundingClientRect();
        const area = rect.width * rect.height;
        const viewportArea = vw * vh;
        const coversMajority = area > viewportArea * 0.5;
        const nearlyInvisible = parseFloat(cs.opacity || '1') <= 0.05 || cs.visibility === 'hidden';

        if (coversMajority && nearlyInvisible) {
          he.style.pointerEvents = 'none';
          he.setAttribute('data-debug-neutralised', 'true');
          neutralised.push(he);
          break; // Next point
        }

        // Special check for stuck transition overlays
        if (he.hasAttribute('data-transition-overlay') && cs.pointerEvents !== 'none') {
          const opacity = parseFloat(cs.opacity || '1');
          if (opacity < 0.1) {
            console.warn('[DeadZoneGuard] Found stuck transition overlay, neutralising');
            he.style.pointerEvents = 'none';
            he.setAttribute('data-debug-neutralised', 'transition-overlay');
            neutralised.push(he);
            break;
          }
        }
      }
    }

    if (neutralised.length) {
      console.warn('[DeadZoneGuard] Neutralised overlay(s):', neutralised);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(scan, 300);
    window.addEventListener('resize', scan);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', scan);
    };
  }, [scan]);

  return null;
}
