/**
 * SevenRooms reservation venues.
 *
 * Single source of truth for every "Book a table" CTA across the site.
 * Edit a URL or slug here and every booking surface updates.
 *
 * The SevenRooms widget pulls live availability, party-size rules and
 * service times from the venue's SevenRooms account — nothing to maintain
 * on the website side beyond the slug.
 */

export type SevenRoomsVenueKey =
  | "beaconsfield"      // Town: Black Bear + B&B share one widget
  | "beaconsfield-thai" // Town: Hom Thai
  | "stadhampton-oak";  // Country: The Pub at Stadhampton

export interface SevenRoomsVenue {
  /** Display label for the modal title and aria-label. */
  label: string;
  /** Property scope — drives accent colour in the modal. */
  property: "town" | "country";
  /** Full SevenRooms search URL. */
  url: string;
}

export const SEVENROOMS_VENUES: Record<SevenRoomsVenueKey, SevenRoomsVenue> = {
  "beaconsfield": {
    label: "The Black Bear & The B&B",
    property: "town",
    url: "https://www.sevenrooms.com/explore/beaconsfield/reservations/create/search/",
  },
  "beaconsfield-thai": {
    label: "Hom Thai",
    property: "town",
    url: "https://www.sevenrooms.com/explore/beaconsfieldthai/reservations/create/search/",
  },
  "stadhampton-oak": {
    label: "The Pub at Stadhampton",
    property: "country",
    url: "https://www.sevenrooms.com/explore/OAK/reservations/create/search/",
  },
};

/** Parse a sentinel href like `sevenrooms:beaconsfield` used in CMS-driven CTAs. */
export const parseSevenRoomsHref = (
  href: string | undefined
): SevenRoomsVenueKey | null => {
  if (!href) return null;
  const match = href.match(/^sevenrooms:(.+)$/);
  if (!match) return null;
  const key = match[1] as SevenRoomsVenueKey;
  return key in SEVENROOMS_VENUES ? key : null;
};
