# Meetings & Events page + nav slot + new What's Happening hero

## 1. Top nav

Insert **Meetings & Events** between Food and Offers in `CBTopNav.tsx`:

```
Our Rooms · Food · Meetings & Events · Offers · What's Happening · Weddings · (Member auth) · BOOK
```

Link target: `/meetings-and-events`.

## 2. New page `/meetings-and-events`

New file `src/pages/crazybear/MeetingsAndEvents.tsx`. Standard CBTopNav + CBFooter shell, dramatic full-bleed hero (Bowlby One headline, Space Grotesk subtitle), then a 2×2 grid of four large clickable tiles:

| Tile         | Links to                          |
| ------------ | --------------------------------- |
| Weddings     | `/country/events/weddings`        |
| Parties      | `/country/parties`                |
| Birthdays    | `/country/events/birthdays`       |
| Business Events | `/country/events/business`     |

Each tile: full-bleed image, dark overlay, oversized uppercase label, eyebrow line, "Enter →" cue on hover. Mobile stacks 1-up. Hero copy + button labels via `CMSText` so they're editable.

Route added to `App.tsx`; page registered in `src/data/cmsPages.ts` under Standalone group with SEO defaults (title "Meetings & Events | Crazy Bear", description "Weddings, parties, birthdays and business events at Crazy Bear Town & Country.").

## 3. What's Happening hero swap

Generate a new festival-crowd image (premium quality, dark moody crowd-with-lights vibe, on-brand), upload it to the existing `cms-assets/whats-on/hero/` storage path, then UPDATE the existing `cms_images` row (page=`whats-on`, section=`hero`) to point to the new URL. Alt text updated to "Festival crowd at night". No code changes in `WhatsOn.tsx` needed — `CBHeroBackdrop` already reads the row.

## Out of scope

- No changes to existing `/country/events/*` or `/country/parties` pages.
- No new Town-side equivalents (current Weddings/Birthdays/Business are country-only). If you want them mirrored to Town later, separate task.
- CBNavOverlay site-map menu left as-is.
