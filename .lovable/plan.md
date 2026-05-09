# Universal Fix: Secret Seven Gesture & Safari Modal Flicker

Two distinct root causes are producing the symptoms you described. Both are fixable without changing the gesture shape, the secret seven UX, or any business logic.

## Problem 1 — Gesture fails on Ecosia (Android) and is flaky in some Chromium browsers

### Root cause
`GestureOverlay` uses **legacy touch events** registered as **passive: true**, with no `touch-action` constraint on the gesture container.

On Android Chrome based browsers (Ecosia, Brave, Samsung Internet, Edge mobile) the browser:
1. Sees the first vertical part of the "7" stroke.
2. Claims the touch sequence as a **scroll gesture**.
3. Stops dispatching further `touchmove` events to JS (because the listener is passive — JS cannot cancel scroll).
4. The remaining points of the "7" never arrive, `isValid7Shape` never returns true, nothing happens.

iOS Safari is more lenient because it batches touchmoves differently, which is why it "mostly works" there.

### Fix
Rewrite the input layer of `GestureOverlay` to use the **Pointer Events API** (universal across Safari 13+, all Chromium, Firefox, Samsung Internet, Ecosia):

- `pointerdown` → start gesture, call `el.setPointerCapture(e.pointerId)` so the browser routes all subsequent moves to us regardless of scroll heuristics.
- `pointermove` → add point. Guarded by `isDrawing` and `isInteractiveElement`.
- `pointerup` / `pointercancel` → end gesture, release capture.
- While `isDrawing === true`, set `touch-action: none` on the container; restore it when not drawing. This guarantees the browser will not steal the gesture for scrolling, but pages remain scrollable normally when no gesture is in progress.
- Keep mouse fallback for older desktop browsers behind `if (!window.PointerEvent)`.

Pointer Events also fix Apple Pencil, stylus, and trackpad edge-cases.

### Secondary cleanup in `useGestureDetection`
- Replace `setLastGestureTime` (state) with a ref so the 1s debounce does not retrigger renders that cancel in-flight strokes.
- Remove the React state churn during `addPoint` (use a ref array, only `setPoints` on validation success or stroke end). This stops the per-frame re-render that some low-end Android devices cannot keep up with.

## Problem 2 — Secret Seven modal flashes open then closes on Safari

### Root cause
After a successful "7" stroke, `SecretLuckySevenModal` (and the gate modals it spawns) open a Radix `Dialog`. On Safari the gesture's final `touchend` fires a synthetic `click` ~300ms later. Radix interprets this click as `onPointerDownOutside` against the just-opened dialog and **closes it immediately** via `onOpenChange(false) → handleCloseAll()`.

This is a known Radix + iOS Safari interaction; it does not happen on Chrome desktop, which is why "for some people" only.

The same pattern affects every modal opened directly from a gesture: `BiometricUnlockModal`, `RecipeOfTheMonthModal`, `RollTheDiceModal`, `RoomsOfferModal`, `PoolDayBedModal`, `SecretCinemaModal`, the Bears Den gate.

### Fix
Add a small **gesture grace window** to each gesture-launched dialog:

- New tiny hook `useGestureSafeDialogProps(open)` returns `{ onPointerDownOutside, onInteractOutside, onFocusOutside }` handlers that call `e.preventDefault()` for the first 600ms after `open` flips to true.
- Apply it to the `<DialogContent>` of every secret modal.
- Also tighten the `Dialog`'s `onOpenChange` so it ignores `false` transitions during the same 600ms window (defence in depth).

Effect: the residual synthetic click from the "7" gesture is swallowed; the modal stays open until the user genuinely taps outside.

## Problem 3 — Universal hardening (small)

- `SecretGestureHost` currently mounts `<GestureOverlay>` only when `user` is truthy, but the "Members: draw 7" hint text is rendered with `pointer-events: none` — confirm no z-index above the overlay swallows pointers in the property pages.
- `GestureOverlay`'s document-level fallback listeners (used when no `containerRef` is passed) currently call `e.preventDefault()` inside non-passive `mousemove` only. After the rewrite, switch all branches to Pointer Events for symmetry, so behaviour is identical whether scoped or global.
- Add a one-line UA log on first gesture attempt (`console.debug('[gesture] start', { pointerType, ua })`) so we can verify Ecosia / Samsung Internet in production logs.

## Files to change

- `src/hooks/useGestureDetection.ts` — refs instead of state for hot path; keep public API identical.
- `src/components/GestureOverlay.tsx` — Pointer Events rewrite, conditional `touch-action: none`, mouse fallback.
- `src/hooks/useGestureSafeDialog.ts` — **new**, ~25 lines.
- `src/components/SecretLuckySevenModal.tsx` — apply the safe-dialog hook.
- `src/components/BiometricUnlockModal.tsx` — apply the safe-dialog hook.
- `src/components/MembershipLinkModal.tsx` — apply.
- `src/components/AuthModal.tsx` — apply (only when opened from gesture path).
- `src/components/secrets/RecipeOfTheMonthModal.tsx`, `RollTheDiceModal.tsx`, `RoomsOfferModal.tsx`, `PoolDayBedModal.tsx` — apply.
- `src/components/SecretCinemaModal.tsx` — apply.

No changes to gesture shape, validation thresholds, biometric flow, RP IDs, or any backend.

## Verification plan

After the change:
1. Preview on the iPhone you have. Draw a "7" on /index — modal stays open.
2. Mobile Safari Web Inspector: confirm `[gesture] start { pointerType: 'touch' }` log appears.
3. Open the published URL on Ecosia Android — draw a "7" — modal opens. Check Chrome devtools remote inspect to confirm pointer events.
4. Desktop Chrome and Firefox — mouse drag still works (PointerEvent path covers both).
5. Confirm normal vertical scrolling on every page is unaffected (touch-action only flips to `none` mid-stroke).
