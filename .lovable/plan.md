# SevenRooms reservation widgets — wired into the site

Drop the four SevenRooms booking flows into the relevant restaurant and pub pages so they work right now and are easy to change later. Keep the design fully Crazy Bear, even though SevenRooms' own UI is the part we don't fully control (see "How much we control" below).

## Mapping


| Venue page                                               | Property | SevenRooms slug        | Widget URL                                                                                                                                                                 |
| -------------------------------------------------------- | -------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/town/food/black-bear`                                  | Town     | `beaconsfield`         | [https://www.sevenrooms.com/explore/beaconsfield/reservations/create/search/](https://www.sevenrooms.com/explore/beaconsfield/reservations/create/search/)                 |
| `/town/food/bnb`                                         | Town     | `beaconsfield`         | same as above                                                                                                                                                              |
| `/town/food/hom-thai`                                    | Town     | `beaconsfieldthai`     | [https://www.sevenrooms.com/explore/beaconsfieldthai/reservations/create/search/](https://www.sevenrooms.com/explore/beaconsfieldthai/reservations/create/search/)         |
| `/pub` (Stadhampton Pub)                                 | Country  | `OAK`                  | [https://www.sevenrooms.com/explore/OAK/reservations/create/search/](https://www.sevenrooms.com/explore/OAK/reservations/create/search/)                                   |
| Country Thai (route to add or attach to `/country/food`) | Country  | `CrazyBearStadhampton` | [https://www.sevenrooms.com/explore/CrazyBearStadhampton/reservations/create/search/](https://www.sevenrooms.com/explore/CrazyBearStadhampton/reservations/create/search/) |


Open question flagged below: where exactly the "Stadhampton Thai" widget lives, since there isn't a dedicated Country Thai page yet.

## What gets built

### 1. Single source of truth

`src/data/sevenroomsVenues.ts`

```ts
export type SevenRoomsVenueKey =
  | "beaconsfield"
  | "beaconsfield-thai"
  | "stadhampton-oak"
  | "stadhampton-thai";

export const SEVENROOMS_VENUES: Record<SevenRoomsVenueKey, {
  label: string;          // "Black Bear & B&B", "Hom Thai", etc.
  slug: string;           // the SevenRooms slug e.g. "beaconsfield"
  property: "town" | "country";
  url: string;            // full search URL
}> = { /* ...all four... */ };
```

One file. Edit a URL or slug here later, every CTA and modal updates instantly.

### 2. One reusable component

`src/components/booking/BookTableButton.tsx`

- Props: `venue: SevenRoomsVenueKey`, optional `label`, optional `variant` (matches existing button variants — e.g. the `Reserve a table` style used in `CBLandingSections`).
- Behaviour: opens a Crazy-Bear-styled modal (`Dialog` from existing shadcn UI) containing a full-height iframe pointed at the venue's SevenRooms URL.
- Modal chrome: black surround, Bowlby One title showing the venue name, property-accent rule (red for Town, teal for Country), close button. Same modal pattern already used elsewhere on the site for consistency.
- Iframe: `width=100%`, `height=min(85vh, 900px)`, `loading="lazy"`, `referrerPolicy="no-referrer-when-downgrade"`, `allow="payment *"` so card capture works. Permission to embed SevenRooms in an iframe should be confirmed with SevenRooms support (note in "Things to confirm").
- Mobile: full-screen sheet rather than centred dialog. Single tap close.
- Fallback link inside the modal: "Booking widget not loading? Open in a new tab" → opens the SevenRooms URL directly. Covers cases where SevenRooms blocks framing via `X-Frame-Options`.

### 3. Where it shows up


| Page                                                     | Placement                                                                                                     |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/town/food/black-bear`                                  | Replace static hero CTA with `<BookTableButton venue="beaconsfield" label="Book a table" />`                  |
| `/town/food/bnb`                                         | Same component, same venue                                                                                    |
| `/town/food/hom-thai`                                    | `venue="beaconsfield-thai"`                                                                                   |
| `/town/food` (Town food landing)                         | Three buttons, one per venue, in the existing landing layout                                                  |
| `/pub`, `/pub/food`, `/pub/drink`                        | `venue="stadhampton-oak"` on the Reserve CTA already present in `PubHero`/`CBLandingSections`                 |
| `/country/food`                                          | Two buttons: Pub (`stadhampton-oak`) and Thai (`stadhampton-thai`) until a dedicated Country Thai page exists |
| `/country/terraces-and-gardens` → Garden Terrace section | Swap the `/book` href for the Country Pub widget (or Thai, your call — see open question)                     |


Any other "Book" / "Reserve" CTA in the codebase points at the same component using the right venue key.

### 4. CMS hook (project rule: every page surface editable)

A new `useCMSText` slot per restaurant page: `booking.venue` (free text, falls back to the venue key in the data file). Editors can override the venue per page from the CMS without a redeploy, but the default mapping above ships hard-coded so it works on day one.

## How much we control (UI/UX)

SevenRooms gives three integration levels. We use the highest level they allow for our account.


| Level                                  | What we control                                                                                                                                      | What we don't                                                                                                                                                                                                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Deep link** (what we'd use today) | Everything around it — button, modal chrome, copy, when/where it opens                                                                               | The entire booking flow once the iframe loads: layout, date picker, party-size widget, confirmation screen, emails. SevenRooms styles it. We can pass a few colour/logo tokens via their venue settings (your SevenRooms admin), but it's a venue-wide theme, not per-page. |
| **B. Embedded Booking Widget**         | Same as A, plus their JS widget renders inline rather than iframed, so it inherits page font size and we can override basic colours via their config | The form fields, validation copy, slot logic, confirmation screen — still SevenRooms                                                                                                                                                                                        |
| **C. SevenRooms Reservations API**     | Everything. We build our own date/party/slot pickers and call their API for availability and booking creation                                        | Requires API partnership approval from SevenRooms, OAuth credentials, PCI scope considerations for payment, ongoing API maintenance                                                                                                                                         |


Recommendation: **start with A**, since that's what the four URLs you've given me support out of the box. Move to B once you confirm with SevenRooms support that the embed script is enabled on your venues — same plumbing on our side, just swap iframe for script tag inside the same `BookTableButton`. C is a larger project, only worth it if you want to keep customers entirely inside the Crazy Bear UI.

What we get either way (and what you should brief your SevenRooms admin on so it looks right inside our modal):

- Upload Crazy Bear logo for each venue
- Set venue primary / accent colour to the property accent (`#4E0000` Town, `#063F47` Country)
- Disable the SevenRooms top nav / "powered by" bar where the venue settings allow it
- Set venue display name to match our site naming (e.g. "The Black Bear", not "Crazy Bear Beaconsfield")

## Things to confirm with you before build

1. **Country Thai widget destination** — there's a SevenRooms slug `CrazyBearStadhampton` for Stadhampton Thai but no dedicated `/country/thai` page on the site yet. Options: (a) attach it to `/country/food` as one of two buttons alongside the Pub, (b) create a new `/country/food/thai` page, (c) drop it on the Country home as a secondary CTA. My default in this plan is (a).  
  
Forget the stadhampton Thai slug for now  

2. **Garden Terrace booking** — Pub (`stadhampton-oak`) or Thai (`stadhampton-thai`)? Currently planning Pub.  
  
Push to oak  

3. **B&B + Black Bear share one widget** — confirmed by you. Both will open the Beaconsfield search. Customer picks which venue inside the SevenRooms flow.  

4. **Iframe vs new tab** — plan defaults to in-page modal with iframe. Tell me if you'd rather have it always open in a new tab (less branded, no embedding risk).  
  
Most brandable option posisble please  

5. **SevenRooms account access** — to make the booking flow itself look like Crazy Bear (logo, accent colour, suppressed SevenRooms branding) someone with SevenRooms admin access needs to update venue settings. Happy to write that brief for you once we agree the plan.  
  
We have done this inside sevenrooms

## Out of scope this round

- Building our own booking flow against the SevenRooms API (Level C).
- Capacity / availability previews on Crazy Bear pages (would need API access).  
  
Doesnt teh booking widget slug pull from our sevenrooms account and tehrefore uses avaialbility time rules to manage any bookings?  

- Booking history / "my reservations" inside the customer's Bear's Den account (separate feature).
- Wiring booking into the karaoke flow (karaoke layout is locked and has its own booking panel).