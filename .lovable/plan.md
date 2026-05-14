# Correction plan — strip the Bear's Den editorial bloat

You're right. I treated Bear's Den as a public content section alongside Stay / Eat & Drink. It isn't. It's a paid subscriber area (£69/mo Gold). Fixing that and tightening the rest of what shipped.

&nbsp;

No all Subscribers get access for The Bears Den, but paid membership tier - Gold - gives extras

## What was wrong

1. **Bear's Den shown as a homepage content group.** `CBLandingSections.tsx` renders a full editorial section "The Bear's Den — Our members' room. Twenty-five percent off, everywhere." with sub-links to `/bears-den`, `/curious`, `/members`. That presents a paid members area as if it's a fifth public pillar. Wrong.
2. **Bear's Den listed as a nav group in `CBNavOverlay`.** Same problem — full H2 column in the menu with three sub-links, as if it's browseable content.
3. **Footer site map column for Bear's Den** — same.
4. **Hom Thai listed under Eat & Drink links** is fine (page exists), but there's no menu file for it yet. Not a lie, just worth noting.

Hom Thai does exist as the Thai food offering in Town

## What I'm changing (no design changes, no new components)

### Step 1 — `src/data/cbSiteMap.ts`

- Remove the `bears-den` group entirely from `SITE_MAP`.
- Keep `/bears-den`, `/curious`, `/members` reachable via a single new `MEMBERS_ENTRY` constant (one link, not a group): `Join the Bear's Den` -> `/curious`. That's the public-facing entry point. Everything behind it stays gated where it already is.
- Re-check every remaining link resolves to a real route in `App.tsx`. Anything that doesn't, drop it.

### Step 2 — `src/components/crazybear/CBLandingSections.tsx`

- Delete the Bear's Den section.
- Homepage now has four editorial pillars + Visit us: Stay, Eat & Drink, Celebrate, Discover, Visit us. That's it.
- Add a single quiet line above the footer subscription block (re-using existing tokens, no new design): `Members: 25% off everywhere. Join the Bear's Den ->` linking to `/curious`. One link, not a content section.

### Step 3 — `src/components/crazybear/CBNavOverlay.tsx`

- Drop the Bear's Den column from the grid.
- Add `Join the Bear's Den` as a single item in the existing `More` block alongside Privacy / Unsubscribe / Enquire.
- Member Login already lives in `CBTopNav`; unchanged.

### Step 4 — `src/components/crazybear/CBFooter.tsx`

- Drop the Bear's Den site map column.
- Add `Join the Bear's Den` as a single link in the legal/utility row.

### Step 5 — `public/sitemap.xml`

- Remove `/members` from public sitemap (it's a gate, not content). Keep `/bears-den` and `/curious` since they're public landing pages.

### Step 6 — Honesty pass on remaining links

Quick verification of every link still in the site map against `src/App.tsx` routes and `src/pages/property/index.tsx` content. Anything without a real page or real copy gets removed, not papered over. Expected drops: none (already audited), but I'll confirm during the edit.

## Out of scope

- No design changes. No new components. No new colours, fonts, spacing.
- No changes to the Bear's Den page itself, or to Curious, or to Members. Those stay exactly as built.
- No changes to JSON-LD or heading hierarchy from the previous round.
- No URL changes, so no redirect updates needed.

## Build order

1. Edit `cbSiteMap.ts` (remove group, add `MEMBERS_ENTRY`).
2. Edit `CBLandingSections.tsx` (drop section, add single line).
3. Edit `CBNavOverlay.tsx` (drop column, add single link).
4. Edit `CBFooter.tsx` (drop column, add single link).
5. Edit `public/sitemap.xml` (drop `/members`).

Confirm and I'll execute.