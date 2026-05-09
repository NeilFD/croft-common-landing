import React, { useRef, useCallback, useEffect } from 'react';
import useGestureDetection from '@/hooks/useGestureDetection';
import { toast } from '@/hooks/use-toast';

interface GestureOverlayProps {
  onGestureComplete: () => void;
  containerRef?: React.RefObject<HTMLElement>;
}

/**
 * GestureOverlay — Pointer Events implementation.
 *
 * Uses the universal Pointer Events API (Safari 13+, all Chromium-based
 * browsers including Ecosia/Brave/Samsung Internet, Firefox) plus
 * `setPointerCapture` so a stroke is delivered in full regardless of any
 * scroll-hijack heuristics. `touch-action` is only flipped to `none` while a
 * stroke is actively being drawn, so normal scrolling is preserved.
 */
const GestureOverlay: React.FC<GestureOverlayProps> = ({ onGestureComplete, containerRef }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawingRef = useRef(false);
  const activePointerIdRef = useRef<number | null>(null);
  const captureElRef = useRef<HTMLElement | null>(null);
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

  // Mirror isDrawing into a ref so event handlers always see the latest value
  // without needing to be re-bound (React state lags one tick behind).
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

  const getEventPosition = useCallback(
    (event: PointerEvent | MouseEvent, fallbackEl: HTMLElement | null) => {
      const container = containerRef?.current || fallbackEl;
      const rect = container?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    },
    [containerRef]
  );

  // Attach Pointer Events to a target element (container or document).
  useEffect(() => {
    const usingContainer = !!containerRef?.current;
    const targetEl: HTMLElement | Document = usingContainer
      ? (containerRef!.current as HTMLElement)
      : document;
    const styleEl: HTMLElement | null = usingContainer
      ? (containerRef!.current as HTMLElement)
      : document.documentElement;

    if (usingContainer && targetEl instanceof HTMLElement) {
      targetEl.removeAttribute('disabled');
      (targetEl.style as any).webkitUserSelect = 'none';
      targetEl.style.userSelect = 'none';
      (targetEl.style as any).webkitTouchCallout = 'none';
      (targetEl.style as any).webkitTapHighlightColor = 'transparent';
      targetEl.classList.add('gesture-container');
    }

    const setTouchAction = (value: string) => {
      if (styleEl) styleEl.style.touchAction = value;
    };

    const supportsPointer = typeof window !== 'undefined' && 'PointerEvent' in window;

    const onPointerDown = (e: PointerEvent) => {
      if (isInteractiveElement(e.target)) return;
      // Only primary pointer (first finger / left mouse).
      if (e.isPrimary === false) return;

      if (!loggedOnceRef.current) {
        loggedOnceRef.current = true;
        try {
          console.debug('[gesture] start', {
            pointerType: e.pointerType,
            ua: navigator.userAgent,
          });
        } catch {}
      }

      try {
        window.getSelection()?.removeAllRanges();
      } catch {}

      // Capture pointer so the browser can't steal it for scroll.
      const captureTarget =
        usingContainer && targetEl instanceof HTMLElement ? targetEl : (e.target as HTMLElement | null);
      if (captureTarget && typeof captureTarget.setPointerCapture === 'function') {
        try {
          captureTarget.setPointerCapture(e.pointerId);
          captureElRef.current = captureTarget;
        } catch {}
      }
      activePointerIdRef.current = e.pointerId;

      // Lock scroll for the duration of the stroke only.
      setTouchAction('none');

      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getEventPosition(e, fallback);
      startGesture(x, y);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drawingRef.current) return;
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
      if (isInteractiveElement(e.target)) return;
      // Cancellable now since we have pointer capture; suppresses stray text selection on desktop.
      try { e.preventDefault(); } catch {}
      clearSelection();
      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getEventPosition(e, fallback);
      addPoint(x, y);
    };

    const finishStroke = (e: PointerEvent) => {
      if (activePointerIdRef.current !== null && e.pointerId !== activePointerIdRef.current) return;
      if (drawingRef.current) clearSelection();
      // Release capture and restore touch-action.
      if (captureElRef.current && typeof captureElRef.current.releasePointerCapture === 'function') {
        try { captureElRef.current.releasePointerCapture(e.pointerId); } catch {}
      }
      captureElRef.current = null;
      activePointerIdRef.current = null;
      setTouchAction('');
      endGesture();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (isInteractiveElement(e.target)) {
        // Still need to release capture / restore touch-action if we had started.
        if (activePointerIdRef.current === e.pointerId) finishStroke(e);
        return;
      }
      finishStroke(e);
    };

    const onPointerCancel = (e: PointerEvent) => finishStroke(e);

    // Mouse fallback for the (rare) browser without PointerEvent.
    const onMouseDown = (e: MouseEvent) => {
      if (isInteractiveElement(e.target)) return;
      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getEventPosition(e, fallback);
      startGesture(x, y);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!drawingRef.current) return;
      if (isInteractiveElement(e.target)) return;
      e.preventDefault();
      clearSelection();
      const fallback = usingContainer ? null : (overlayRef.current ?? document.documentElement);
      const { x, y } = getEventPosition(e, fallback);
      addPoint(x, y);
    };
    const onMouseUp = (_e: MouseEvent) => {
      if (drawingRef.current) clearSelection();
      endGesture();
    };

    if (supportsPointer) {
      (targetEl as any).addEventListener('pointerdown', onPointerDown, { passive: true });
      // pointermove/up cannot be passive when we want preventDefault to work in some browsers.
      (targetEl as any).addEventListener('pointermove', onPointerMove, { passive: false });
      (targetEl as any).addEventListener('pointerup', onPointerUp, { passive: true });
      (targetEl as any).addEventListener('pointercancel', onPointerCancel, { passive: true });
    } else {
      (targetEl as any).addEventListener('mousedown', onMouseDown);
      (targetEl as any).addEventListener('mousemove', onMouseMove);
      (targetEl as any).addEventListener('mouseup', onMouseUp);
    }

    return () => {
      setTouchAction('');
      if (usingContainer && targetEl instanceof HTMLElement) {
        targetEl.classList.remove('gesture-container');
        targetEl.removeAttribute('disabled');
      }
      if (supportsPointer) {
        (targetEl as any).removeEventListener('pointerdown', onPointerDown);
        (targetEl as any).removeEventListener('pointermove', onPointerMove);
        (targetEl as any).removeEventListener('pointerup', onPointerUp);
        (targetEl as any).removeEventListener('pointercancel', onPointerCancel);
      } else {
        (targetEl as any).removeEventListener('mousedown', onMouseDown);
        (targetEl as any).removeEventListener('mousemove', onMouseMove);
        (targetEl as any).removeEventListener('mouseup', onMouseUp);
      }
    };
  }, [containerRef, getEventPosition, startGesture, addPoint, endGesture, isInteractiveElement, clearSelection]);

  // When scoped to a container we don't render an overlay (capture happens on the container itself).
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
