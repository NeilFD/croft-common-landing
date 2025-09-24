import { useCallback, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Route-local guard to neutralise invisible, large overlays that block interactions.
 * Enhanced heuristic: detects elements with misleading cursor styles and large coverage.
 */
export default function DeadZoneGuard() {
  const scan = useCallback(() => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = Math.round(vw / 2);
    const cy = Math.round(vh / 2);

    // Enhanced point sampling including center and watermark zone
    const points = [
      [cx, cy],
      [Math.round(vw * 0.25), cy],
      [Math.round(vw * 0.75), cy],
      // Additional vertical band around watermark zone
      [cx, Math.round(vh * 0.35)],
      [cx, Math.round(vh * 0.65)],
      [Math.round(vw * 0.4), Math.round(vh * 0.5)],
      [Math.round(vw * 0.6), Math.round(vh * 0.5)],
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
        const isNative = Capacitor.isNativePlatform();
        
        // Use different thresholds for native vs desktop
        const coverageThreshold = isNative ? 0.15 : 0.25;
        const opacityThreshold = isNative ? 0.15 : 0.05;
        
        const coversMajority = area > viewportArea * coverageThreshold;
        const nearlyInvisible = parseFloat(cs.opacity || '1') <= opacityThreshold || cs.visibility === 'hidden';
        const hasMisleadingCursor = cs.cursor === 'pointer' && 
          !he.onclick && 
          !he.getAttribute('href') && 
          !he.getAttribute('role')?.includes('button');

        // Enhanced detection: large + (invisible OR misleading cursor)
        if (coversMajority && (nearlyInvisible || hasMisleadingCursor)) {
          he.style.pointerEvents = 'none';
          
          // Apply additional native-specific fixes
          if (isNative) {
            he.style.touchAction = 'none';
            (he.style as any).webkitTouchCallout = 'none';
            (he.style as any).webkitUserSelect = 'none';
            if (nearlyInvisible) {
              he.style.visibility = 'hidden';
              he.style.transform = 'translateZ(-1px)';
            }
            console.warn('[DeadZoneGuard] Applied native-specific fixes to element:', he);
          }
          
          he.setAttribute('data-debug-neutralised', hasMisleadingCursor ? 'misleading-cursor' : 'invisible');
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
