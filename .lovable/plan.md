## Goal

Two things, separately:

1. Strip the legacy Croft Common streak/check‑in layout off `/den/member` and rebuild the page in the Crazy Bear Den style (B&W, hairline blocks, Archivo headings, no pink, no gradients).
2. Tell you exactly where the events calendar is managed so you can edit it.

---

## Where to manage the events calendar

The "Upcoming Events" carousel on `/den/member` is fed by the public `events` table via `useEventManager`. There is no separate admin screen — events are created and edited from the **public Calendar page itself**, which has a hidden authenticated admin mode.

- Open: `https://www.croftcommontest.com/calendar`
- Trigger the secret gesture on the calendar card (long-press / draw 7 — same gesture system used elsewhere). If you're not signed in, an auth modal opens.
- Once authenticated, a "Create Event" modal appears. It writes to the `events` table via `useEventManager.addEvent`, which is the same source the Den carousel reads from.
- A separate `/management/events` exists too, but that is the spaces/booking events list (private hire enquiries), not the public events on the Den carousel. Don't confuse the two.

No code changes needed for this part — answering only.

---

## /den/member rebuild

### What's wrong now

- Old Croft Common chrome: white rounded cards, thick black borders, pink hover and pink accent buttons.
- Streak system is showing "14 weeks missed", "Save Streak", "Triple challenge" etc. for a freshly-created account. Database checks confirm `member_streaks`, `member_check_ins`, `member_receipts`, `loyalty_cards`, `loyalty_entries` are all empty (0 rows). The bogus history is the streak engine counting calendar weeks back to a project-wide start date instead of the member's join date — i.e. the engine has no concept of "new member, no history yet".
- "Total Visits / This Month spend" cards reference the same empty data and read as zeros in heavy bordered boxes.

### What we'll build

A monochrome Den-style page with the same `country-06` B&W background and overlay used on `/den/main`. Layout, top to bottom, centred, max-w-5xl:

1. Mono eyebrow `MEMBER` and Archivo Black headline `WELCOME, {first_name}`.
2. One‑line Bears Den whisper under the headline (e.g. "Quiet door. Loud nights. Yours.").
3. A row of four hairline action chips matching the `/den/main` Enter button style: `Upload receipt`, `Takeaway`, `Moments`, `Profile`.
4. Hairline divider, mono eyebrow `THIS WEEK`, then the streak block (see below).
5. Hairline divider, mono eyebrow `WHAT'S ON`, then the upcoming events list rendered in Den style (B&W cards, hairline border, mono date eyebrows, Archivo titles). Replace the pink-bordered `Card` wrapper.
6. Hairline divider, mono eyebrow `MOMENTS`, then `MemberMomentsCarousel` (already exists) inside a hairline frame.
7. Footer.

Removed for good from this page: the white welcome card, the pink "Save Streak" CTA, the Croft Common "Total Visits / This Month" stat tiles, the duplicated quick-action button rows, hover-pink everywhere.

### Streak block — fresh-account behaviour

Goal: a brand-new member sees a clean, encouraging block, never "14 weeks missed". Long-term members still see their real streak.

- New `useDenStreak` hook (or extend `useStreakDashboard`) that reads `cb_members.created_at` for the current user as the **streak origin date**. Any week before that date is excluded from the calendar, missed-weeks list, and grace counts.
- Empty-state UI when `total_check_ins === 0` AND no receipts uploaded:
  - Archivo headline `START YOUR STREAK`
  - Body: "Upload a receipt to log this week. We'll count from here."
  - Single hairline `Upload receipt` button (opens the existing `ReceiptUploadModal`).
  - No calendar grid, no missed weeks, no rewards dashboard, no Save Streak CTA.
- Active state (member has at least one check-in or receipt):
  - Mono eyebrow `STREAK`
  - Big Archivo number: current consecutive weeks.
  - Small mono row underneath: `LONGEST {n}` · `TOTAL {n}` · `THIS MONTH £{x}`.
  - Below that, a stripped-back B&W weekly grid (re-style of `TraditionalStreakCalendar`) — squares filled white for completed weeks, hairline border for pending, no pink, no gradients.
  - Missed-week alert only shows weeks **after** the member's join date and only when there are 2 or more genuine misses. Single-miss weeks are silently rolled into the grid.
- `StreakRewardsDashboard`, `StreakEmergencyBanner`, `StreakSaveModal`, `MissedWeekAlert` get a B&W restyle (hairline borders, mono labels, Archivo headings). No deletion of the underlying logic — just the visual rebuild and the join-date guard.

### Files touched

- `src/pages/MemberHome.tsx` — full layout rewrite.
- `src/components/TraditionalStreakCalendar.tsx` — strip pink/gradient, swap to hairline B&W; respect join-date origin.
- `src/components/MissedWeekAlert.tsx` — B&W restyle; filter to post-join weeks; hide on single miss.
- `src/components/StreakRewardsDashboard.tsx`, `StreakEmergencyBanner.tsx`, `StreakSaveModal.tsx`, `ReceiptUploadModal.tsx` — restyle pass to Den tokens (mono labels, Archivo titles, hairline borders, no pink).
- `src/components/UpcomingEventsCarousel.tsx` — restyle the per-event card (Archivo title, mono date eyebrow, hairline border, B&W image with grayscale filter).
- `src/hooks/useStreakDashboard.ts` — accept a `streakOriginDate` (member join date) and clamp the week list / missed-weeks / grace logic to it.

### Out of scope (flagging only)

- Lucide icon usage across these components conflicts with the workspace rule. Replacing every icon would balloon scope. Call it out as a follow-up.
- No database schema changes. The streak tables stay as-is — fix is purely the join-date clamp on the client.

---

## Verification

- `/den/member` as a fresh signup: B&W page, "Welcome, {name}", chips row, `START YOUR STREAK` block (no missed weeks, no Save Streak), upcoming events in B&W, moments below. No pink anywhere.
- Open DevTools → Network: confirm `member_streaks`, `member_check_ins`, `member_receipts` all return `[]`. Page renders empty-state cleanly.
- Upload a receipt → block flips to active state with current-week tile filled.
- `/calendar` → trigger secret gesture, sign in if needed, create a test event, confirm it appears in the Den's `WHAT'S ON` block.
