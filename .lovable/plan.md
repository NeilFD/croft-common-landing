# Karaoke Booking Engine — Phase 1 Build (Frontend + Emails + Management)

Backend (tables, RPCs, seed data, email infra) is already in place. This plan covers everything still to build.

## 1. Shared booking logic

Create `src/lib/karaoke/slots.ts`:
- Slot timing constants: 2h total, 15m gather, 90m usable, 15m clean-down.
- Helpers: `formatSlotWindow`, `formatUsableWindow`, `nextNDays(28)`, `isWithinCutoff(slotStart, cutoffHours)`.
- Min/max party size: 2 / 16.

Create `src/lib/karaoke/api.ts` — thin typed wrappers around the RPCs:
- `getAvailability(fromDate, days)` -> `get_karaoke_availability`
- `createBooking(input)` -> `create_karaoke_booking`
- `getBookingByToken(token)` -> `get_karaoke_booking_by_token`
- `updateBookingByToken(...)` / `cancelBookingByToken(...)`
- `listPackages()` -> reads `karaoke_packages`

## 2. Public booking flow — rework `BookingPanel.tsx`

Keep the existing Bears Den visual shell. Replace mock state with live data.

Steps (one panel, animated step transitions):
1. **Date** — 28-day picker, disabled days where no slots configured / all booked.
2. **Slot** — list of that day's `karaoke_slots` with availability badge ("Available" / "Booked"). Inline note: "2 hour booth — 15 min welcome drink, 90 min sing, 15 min clean-down."
3. **Party size** — slider 2–16, live total readout.
4. **F&B** — two fieldsets (drink / food), 3 placeholder cards each, optional radio per group, "No package" allowed. Price shows "TBC" when null.
5. **Your details** — name, email, phone, notes.
6. **Deposit (dummy)** — explainer card "Phase 1: no card needed. A £X deposit per head will be required when payments go live." Confirm button calls `create_karaoke_booking` with `deposit_status='dummy_paid'`.
7. **Confirmation moment** — see §3.

State managed locally; on success route to `/town/karaoke/manage/:token` link is shown but the confirmation screen stays mounted.

## 3. Confirmation moment — VHS strip

New `src/components/karaoke/BookingConfirmation.tsx`:
- Looping retro VHS / karaoke GIF strip (3–4 stacked horizontal marquees with brand frames already in `/public/lovable-uploads`, plus CSS scanlines + chromatic-aberration overlay using existing tokens — no AI imagery).
- Headline "Booth held. Warm up the pipes."
- Booking summary card: date, slot window, usable window callout, party size, F&B, manage link, ICS download.
- Secondary CTAs: "Manage booking", "Add to calendar" (generate ICS client-side), "Back to Karaoke".

## 4. Guest self-service — `/town/karaoke/manage/:token`

New route + page `src/pages/karaoke/ManageBooking.tsx`:
- Resolves token via `get_karaoke_booking_by_token`. 404-style "Link invalid" state.
- Shows current booking + cut-off banner (24h before `slot_start`).
- If outside cut-off:
  - Reschedule (date + slot picker, reuses §2 components, only shows slots free for new date).
  - Change party size (2–16 slider).
  - Add / remove F&B packages.
  - Cancel booking (confirm dialog, free-text reason).
- Each save fires `update_karaoke_booking_by_token` then re-invokes guest + venue emails with `idempotencyKey` based on `booking_id + updated_at`.
- Inside cut-off: read-only with "Call us to change" message + tel link.

Register route in `src/App.tsx` (or wherever Town routes live).

## 5. Transactional email templates

Create under `supabase/functions/_shared/transactional-email-templates/`:
- `karaoke-guest-confirmation.tsx` — Bears Den styled, includes 15 / 90 / 15 timing block, F&B summary, manage link, calendar link.
- `karaoke-guest-update.tsx` — "Your booking has changed", diff-style summary.
- `karaoke-guest-cancellation.tsx`.
- `karaoke-venue-reservation-sheet.tsx` — full reservation sheet to `neil.fincham-dukes@crazybear.co.uk`: guest details, party size, slot windows, F&B, special notes, manage link for staff reference.
- `karaoke-venue-update.tsx` / `karaoke-venue-cancellation.tsx`.

Register all six in `registry.ts`. Deploy `send-transactional-email`.

Wire invocations from §2 (create) and §4 (update / cancel). Venue email recipient pulled from `karaoke_settings.venue_email` (placeholder set to Neil's address) via a small `get-karaoke-venue-email` RPC.

## 6. Management surface — `/management/karaoke`

New section added to existing management sidebar/nav.

Pages:
- **Calendar** — month view of bookings, click day -> drawer with slot-by-slot list, status pills.
- **Bookings list** — sortable table (date, slot, guest, party, F&B, status), filters (date range, status), CSV export, row click -> detail drawer with full audit log from `karaoke_booking_audit`. Staff can cancel (status `cancelled_by_venue`) with reason -> triggers guest cancellation email.
- **Slots** — edit `karaoke_slots` (toggle weekday availability, change windows if needed — defaults already seeded).
- **Packages** — CRUD `karaoke_packages` (kind/name/description/price).
- **Settings** — edit `karaoke_settings.venue_email` and cancellation cut-off hours.

All writes via management-scoped RPCs (already created) gated by existing admin role check.

CMS entry: add to management nav per project rule "every new page added needs CMS editing".

## 7. Out of scope (Phase 2)

- Real Stripe deposit charging — `deposit_amount_pennies` and `useDepositCheckout()` are wired so the swap is one component.
- Final F&B pricing — placeholders stay TBC.
- Multi-room.

## Technical notes

- All currency in pennies (GBP, £).
- ICS generated client-side, no new dependency.
- No lucide icons, no em dashes, no AI imagery — VHS effect built from existing brand frames + CSS.
- British English throughout copy.
- Existing karaoke layout left alone except `BookingPanel.tsx` internals (per memory rule).
