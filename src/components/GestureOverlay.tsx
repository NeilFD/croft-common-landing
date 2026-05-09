import React, { useRef, useCallback, useEffect } from 'react';
import useGestureDetection from '@/hooks/useGestureDetection';
import { toast } from '@/hooks/use-toast';

interface GestureOverlayProps {
  onGestureComplete: () => void;
  containerRef?: React.RefObject<HTMLElement>;
}

/**
 * GestureOverlay — Touch + Mouse implementation.
 *
 * Uses classic touch events with **non-passive** `touchmove` so we can call
 * `preventDefault()` mid-stroke. That single change fixes the Android Chromium
 * family (Ecosia, Brave, Samsung Internet, Edge mobile) which otherwise claims
 * the gesture as a scroll after a few pixels of vertical travel.
 *
 * We deliberately do NOT use Pointer Events / setPointerCapture: iOS Safari
 * (especially in standalone/PWA mode) drops pointermove events under capture
 * and breaks the gesture entirely.
 */
const GestureOverlay: React.FC<GestureOverlayProps> = ({ onGestureComplete, containerRef }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const loggedOnceRef = useRef(false);

  const clearSelection = useCallback(() => {
    try {
      window.getSelection()?.removeAllRanges();
      if ((document as any).selection?.empty) (document as any).selection.empty();
    } catch {}
  }, []);

  const handleGestureSuccess = useCallback(() => {
    clearSelection();
    setTimeout(clearSelection, 0);
    setTimeout(clearSelection, 50);

    toast({
      title: 'Access Granted',
      description: 'Welcome to The Common Room, for Common People',
      duration: 2000,
    });
    onGestureComplete();
  }, [onGestureComplete, clearSelection]);

  const {
    isDrawing,
    startGesture,
    addPoint,
    endGesture,
  } = useGestureDetection(handleGestureSuccess);

  // Mirror isDrawing into a ref for handlers.
  useEffect(() => {
    drawingRef.current = isDrawing;
  }, [isDrawing]);

  const isInteractiveElement = useCallback((target: EventTarget | null): boolean => {
    if (!target || !(target instanceof HTMLElement)) return false;
    const interactive = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'];
    let el: HTMLElement | null = target;
    while (el) {
      if (
        el.hasAttribute('data-radix-dialog-content') ||
        el.hasAttribute('data-radix-dialog-overlay') ||
        el.getAttribute('role') === 'dialog' ||
        el.getAttribute('role') === 'alertdialog'
      ) return true;
      const z = parseInt(window.getComputedStyle(el).zIndex);
      if (!isNaN(z) && z >= 50) return true;
      if (interactive.includes(el.tagName)) return true;
      if (el.getAttribute('role') === 'button') return true;
      if (el.style.cursor === 'pointer') return true;
      el = el.parentElement;
    }
    return false;
  }, []);

  const getTouchPosition = useCallback(
    (clientX: number, clientY: number, fallbackEl: HTMLElement | null) => {
      const container = containerRef?.current || fallbackEl;
      const rect = container?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: clientX - rect.left, y: clientY - rect.top };
    },
    [containerRef]
  );

  useEffect(() => {
    const usingContainer = !!containerRef?.current;
    const targetEl: HTMLElement | Document = usingContainer
      ? (containerRef!.current as HTMLElement)
      : document;

    if (usingContainer && targetEl instanceof HTMLElement) {
      targetEl.removeAttribute('disabled');
      (targetEl.style as any).webkitUserSelect = 'none';
      targetEl.style.userSelect = 'none';
      (targetEl.style as any).webkitTouchCallout = 'none';
      (targetEl.style as any).webkitTapHighlightColor = 'transparent';
      targetEl.classList.add('gesture-container');
    }

    // -------------------- Touch handlers --------------------
    const onTouchStart = (e: TouchEvent) => {
      if (isInteractiveElement(e.target)) return;
      if (e.touches.length !== 1) return;

      if (!loggedOnceRef.current) {
        loggedOnceRef.current = true;
        try {
          console.debug('[gesture] touch start', { ua: navigator.userAgent });
        } catch {}
      }

      try { window.getSelection()?.removeAllRanges(); } catch {}

      const touch = e.touches[0];
      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getTouchPosition(touch.clientX, touch.clientY, fallback);
      startGesture(x, y);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!drawingRef.current) return;
      if (isInteractiveElement(e.target)) return;
      if (e.touches.length !== 1) return;
      // CRITICAL: non-passive listener so this works. Prevents Android Chromium
      // browsers from claiming the gesture as a scroll mid-stroke.
      try { e.preventDefault(); } catch {}
      clearSelection();
      const touch = e.touches[0];
      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getTouchPosition(touch.clientX, touch.clientY, fallback);
      addPoint(x, y);
    };

    const onTouchEnd = (_e: TouchEvent) => {
      if (drawingRef.current) clearSelection();
      endGesture();
    };

    const onTouchCancel = (_e: TouchEvent) => {
      if (drawingRef.current) clearSelection();
      endGesture();
    };

    // -------------------- Mouse handlers (desktop) --------------------
    const onMouseDown = (e: MouseEvent) => {
      if (isInteractiveElement(e.target)) return;
      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getTouchPosition(e.clientX, e.clientY, fallback);
      startGesture(x, y);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!drawingRef.current) return;
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      clearSelection();
      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getTouchPosition(e.clientX, e.clientY, fallback);
      addPoint(x, y);
    };
    const onMouseUp = (_e: MouseEvent) => {
      if (drawingRef.current) clearSelection();
      endGesture();
    };

    // touchstart can stay passive (we don't preventDefault on it).
    (targetEl as any).addEventListener('touchstart', onTouchStart, { passive: true });
    // touchmove MUST be non-passive — this is the core fix for Ecosia/Android.
    (targetEl as any).addEventListener('touchmove', onTouchMove, { passive: false });
    (targetEl as any).addEventListener('touchend', onTouchEnd, { passive: true });
    (targetEl as any).addEventListener('touchcancel', onTouchCancel, { passive: true });

    (targetEl as any).addEventListener('mousedown', onMouseDown);
    (targetEl as any).addEventListener('mousemove', onMouseMove);
    (targetEl as any).addEventListener('mouseup', onMouseUp);

    return () => {
      if (usingContainer && targetEl instanceof HTMLElement) {
        targetEl.classList.remove('gesture-container');
        targetEl.removeAttribute('disabled');
      }
      (targetEl as any).removeEventListener('touchstart', onTouchStart);
      (targetEl as any).removeEventListener('touchmove', onTouchMove);
      (targetEl as any).removeEventListener('touchend', onTouchEnd);
      (targetEl as any).removeEventListener('touchcancel', onTouchCancel);
      (targetEl as any).removeEventListener('mousedown', onMouseDown);
      (targetEl as any).removeEventListener('mousemove', onMouseMove);
      (targetEl as any).removeEventListener('mouseup', onMouseUp);
    };
  }, [containerRef, getTouchPosition, startGesture, addPoint, endGesture, isInteractiveElement, clearSelection]);

  if (containerRef) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 bg-transparent"
      style={{
        pointerEvents: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    />
  );
};

export default GestureOverlay;
