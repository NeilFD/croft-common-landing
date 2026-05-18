## Goal

Add a Programme view at `/management/marketing/programme` that visualises every campaign and promo as a Gantt-style timeline, side-by-side with the existing Calendar. Editable inline. Exportable as a clean, branded image/PDF the site teams can drop into a Slack channel or print.

## What it looks like

```text
                MAY 2026
              1  2  3  4  5  6  7  8  9 10 11 12 13 14 15 ... 31
KEY DATES    [Bank Hol]                  [Half Term -------]
ROOM PROMOS  [Spring Suite Offer ----------------]
F&B PROMOS                     [Sunday Roast Push ---]
LIVE CAMPAIGNS  [Bears Den Gold launch -----------------]
PROGRAMMING        [Jazz Night]            [Cinema]
SOCIAL COMMS [Town teaser]    [Country reel]   [UGC push]
NEWSLETTER         [May edit]                    [End of month]
```

- **Rows (lanes)**: Key Dates, Room Promos, F&B Promos, Live Campaigns, Programming, Social Comms, Newsletter — matches the spreadsheet sent.
- **Columns**: every day across a chosen window (default = current month, switchable to 3-month or full quarter).
- **Bars**: one per campaign or promo. Coloured by lane, labelled with name, length = duration.
- **Property tabs at top**: All / Town / Country — same data filtered.

## Interactions

Designed for non-technical site managers to glance at and the marketing team to edit:

- **Drag a bar** sideways to shift the dates.
- **Drag a bar edge** to extend or shorten.
- **Click a bar** to open a side drawer with: name, dates, lane, property, owner, status, hero asset, notes, linked posts. Same drawer is used for editing and for "add new".
- **Click an empty cell** in a lane to start a new campaign pre-filled with that lane and date.
- **+ New campaign** button top-right for the form-first path.
- **Today line** drawn down the grid as a thin vertical accent.
- **Inline tooltip on hover**: name, date range, owner, status pill.

## Shareability

The page is the share. Two clear export paths:

- **Share as image**: top-right button captures the Gantt grid as a high-res PNG with Crazy Bear branding (logo, month label, generated-on timestamp, bear silhouette watermark). One click, copies to clipboard and offers download.
- **Share as PDF**: same export but A3 landscape, ready to pin in the back-of-house.
- **Read-only share link**: copyable URL (`/management/marketing/programme?window=2026-05&property=town&view=public`) that renders the same Gantt with no editing chrome, for managers without management login. Requires a signed view token so it's not just open to the world.

Brand: same B&W high-contrast treatment as the rest of the management app. Bowlby One headings, Space Grotesk body. Lane colours kept restrained: a single accent strip on the left edge of each bar (Town pink, Country green, Group black) and a lane glyph on the left rail. No rainbow.

## Lane assignment

Each campaign gets a `lane` value: `key_dates`, `room_promo`, `fnb_promo`, `live_campaign`, `programming`, `social`, `newsletter`. Lane is a hard requirement on new campaigns so nothing falls off the chart. Existing campaigns get a one-time backfill to `live_campaign` and can be re-bucketed in the drawer.

## Sidebar + nav

The management sidebar gets two clear marketing sub-items: **Calendar** (post-level day view, already built) and **Programme** (campaign-level timeline, new). Both live under the existing Marketing section. The current `/management/marketing` redirect stays on Calendar.

## Out of scope for this first pass

- Multi-user live cursors / realtime collab. Edits save on close, polled every 30s.
- Resource budgeting (who's shooting what when). Can be a v2 column.
- Cross-property dependencies (e.g. "Town launch must follow Country"). Flag with a note for now.

---

## Technical section

### Routes (`src/App.tsx`)

Add inside the existing management block:

```tsx
<Route path="/management/marketing/programme" element={<MarketingProgramme />} />
```

Keep `/management/marketing` redirecting to `/calendar`. Add `/management/marketing/programme` to `CMS_EXCLUDED_ROUTES` in `src/data/cmsPages.ts` (management routes are not CMS-editable).

### Database

Extend `marketing_campaigns` (already has `start_date`, `end_date`, `colour`, `status`):

```sql
ALTER TABLE public.marketing_campaigns
  ADD COLUMN lane text NOT NULL DEFAULT 'live_campaign'
    CHECK (lane IN ('key_dates','room_promo','fnb_promo','live_campaign','programming','social','newsletter')),
  ADD COLUMN property_tag text
    CHECK (property_tag IN ('town','country','group')),
  ADD COLUMN notes text;

CREATE INDEX idx_campaigns_lane_dates
  ON public.marketing_campaigns(lane, start_date, end_date);
```

RLS: same management-only policy that already protects `marketing_campaigns`. Add a `marketing_programme_share_tokens` table for signed read-only links (token, window, property filter, expires_at).

### Files to create

- `src/pages/management/marketing/MarketingProgramme.tsx` — page shell, window picker, property tabs, export buttons.
- `src/components/marketing/programme/GanttGrid.tsx` — the chart itself. Pure SVG over a CSS grid: rows = lanes, columns = days. SVG bars for drag/resize.
- `src/components/marketing/programme/GanttBar.tsx` — single bar, handles pointer drag + edge resize, optimistic update.
- `src/components/marketing/programme/CampaignDrawer.tsx` — reuse pattern from `PostDrawer`. Form: name, lane, property, dates, owner, status, hero asset, notes, linked posts list (read-only).
- `src/components/marketing/programme/ProgrammeToolbar.tsx` — window selector, property tabs, search, export menu.
- `src/components/marketing/programme/ExportImage.tsx` — uses existing `html-to-image` or `dom-to-image-more` (small dep) to snapshot the chart node, then composes branded frame on a `<canvas>` before download.
- `src/hooks/useMarketingCampaigns.ts` — list, create, update (PATCH dates on drag), delete. React Query with optimistic updates so drag feels instant.
- `src/lib/marketing/programme.ts` — lane metadata (label, glyph, accent), date math, layout helpers.
- `src/pages/management/marketing/ProgrammePublicView.tsx` — read-only render when a valid `?token=` is present.

### Files to edit

- `src/App.tsx` — add the new route + lazy import.
- `src/components/management/marketing/MarketingNav.tsx` (or wherever the marketing tabs live) — add a "Programme" tab next to "Calendar".
- `src/data/cmsPages.ts` — exclude the new route.
- `src/lib/marketing/types.ts` — add `lane`, `property_tag`, `notes` to `MarketingCampaign`; add `LANE_LABELS` + `LANE_ORDER` constants.

### Drag mechanics

- Day width = grid container width / total days in window. Computed once per resize via `ResizeObserver`.
- Pointer events on the bar body shift `start_date` and `end_date` by `round(dx / dayWidth)` days.
- Pointer events on left/right resize handles adjust only one end; enforce `start_date <= end_date`.
- Commit to Supabase on `pointerup`, optimistic update via React Query `setQueryData`.

### Export

- Snapshot the Gantt root node with `html-to-image` (3KB, dependency-free).
- Render into an offscreen canvas with: Crazy Bear wordmark top-left, month label top-right, faint bear silhouette watermark bottom-right at 8% opacity, generated timestamp bottom-left.
- PNG via `canvas.toBlob`, PDF via `jspdf` (already in the project, just upgraded).

### Public share

- `POST /marketing/programme/share` edge function mints a JWT-style token bound to `{window, property, expires_at}`.
- Public route reads the token, decodes filter, fetches campaigns via a SECURITY DEFINER function that bypasses RLS for that filter only. No edit UI rendered.
