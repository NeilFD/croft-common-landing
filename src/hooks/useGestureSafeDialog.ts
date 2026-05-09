import { useEffect, useRef, useCallback } from 'react';

/**
 * Returns Radix Dialog handlers that swallow stray outside-pointer / focus events
 * for a short grace window after the dialog opens.
 *
 * Why: when a Radix Dialog is opened from a touch/pointer gesture (e.g. our
 * "draw 7" secret), the residual touchend → synthetic click on iOS Safari (and
 * occasionally Chromium) is interpreted by Radix as `pointerDownOutside`, which
 * immediately closes the dialog. This hook gives the dialog ~600ms of breathing
 * room so the user actually sees it.
 *
 * Also exposes `onOpenChange` to wrap your existing close handler — `false`
 * transitions during the grace window are ignored as defence in depth.
 */
export function useGestureSafeDialog(open: boolean, graceMs = 600) {
  const openedAtRef = useRef<number>(0);

  useEffect(() => {
    if (open) openedAtRef.current = Date.now();
  }, [open]);

  const withinGrace = () =>
    openedAtRef.current > 0 && Date.now() - openedAtRef.current < graceMs;

  const onPointerDownOutside = useCallback((e: Event) => {
    if (withinGrace()) e.preventDefault();
  }, []);
  const onInteractOutside = useCallback((e: Event) => {
    if (withinGrace()) e.preventDefault();
  }, []);
  const onFocusOutside = useCallback((e: Event) => {
    if (withinGrace()) e.preventDefault();
  }, []);

  /** Wrap your dialog's close handler so grace-window closes are ignored. */
  const guardOpenChange = useCallback(
    (handler: (open: boolean) => void) => (next: boolean) => {
      if (!next && withinGrace()) return;
      handler(next);
    },
    []
  );

  return { onPointerDownOutside, onInteractOutside, onFocusOutside, guardOpenChange };
}
