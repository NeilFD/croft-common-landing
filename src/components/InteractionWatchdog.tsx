import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Removes stray disabled attributes from non-form elements to prevent accidental click-blocking overlays
export default function InteractionWatchdog() {
  const location = useLocation();

  useEffect(() => {
    const allowed = new Set(['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'OPTION', 'FIELDSET']);
    const nodes = Array.from(document.querySelectorAll('[disabled]')) as HTMLElement[];
    let fixed = 0;

    for (const el of nodes) {
      if (!allowed.has(el.tagName)) {
        el.removeAttribute('disabled');
        fixed++;
      }
    }

    // Check for stuck high z-index overlays that might be blocking interactions
    const overlays = Array.from(document.querySelectorAll('[data-transition-overlay]')) as HTMLElement[];
    let overlayFixed = 0;
    
    for (const overlay of overlays) {
      const styles = getComputedStyle(overlay);
      const opacity = parseFloat(styles.opacity || '1');
      const pointerEvents = styles.pointerEvents;
      
      // If overlay is nearly invisible but still has pointer events, fix it
      if (opacity < 0.1 && pointerEvents !== 'none') {
        overlay.style.pointerEvents = 'none';
        overlayFixed++;
        console.warn('[InteractionWatchdog] Fixed stuck transition overlay');
      }
    }

    if (fixed > 0) {
      console.warn(`[InteractionWatchdog] Removed ${fixed} stray disabled attribute(s).`);
    }
    
    if (overlayFixed > 0) {
      console.warn(`[InteractionWatchdog] Fixed ${overlayFixed} stuck overlay(s).`);
    }
  }, [location.pathname]);

  return null;
}
