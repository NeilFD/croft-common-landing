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

    // 2. ONLY clean up stuck transition overlays - nothing else
    // Very conservative opacity threshold to avoid false positives
    const opacityThreshold = 0.05;
    let overlayFixed = 0;

    // Interactive element safelist - NEVER disable these
    const interactiveTags = new Set([
      'A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL',
      'VIDEO', 'AUDIO', 'DETAILS', 'SUMMARY'
    ]);

    // Only check for transition overlays specifically
    const transitionOverlays = document.querySelectorAll('[data-transition-overlay]');
    
    for (const el of transitionOverlays) {
      const he = el as HTMLElement;
      
      // Skip if already disabled
      const cs = getComputedStyle(he);
      if (cs.pointerEvents === 'none') continue;

      // Safety guard: never touch interactive elements or their ancestors
      if (interactiveTags.has(he.tagName)) continue;
      if (he.querySelector('button, a, input, select, textarea')) continue;

      const opacity = parseFloat(cs.opacity || '1');
      
      // Only disable if genuinely invisible
      if (opacity < opacityThreshold || cs.visibility === 'hidden') {
        he.style.pointerEvents = 'none';
        if (isNative) {
          he.style.touchAction = 'none';
        }
        he.setAttribute('data-debug-neutralised', 'transition-overlay');
        overlayFixed++;
        console.warn('[InteractionWatchdog] Fixed stuck transition overlay');
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
