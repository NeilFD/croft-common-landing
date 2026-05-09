## Phase 1 — UI, design, copy, email routing

Goal: make /event-enquiry look and sound like Crazy Bear (consistent with /curious, /enquire, /book, /den/main) and route all enquiry emails to a temp address.

### 1.1 Visual rebrand
- Replace background block in `src/pages/EventEnquiry.tsx` with the same neon B&W backdrop used elsewhere (`@/assets/den-bg-neon.jpg`, no `grayscale`, soft white wash so the pink Reception sign shows through).
- Header: replace "Plan Your Event" / "Back to Hall" lockup with the brutalist Crazy Bear bar (CB mark + wordmark, mono caption "Plan Your Event", monochrome Back link going to `/curious` instead of `/hall`).
- Wrap chat + review cards in the translucent brutalist card pattern: `bg-white/80 backdrop-blur-sm border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.9)]`, removing the existing pale rounded card.

### 1.2 Chat surface restyle (`src/components/enquiry/EventEnquiryChat.tsx` + `.css`)
- Strip the pale-pink "croft" bubble theme. Assistant messages: no background, plain black text on the translucent card. User messages: solid black bubble, white text, sharp corners.
- Replace the input row with the brutalist input style used in /curious (2px black border, mono uppercase placeholder, hot-pink hover/focus accent on the send button).
- Replace the lucide `ArrowLeft` and the wave emoji intro line with brand voice copy ("Right. Tell the Bear what you're planning.").
- Remove the "Croft Common" mailto block; replace with mono caption pointing at the new email (see 1.4) and brand voice fallback line.

### 1.3 Review screen (`src/components/enquiry/EnquiryReview.tsx`)
- Same translucent card + brutalist border treatment.
- Convert Croft-style headings to Crazy Bear: ALL CAPS Archivo Black section titles, mono `/ / /` rules, hot-pink `accent-pink` only on the primary CTA hover.
- Rename "Croft Common" everywhere in this component to "Crazy Bear".

### 1.4 Email routing (temporary)
- `supabase/functions/send-enquiry-confirmation/index.ts`:
  - Change internal recipient from `neil@croftcommon.co.uk` to `neil.fincham-dukes@crazybear.co.uk`.
  - Change customer-facing contact line from `enquiries@croftcommon.co.uk` to `neil.fincham-dukes@crazybear.co.uk`.
  - Swap "Croft Common" branding in the HTML email body for Crazy Bear (logo mark + wordmark + tone of voice).
  - Keep the existing Resend "from" sender domain (already on `notify.crazybeartest.com`); only the "to" + reply-to change.
- `src/components/enquiry/EventEnquiryChat.tsx`: same email swap in the in-chat fallback link.

### 1.5 Misc references
- Rename remaining "Croft Common" mentions inside EventEnquiry surfaces (titles, intro lines, review labels) to "Crazy Bear".
- Update `document.title` / SEO description for /event-enquiry to Crazy Bear.

Phase 1 ships a fully rebranded chat that still uses the existing question flow + AI prompt — no behaviour change yet. You can test the look and email delivery immediately.

---

## Phase 2 — Data + AI questions for proper venue understanding

Goal: replace the generic "stylish members' club" prompt with a Crazy Bear-aware AI that knows each property, its spaces, capacities, room counts, dining venues and typical use cases — so it recommends the right venue.

### 2.1 What we need from you
To build this properly, the Bear needs a structured pack covering:

1. Properties (Town / Country / any future site)
   - Name, location, short positioning line, signature feel.
2. Spaces inside each property (one row per bookable space)
   - Name, slug, short description.
   - Seated capacity, standing capacity, dining capacity.
   - Layouts supported (theatre, cabaret, banquet, reception, ceremony, boardroom).
   - Indoor / outdoor / covered.
   - Step-free access? AV included? Music until what time?
   - Hire fee tier or price range (optional).
   - Best-fit event types (e.g. wedding ceremony, wedding breakfast, drinks reception, private dining, corporate offsite, birthday, wake, product launch, takeover).
   - Any combos that work (e.g. ceremony in X then dinner in Y).
3. Bedrooms (per property)
   - Total room count, room types (Standard / Deluxe / Suite), max occupancy, exclusive-hire option, minimum night stay for events.
4. Food & beverage venues that can be incorporated into events
   - English Restaurant, Thai Restaurant, Bar & Lounge, Garden & Terrace, Private Dining: capacity + format (set menu / canapés / family style / sharing / tasting).
5. Operational rules
   - Minimum spend per day-of-week / season.
   - Earliest / latest event times, music curfews.
   - Exclusivity rules.
   - Lead time required.
6. Tone snippets (3–5 sample answers in the Bears Den voice the AI should mimic when describing each space).

How to deliver it: easiest is a single shared doc or spreadsheet — one tab per property, one row per space — and one tab for bedrooms and one for F&B. I can also give you a CSV template if you'd prefer to fill that in directly. Drop the doc into chat and I'll ingest it.

### 2.2 Schema upgrade
Once the data is in, migrate the database so the AI has structured ground truth:

- Add `venues` rows (Town, Country) with positioning copy.
- Extend `spaces` with: `venue_id`, `capacity_seated`, `capacity_standing`, `capacity_dining`, `layouts text[]`, `indoor_outdoor`, `features text[]`, `event_types text[]`, `combinable_with uuid[]`, `min_spend_notes`, `tone_blurb`.
- New `bedrooms` summary table per venue (counts + types + exclusive-hire flag).
- New `fb_venues` table (per property dining/bar venues with capacity + format).
- Seed all rows from your data pack via migration.

### 2.3 AI prompt + flow rewrite
- Rewrite `supabase/functions/event-enquiry-chat/index.ts` system prompt:
  - Bears Den voice (short, staccato, confident).
  - Crazy Bear specifics: two properties, distinct personalities, signature spaces.
  - Mandatory questions in this order: property preference → event type → date / flexibility → guest count (seated vs standing) → vibe (intimate / lively / formal / outdoor) → F&B style → bedrooms needed (yes/no, how many) → music + curfew expectations → budget range → anything else.
  - Branching logic: if guest count > venue cap, suggest the other property or a combo; if bedrooms requested, pull from `bedrooms` table.
- Rewrite `supabase/functions/generate-event-proposal/index.ts` to:
  - Query `venues + spaces + bedrooms + fb_venues` for the chosen property.
  - Score spaces by capacity fit, layout match, event-type tag overlap.
  - Return a primary recommendation + up to 2 alternatives + suggested combo (e.g. ceremony + dinner + after-party across spaces).
  - Include bedroom suggestion when overnight is needed.
- Update `EnquiryData`, `EnquiryReview`, and the confirmation email template to render the richer recommendation (property, space(s), layout, capacity match, bedrooms, suggested combo, AI reasoning).

### 2.4 Validation
- Two scripted test conversations (small dinner + large wedding) run end-to-end before sign-off.
- Confirmation emails arrive at `neil.fincham-dukes@crazybear.co.uk` with the new Crazy Bear template and the structured recommendation.

---

## What I need from you to start Phase 2
- Confirm Phase 1 can ship now with the temp email.
- Send the Crazy Bear data pack (doc / sheet / CSV) covering the six items in 2.1. Say the word and I'll generate a CSV template for you to fill in.