/**
 * Mews booking-engine hotels.
 *
 * Single source of truth for every "Book a room" CTA. The configurationId
 * is the GUID from Mews → Booking engines → Default → Identifier.
 */

export type MewsHotelKey = "beaconsfield" | "stadhampton";

export interface MewsHotel {
  /** Display label for the modal title and aria-label. */
  label: string;
  /** Property scope — drives accent colour in the modal. */
  property: "town" | "country";
  /** Mews booking-engine configuration id (the Identifier in Mews). */
  configurationId: string;
  /** Mews city id (used by the distributor URL fallback). */
  cityId: string;
  /** Direct Mews-hosted booking page (fallback if widget script fails). */
  fallbackUrl: string;
}

export const MEWS_HOTELS: Record<MewsHotelKey, MewsHotel> = {
  beaconsfield: {
    label: "The B&B at Beaconsfield",
    property: "town",
    configurationId: "690b25ab-866e-447f-aedd-b1490084c2bb",
    cityId: "4f085e2c-9847-4551-a6f6-b14900838fa5",
    fallbackUrl:
      "https://app.mews.com/distributor/690b25ab-866e-447f-aedd-b1490084c2bb",
  },
  stadhampton: {
    label: "The Rooms at Stadhampton",
    property: "country",
    configurationId: "475876b0-3ae2-4a28-8c0e-b14900821585",
    cityId: "eb0fb60d-8188-4108-8e7a-aee400d0f366",
    fallbackUrl:
      "https://app.mews.com/distributor/475876b0-3ae2-4a28-8c0e-b14900821585",
  },
};
