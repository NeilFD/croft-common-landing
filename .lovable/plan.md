## Problem

On the Crazy Bear landing (and other CB pages) viewed as a PWA / on iOS, the bear mark logo and top nav links (HOUSE RULES, MEMBER LOGIN) sit too close to the status bar / notch. Currently `CBTopNav` uses a fixed `pt-7` with no safe-area inset.

## Fix

Update `src/components/crazybear/CBTopNav.tsx` so the header respects the iOS status bar / notch:

- Replace the static `pt-7` with an inline style that combines `env(safe-area-inset-top)` plus a comfortable base offset, e.g.:
  ```
  style={{ paddingTop: 'calc(env(safe-area-inset-top) + 28px)' }}
  ```
  and drop `pt-7` from the className.

This gives:
- Browser (no inset): ~28px top padding (matches current look)
- PWA / iOS standalone with notch: inset (~47px on iPhone) + 28px = clear breathing room above the bear mark and nav links

No other components need changes. `CBTopNav` is used by Landing, BearsDen, Town, Country, HouseRules, SetPassword etc. so all CB pages benefit from one edit.

## Files

- `src/components/crazybear/CBTopNav.tsx` — header padding only, no markup/structure changes.
