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

    // Enhanced center grid probing for problematic elements
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = Math.round(vw / 2);
    const cy = Math.round(vh / 2);
    
    // 3x3 grid around center
    const probePoints = [
      [cx - 50, cy - 50], [cx, cy - 50], [cx + 50, cy - 50],
      [cx - 50, cy], [cx, cy], [cx + 50, cy],
      [cx - 50, cy + 50], [cx, cy + 50], [cx + 50, cy + 50]
    ];

    let centerFixed = 0;
    const processedElements = new Set<HTMLElement>();

    for (const [x, y] of probePoints) {
      const stack = document.elementsFromPoint(x, y);
      const topElement = stack[0] as HTMLElement;
      
      if (!topElement || processedElements.has(topElement)) continue;
      processedElements.add(topElement);
      
      const cs = getComputedStyle(topElement);
      
      // Check for misleading cursor with no real interactivity and low opacity
      if (cs.cursor === 'pointer' && 
          !topElement.onclick && 
          !topElement.getAttribute('href') && 
          !topElement.getAttribute('role')?.includes('button') &&
          parseFloat(cs.opacity || '1') < 0.1) {
        
        topElement.style.pointerEvents = 'none';
        topElement.setAttribute('data-debug-neutralised', 'center-probe');
        centerFixed++;
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
    
    if (centerFixed > 0) {
      console.warn(`[InteractionWatchdog] Fixed ${centerFixed} center-blocking element(s).`);
    }
    
    if (overlayFixed > 0) {
      console.warn(`[InteractionWatchdog] Fixed ${overlayFixed} stuck overlay(s).`);
    }
  }, [location.pathname]);

  return null;
}
