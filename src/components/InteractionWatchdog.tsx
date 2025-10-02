import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';

/**
 * Consolidated interaction guard that removes disabled attributes from non-form elements
 * and neutralises invisible overlays that block interactions.
 * Combines InteractionWatchdog and DeadZoneGuard functionality.
 */
export default function InteractionWatchdog() {
  const location = useLocation();

  const scan = useCallback(() => {
    const isNative = Capacitor.isNativePlatform();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = Math.round(vw / 2);
    const cy = Math.round(vh / 2);
    
    console.log(`[InteractionWatchdog] Starting scan (${isNative ? 'NATIVE' : 'DESKTOP'} mode)`);

    // 1. Remove stray disabled attributes from non-form elements
    const allowed = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'FIELDSET']);
    const disabledNodes = Array.from(document.querySelectorAll('[disabled]')) as HTMLElement[];
    let disabledFixed = 0;

    for (const el of disabledNodes) {
      if (!allowed.has(el.tagName)) {
        el.removeAttribute('disabled');
        disabledFixed++;
      }
    }

    // 2. Check for large invisible overlays and problematic elements
    const probePoints = [
      // Center 3x3 grid
      [cx - 50, cy - 50], [cx, cy - 50], [cx + 50, cy - 50],
      [cx - 50, cy], [cx, cy], [cx + 50, cy],
      [cx - 50, cy + 50], [cx, cy + 50], [cx + 50, cy + 50],
      // Additional coverage
      [Math.round(vw * 0.25), cy],
      [Math.round(vw * 0.75), cy],
      [cx, Math.round(vh * 0.35)],
      [cx, Math.round(vh * 0.65)]
    ];

    const processedElements = new Set<HTMLElement>();
    let overlayFixed = 0;

    // Unified opacity threshold
    const opacityThreshold = isNative ? 0.15 : 0.1;

    for (const [x, y] of probePoints) {
      const stack = document.elementsFromPoint(x, y);
      
      for (const el of stack) {
        const he = el as HTMLElement;
        if (!he || processedElements.has(he)) continue;
        
        const cs = getComputedStyle(he);
        if (cs.pointerEvents === 'none') continue;

        const rect = he.getBoundingClientRect();
        const area = rect.width * rect.height;
        const viewportArea = vw * vh;
        const coverageThreshold = isNative ? 0.15 : 0.25;
        
        const isLarge = area > viewportArea * coverageThreshold;
        const isFixed = cs.position === 'fixed' || cs.position === 'absolute';
        const nearlyInvisible = parseFloat(cs.opacity || '1') <= opacityThreshold || cs.visibility === 'hidden';
        const hasMisleadingCursor = cs.cursor === 'pointer' && 
          !he.onclick && 
          !he.getAttribute('href') && 
          !he.getAttribute('role')?.includes('button');

        // Fix large invisible overlays or misleading cursor elements
        if ((isLarge && isFixed && nearlyInvisible) || (nearlyInvisible && hasMisleadingCursor)) {
          processedElements.add(he);
          he.style.pointerEvents = 'none';
          
          // Simplified native fixes - less aggressive
          if (isNative && nearlyInvisible) {
            he.style.touchAction = 'none';
          }
          
          he.setAttribute('data-debug-neutralised', hasMisleadingCursor ? 'misleading-cursor' : 'invisible-overlay');
          overlayFixed++;
          console.warn('[InteractionWatchdog] Neutralised element:', {
            tag: he.tagName,
            reason: hasMisleadingCursor ? 'misleading-cursor' : 'invisible-overlay',
            opacity: cs.opacity,
            cursor: cs.cursor
          });
          break; // Move to next probe point
        }

        // Check for stuck transition overlays
        if (he.hasAttribute('data-transition-overlay')) {
          const opacity = parseFloat(cs.opacity || '1');
          if (opacity < opacityThreshold && cs.pointerEvents !== 'none') {
            processedElements.add(he);
            he.style.pointerEvents = 'none';
            if (isNative) {
              he.style.touchAction = 'none';
            }
            he.setAttribute('data-debug-neutralised', 'transition-overlay');
            overlayFixed++;
            console.warn('[InteractionWatchdog] Fixed stuck transition overlay');
            break;
          }
        }
      }
    }

    // Log summary
    if (disabledFixed > 0) {
      console.warn(`[InteractionWatchdog] Removed ${disabledFixed} stray disabled attribute(s)`);
    }
    if (overlayFixed > 0) {
      console.warn(`[InteractionWatchdog] Fixed ${overlayFixed} blocking element(s)`);
    }
  }, []);

  useEffect(() => {
    // Run scan after a short delay to let the page settle
    const timeoutId = setTimeout(scan, 300);
    
    // Re-scan on resize
    window.addEventListener('resize', scan);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', scan);
    };
  }, [location.pathname, scan]);

  return null;
}
