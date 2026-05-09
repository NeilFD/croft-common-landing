## Goal

Bring back the two floating action buttons (Book + Enquire) sitewide on Crazy Bear, rebranded for the Bears Den high-contrast B&W look. Same breathing/glow style as Croft Common, just swapped from pink to white-on-black so it sits inside the CB visual identity.

## Where they appear

Mounted globally at the app root so they show on every public Crazy Bear page (Landing `/`, `/town`, `/country` and all nested property pages, `/bears-den`, etc.).

Hidden on:
- Admin / management / CMS routes (`/management/*`, `/admin/*`, `/cms/*`)
- Auth-only Den pages (`/den`, `/den/*`) — these already have their own member nav
- Verify / utility pages (`/den/verify`, `/check-in`, `/manage-event/*`, `/set-password`, `/unsubscribe`)
- When in CMS edit mode

## What they do

- BOOK → navigates to `/book`
- ENQUIRE → navigates to `/enquire`

Both use the existing in-site pages, no new routes.

## Visual style (CB-branded "Croft Common style")

Two stacked circular buttons in the bottom-right, breathing-ring animation kept but recoloured:

- 56px round buttons, fixed bottom-right
- Stack: ENQUIRE on top (`bottom-32`), BOOK below (`bottom-12`)
- Default: black background, 2px white border, white text
- Hover: invert (white background, black text, black border)
- Breathing ring uses white at low opacity instead of pink
- Typography: Archivo Black uppercase, tracking-wider, text-[10px]
- Labels: `BOOK`, `ENQUIRE`
- Respects iOS safe-area-inset-bottom so it doesn't sit under the home bar
- Sits above the Spotify widget z-index so they don't collide (Spotify stays bottom-right too — we shift the floating buttons to bottom-right and Spotify already lives there, so we'll move the floating stack to the **bottom-left** to avoid overlap, matching where Croft Common had room)

## Files

New:
- `src/components/crazybear/CBFloatingActions.tsx` — small wrapper that renders both buttons and handles the route allow-list
- `src/components/crazybear/CBBookButton.tsx`
- `src/components/crazybear/CBEnquireButton.tsx`

Edited:
- `src/App.tsx` — mount `<CBFloatingActions />` once inside the Router, after the routes, so it overlays every page

Untouched:
- The legacy `BookFloatingButton.tsx` / `EnquiryFloatingButton.tsx` and their usage inside Croft Common hero carousels stay as-is (they're not on CB pages anymore but removing them is out of scope).

## Technical notes

- Buttons use `react-router-dom`'s `useNavigate` directly (no dependency on the Croft Common `TransitionContext`, `EditModeContext`, or `CMSText`)
- Route allow-list implemented with `useLocation` + a small `isHidden(pathname)` helper
- Breathing animation reuses the existing `animate-breathing` class already defined in the project; we override the `--breathing-color` CSS var to white
- No new dependencies
