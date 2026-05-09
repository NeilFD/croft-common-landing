## Thai Takeaway — Members' Collection Ordering

Replace the existing /den/member/lunch-run page with a properly Crazy Bear branded Thai takeaway flow for collection. Members pick a site (Town or Country), browse a shared menu tagged per site, build an order, and submit for collection. Kitchen confirms a ready time by phone.

### User journey

```
Den Home  ->  Tap "Takeaway" chip
         ->  /den/member/lunch-run
              1. Pick site (Town / Country)            [tile chooser]
              2. Browse menu, filtered by selected site [tabs: Starters / Mains / Desserts / Drinks]
              3. Add to basket (sticky basket bar)
              4. Review basket
              5. Enter name + phone (prefilled from cb_members) + optional notes
              6. Confirm order
              7. Confirmation screen: "We'll text you when it's ready, usually 30 minutes"
                 - Shows collection address for chosen site
                 - Order reference
```

Member can switch sites at the top of the menu (warns if basket has items from items not available at the new site).

### Visual / brand

- Black background, Archivo Black headings, Space Grotesk body, mono eyebrows — matches Bear's Den.
- Hero strip uses `cb-hero-thai.jpg` with a Town/Country tile chooser overlay.
- Dish cards use `town-06.jpg` and `country-05.jpg` (the existing Thai food carousel images) as section banners. Individual dishes stay text + price for now (no per-dish photos yet).
- Site tag chips on each item: small mono label "Town", "Country", or "Both".
- No focus rings on selected items; selected dish card uses inverted (white bg / black text) treatment.

### Menu data

The `lunch_menu` table already has the 11 Thai dishes. Add one schema field:

- `site` text — values `town`, `country`, or `both`. Default `both`.

Then categorise the existing 11 items via the data tool (rough split — confirmable later in admin):
- Pad Thai Prawn — both
- Green Curry Chicken — both
- Massaman Beef — country
- Tofu Pad See Ew — town
- Tom Yum Soup — both
- Crispy Spring Rolls — both
- Chicken Satay — both
- Mango Sticky Rice — both
- Singha Beer — both
- Thai Iced Tea — both
- Coconut Water — both

### Order data

`lunch_orders` already exists (user_id, order_date, items jsonb, total_amount, status). Add:

- `site` text — `town` or `country`
- `member_name` text
- `member_phone` text
- `notes` text

The existing `create-lunch-order` edge function gets updated to persist site, name, phone, notes.

### Files to change

- `src/pages/LunchRun.tsx` — full rebuild (site picker -> menu -> basket -> details -> confirm), Crazy Bear styling, new collection copy. Replaces all delivery/address language.
- `src/hooks/useLunchRun.ts` — add `site` to MenuItem, accept `site` filter, pass through on submit.
- `src/components/MemberHome.tsx` — relabel chip from "Takeaway" to "Thai Takeaway" (route stays `/den/member/lunch-run`).
- `supabase/functions/create-lunch-order/index.ts` — accept and store site / contact / notes.
- Migration: add `site` column to `lunch_menu`, add `site / member_name / member_phone / notes` to `lunch_orders`.
- Data update (insert tool): set `site` value on each of the 11 existing dishes.

### Out of scope (this round)

- Per-dish photography
- Payments (collection only, paid on pickup)
- Capacity limits or cut-off times
- Admin UI for editing menu (existing direct-DB edits remain)
- Push/email notifications to the kitchen (future iteration)

### Technical notes

- Site selection persisted in `localStorage` so a returning member skips step 1.
- Basket persisted in `localStorage` keyed by site so a refresh does not lose the order.
- Confirmation screen shows: order ref (last 8 of UUID), site collection address, member phone for SMS, plain English copy: "Ready in about 30 minutes. We'll call when it's bagged."
- Town address: 75 Wycombe End, Beaconsfield HP9 1LX.
- Country address: Bear Lane, Stadhampton OX44 7UR.
