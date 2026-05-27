## Karaoke Booking Engine — Phase 1

Build out the existing `/town/karaoke` `BookingPanel` into a real reservation system. Single karaoke room, one booking per 2-hour slot (90 min usable + 15 min brief + 15 min turnover). Visual styling of the karaoke page is preserved — only the booking form and confirmation get rewired.

### 1. Data model (Lovable Cloud)

New tables (with GRANTs + RLS):

- `karaoke_slots` — config of bookable windows per weekday (`day_of_week`, `start_time`, `end_time`, `is_active`). Seeded with 12–2, 2–4, 4–6, 6–8 daily. Editable in Management later.
- `karaoke_bookings`
  - `id`, `slot_date` (date), `slot_start`, `slot_end`
  - `guest_first_name`, `guest_last_name`, `guest_email`, `guest_phone`
  - `party_size` (int, check 2–16)
  - `food_package_id` (nullable, fk to `karaoke_packages`)
  - `drink_package_id` (nullable, fk to `karaoke_packages`)
  - `notes`
  - `status`: `pending_payment` | `confirmed` | `cancelled` | `cancelled_by_venue`
  - `manage_token` (uuid, indexed) — used in guest manage link
  - `deposit_status`: `dummy_paid` | `paid` | `refunded` | `not_required` (phase 1 default `dummy_paid`)
  - `deposit_amount_pennies` (int, nullable for phase 1)
  - `cancelled_at`, `cancelled_reason`
  - `created_at`, `updated_at`
  - Unique index on `(slot_date, slot_start)` WHERE `status IN ('pending_payment','confirmed')` — enforces single-room exclusivity.
- `karaoke_packages` — placeholder F&B catalogue. `kind` (`food`|`drink`), `name`, `description`, `price_per_person_pennies` (nullable until pricing confirmed), `sort_order`, `is_active`. Seeded with 3 food + 3 drink placeholders.
- `karaoke_booking_audit` — append-only log of state changes (who, when, from→to, source: guest/management/system).

RLS:
- Public can `SELECT` only `karaoke_slots` and active `karaoke_packages`.
- Public availability check goes through a `SECURITY DEFINER` RPC `get_karaoke_availability(p_from date, p_to date)` returning per-day/per-slot `available|gone` (never exposing guest data).
- Booking insert/update/cancel goes through SECURITY DEFINER RPCs:
  - `create_karaoke_booking(payload jsonb)` — validates party size, slot exists, slot free, then inserts with `status='confirmed'` (phase 1) + `deposit_status='dummy_paid'`. Returns `id` + `manage_token`.
  - `get_karaoke_booking_by_token(p_token uuid)` — returns booking + packages.
  - `update_karaoke_booking_by_token(p_token uuid, patch jsonb)` — reschedule (date/slot) and party size only; re-checks availability and 2–16 bounds.
  - `cancel_karaoke_booking_by_token(p_token uuid, p_reason text)`.
- Management role (`admin`/`sales`/`ops`) gets full read + RPCs for venue-side edit/cancel/override.

### 2. Public booking flow (`/town/karaoke`)

`BookingPanel.tsx` reworked behind the same visual shell:

1. **Day picker** — next 28 days (scrollable past the current week).
2. **Slot picker** — pulls live availability from `get_karaoke_availability`. Slot row makes the "90 min usable + 15 in / 15 out" rule explicit underneath the slot label.
3. **Party size** — slider clamped 2–16 (was 2–12). Live "min 2 / max 16" microcopy.
4. **F&B packages** — two new fieldsets ("Food", "Drinks") rendering active `karaoke_packages` as selectable cards. "Pricing tbc" badge when price is null. None-selected is allowed.
5. **Details** — name (split first/last), email, phone, optional notes. Zod-validated client + server.
6. **Dummy deposit step** — a "Pay deposit (test mode)" button that completes instantly with a `dummy_paid` status. Phase 2 swaps this for the real Stripe Embedded Checkout call without changing the UI contract.
7. **Submit** → calls `create_karaoke_booking` RPC → returns `id` + `manage_token` → navigates to confirmation.

### 3. Confirmation moment

New full-bleed `BookingConfirmation` overlay inside the karaoke shell:

- Looping retro VHS/karaoke GIF strip across the top (3–4 stacked GIFs from existing brand assets / Giphy embeds), tracking lines + chroma offset, all wrapped in karaoke neon/blood palette.
- Big `kar-display` headline: **"Booth held. Warm up the pipes."**
- Booking summary (day, slot, 90 min usable, party, F&B selections).
- Two CTAs: "Manage booking" (deep links to `/town/karaoke/manage/{token}`) and "Add to calendar" (ICS download).
- Marquee ticker underneath: "No encores refused · Be there by [start-15min] · Booth opens at [start]".

### 4. Guest self-service (`/town/karaoke/manage/:token`)

New public route, no auth, token-gated. Resolves booking via `get_karaoke_booking_by_token`.

- Shows current booking + a "What you can do" panel: reschedule (date/slot), change party size (2–16), add/remove F&B packages, cancel.
- Cut-off rule: changes & cancellations disabled within 24h of `slot_start` (server enforces).
- Reschedule uses the same availability widget as the booking page.
- Every change fires a transactional email update ("Your karaoke booking has changed") and a venue email reservation sheet refresh.

### 5. Transactional emails (Lovable email infra)

Two new React Email templates registered with `send-transactional-email`:

- `karaoke-guest-confirmation` — to guest. Includes 90 min usable + 15 in / 15 out wording, full party + F&B summary, "Manage your booking" button → `https://www.crazybear.app/town/karaoke/manage/{token}`, cancellation cut-off note.
- `karaoke-venue-reservation-sheet` — to `neil.fincham-dukes@crazybear.co.uk` (placeholder, single config row in `karaoke_settings` table so it can be swapped in Management without a code change). Full reservation sheet: guest details, party, F&B, notes, slot timing, booking ref.

Triggers, each idempotency-keyed by booking id + event:
- New booking → both emails.
- Reschedule / party / F&B change → "updated" variants of both.
- Cancellation (guest or venue) → "cancelled" variants of both.

Email infra setup: call `email_domain--setup_email_infra` (if not present) then `email_domain--scaffold_transactional_email` and add the two templates to `registry.ts`.

### 6. Management surface (`/management/karaoke`)

New sidebar entry under the Spaces grouping. Three sub-pages:

- **Karaoke calendar** — month + week view of every booking, colour-coded by status. Click a booking → drawer with full details, party, F&B, notes, audit log; actions: edit, cancel (with reason), mark no-show, resend confirmation email. Filters: date range, status.
- **Karaoke bookings list** — table view (date, slot, guest, party, F&B, status, deposit) with search, status filters, CSV export.
- **Karaoke settings** — manage `karaoke_slots` (toggle individual weekday slots on/off, change start/end times), edit `karaoke_packages` (placeholder names + descriptions; price left "tbc" until phase 2), and edit the venue email recipient.

All actions go through the management RPCs and write to `karaoke_booking_audit`. Cancellations and edits trigger the same guest + venue transactional emails.

### 7. CMS integration

Per project rule: every new page registered in the CMS management system.

- Register `/town/karaoke/manage/:token` in the CMS page registry (noindex) so the route is visible/manageable.
- Add `/management/karaoke`, `/management/karaoke/bookings`, `/management/karaoke/settings` to the management nav + access control table.

### 8. Phase 2 hooks (built but inert in phase 1)

- `karaoke_bookings.deposit_amount_pennies` + `karaoke_packages.price_per_person_pennies` already wired into the data model.
- The "Pay deposit" button is a single `useDepositCheckout()` hook returning a stub success in phase 1. Phase 2 replaces the hook body with a Stripe Embedded Checkout session that creates a `pending_payment` booking, then promotes to `confirmed` + `deposit_status='paid'` on webhook.
- A `karaoke-deposit` Stripe product + price will be added in phase 2 once per-head deposit amount is confirmed.
- Venue email recipient + F&B copy/prices already editable from Management, so no code change needed when finalised.

### Technical notes

- All currency in pennies (GBP, `£`). British English copy throughout.
- Visual styling of `/town/karaoke` shell preserved per memory rule — only `BookingPanel` internals and a new confirmation overlay change. No new fonts/colours.
- Karaoke confirmation GIFs sourced as static assets in `src/assets/karaoke/` (or remote Giphy iframes) — agreed before build.
- Slot timing helper centralised in `src/lib/karaoke/slots.ts` (formatting, brief/turnover windows, cut-off logic) so client + edge functions share one source of truth.
- Edge functions:
  - `send-transactional-email` already exists (or scaffolded) — only template additions.
  - All booking write operations are SECURITY DEFINER Postgres functions invoked via `supabase.rpc(...)`; no custom send-only edge function needed.

### Out of scope (this plan)

- Real Stripe deposit charging (phase 2).
- Final F&B pricing (placeholder until provided).
- Multi-room support (single room assumption baked in).
- Native push notifications for the venue (email reservation sheet only for now).
