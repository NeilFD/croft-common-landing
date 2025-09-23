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

    if (fixed > 0) {
      console.warn(`[InteractionWatchdog] Removed ${fixed} stray disabled attribute(s).`);
    }
  }, [location.pathname]);

  return null;
}
