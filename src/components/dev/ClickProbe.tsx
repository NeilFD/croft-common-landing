import { useEffect, useRef } from 'react';

/**
 * Dev-only utility to inspect and visualise click blockers.
 * Enable by adding ?debugclick=1 to the URL.
 */
export default function ClickProbe() {
  const enabledRef = useRef<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const enabled = params.has('debugclick');
    enabledRef.current = enabled;
    if (!enabled) return;

    const highlight = (el: Element, colour = 'hsl(var(--accent-pink))') => {
      const originalOutline = (el as HTMLElement).style.outline;
      (el as HTMLElement).style.outline = `2px solid ${colour}`;
      (el as HTMLElement).style.outlineOffset = '0px';
      setTimeout(() => {
        (el as HTMLElement).style.outline = originalOutline;
      }, 1000);
    };

    const logStack = (x: number, y: number) => {
      const stack = document.elementsFromPoint(x, y);
      console.groupCollapsed('[ClickProbe] elementsFromPoint', x, y);
      stack.slice(0, 8).forEach((el, idx) => {
        const cs = getComputedStyle(el as Element);
        const rect = (el as HTMLElement).getBoundingClientRect();
        console.log(`#${idx} <${(el as HTMLElement).tagName.toLowerCase()}>`, {
          class: (el as HTMLElement).className,
          id: (el as HTMLElement).id,
          zIndex: cs.zIndex,
          pointerEvents: cs.pointerEvents,
          opacity: cs.opacity,
          visibility: cs.visibility,
          display: cs.display,
          rect: {
            x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height)
          }
        });
      });
      console.groupEnd();

      // Highlight the top 3
      stack.slice(0, 3).forEach((el, i) => highlight(el, i === 0 ? 'hsl(var(--accent-pink))' : 'hsl(var(--accent-electric-blue))'));
    };

    const onDown = (e: MouseEvent | TouchEvent) => {
      const point = 'touches' in e && e.touches.length ? e.touches[0] : (e as MouseEvent);
      logStack(point.clientX, point.clientY);
    };

    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('touchstart', onDown, true);

    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('touchstart', onDown, true);
    };
  }, []);

  return null;
}
