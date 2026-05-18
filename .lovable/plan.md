## Goal

Replace the plain native browser tooltip on Gantt bars with a fully branded, rich hover card that surfaces every useful campaign detail at a glance.

## What the tooltip shows

Bears Den style: black panel, white type, Bowlby One title, Space Grotesk body. Sharp corners, hard shadow.

- **Title** — campaign name
- **Status pill** — Draft / Scheduled / Published / Archived etc. (colour-coded)
- **Property pill** — Town (pink) / Country (green) / Group (black)
- **Lane** — Key Dates / Room Promo / F&B Promo / Live Campaign / Programming / Social / Newsletter
- **Dates** — "12 May – 26 May 2026 · 15 days"
- **Countdown** — "Starts in 4 days" / "Live · 6 days left" / "Ended 3 days ago"
- **Goal** — single line, truncated to 2 lines
- **KPI** — single line
- **Budget** — formatted £ if present
- **Notes** — italic, truncated to 3 lines
- **Footer** — "Click to edit · drag edges to resize"

Sections only render if data is present, so a sparse campaign produces a short card, not empty rows.

## How it behaves

- Uses the existing shadcn `HoverCard` primitive (Radix under the hood). Solid black background — never transparent.
- Opens after ~150ms hover, closes immediately on leave.
- Positioned `top` with collision detection so it never clips off the viewport edge or off the horizontally-scrolling Gantt area.
- Z-index above bars and the Today line.
- Suppressed while the bar is being dragged or resized (no flicker mid-drag).
- Keyboard: also opens on focus, so tabbing through bars reveals the same info (accessible).
- Native `title` attribute is removed to avoid double tooltips.

## Files to change

- `src/components/marketing/programme/GanttGrid.tsx`
  - Wrap each `GanttBar` in `<HoverCard>` / `<HoverCardTrigger>` / `<HoverCardContent>`.
  - Hide the card while `drag` is non-null.
  - Drop the existing `title=` attribute on the bar div.
- `src/components/marketing/programme/CampaignTooltip.tsx` *(new)*
  - Pure presentational component. Takes `campaign: MarketingCampaign` and `window: ProgrammeWindow`.
  - Computes countdown/duration locally using `date-fns`.
  - Maps `status` → label + token colour, `property_tag` → accent.

## Out of scope

- No tooltip on the lane labels or day headers (only on bars).
- No editing from within the tooltip — click still opens the existing drawer.
- No live preview of drag changes inside the tooltip (it's hidden during drag).
