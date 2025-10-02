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

  const scan = useCallback((reason = 'scheduled') => {
    const isNative = Capacitor.isNativePlatform();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = Math.round(vw / 2);
    const cy = Math.round(vh / 2);

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
    if (disabledFixed > 0 || overlayFixed > 0) {
      console.warn(`[InteractionWatchdog] Scan complete (${reason}):`, {
        disabledFixed,
        overlayFixed
      });
    }
  }, []);

  useEffect(() => {
    // Initial scan after page settles
    const initialScan = setTimeout(() => scan('initial'), 300);
    
    // Extra scan to catch PWA banners and late-mounted overlays
    const lateScan = setTimeout(() => scan('late-mount-check'), 2500);
    
    // Re-scan on resize
    const handleResize = () => scan('resize');
    window.addEventListener('resize', handleResize);
    
    // MutationObserver to catch new fixed/absolute full-viewport elements
    const observer = new MutationObserver((mutations) => {
      let shouldRescan = false;
      
      for (const mutation of mutations) {
        // Check added nodes for large fixed elements
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as HTMLElement;
            const cs = getComputedStyle(el);
            
            // Check if it's a large fixed element
            if ((cs.position === 'fixed' || cs.position === 'absolute')) {
              const rect = el.getBoundingClientRect();
              const vw = window.innerWidth;
              const vh = window.innerHeight;
              const area = rect.width * rect.height;
              const viewportArea = vw * vh;
              
              if (area > viewportArea * 0.15) {
                shouldRescan = true;
                break;
              }
            }
            
            // Check for transition overlay attribute
            if (el.hasAttribute('data-transition-overlay')) {
              shouldRescan = true;
              break;
            }
          }
        }
        
        // Check attribute changes for transition overlay
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'data-transition-overlay') {
          shouldRescan = true;
        }
        
        if (shouldRescan) break;
      }
      
      if (shouldRescan) {
        scan('mutation-detected');
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-transition-overlay']
    });
    
    return () => {
      clearTimeout(initialScan);
      clearTimeout(lateScan);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [location.pathname, scan]);

  return null;
}
