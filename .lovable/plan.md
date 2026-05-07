## Problem

The screenshot is a `/country` page rendered by `PropertyLayout` -> `PropertyNavShell`, NOT by `CBTopNav`. That's why the previous edits to `CBTopNav` and the main `Navigation` had no effect on these pages — they use a third, separate header.

`src/components/property/PropertyNavShell.tsx` uses a plain `sticky top-0 ... h-16` header with no `env(safe-area-inset-top)` handling. On iOS PWA / standalone, the bear icon and hamburger sit directly under the notch / status bar.

## Fix

Update `src/components/property/PropertyNavShell.tsx` only:

1. On the outer `<header>` (line 22), add an inline style:
   `style={{ paddingTop: 'env(safe-area-inset-top)' }}`
   so the inset pushes the inner row down on iOS, and is 0 in the browser.

2. On the mobile fullscreen menu's top bar (line 92, the inner `<div className="flex h-16 ...">`), apply the same inline `paddingTop: 'env(safe-area-inset-top)'` so the close (X) button and logo also clear the status bar when the menu is open.

3. On the mobile menu nav (line 100), change the height calc to also subtract the inset:
   `style={{ height: 'calc(100vh - 4rem - env(safe-area-inset-top))' }}` and drop the `h-[calc(100vh-4rem)]` class. This keeps the menu scroll area correct.

No other files change. This covers every `/town/*` and `/country/*` route, since they all render through `PropertyLayout` -> `PropertyNavShell`.

## Files

- `src/components/property/PropertyNavShell.tsx` — three small additions, no markup restructure.
