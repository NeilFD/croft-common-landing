// Triptych hero carousels for /town and /country
// Existing property photography stays as the spine; Brand 2026 imagery
// from the new direction deck is layered in to warm the rotation.
import town01 from "@/assets/cb-carousel-new/town-01.jpg"; // blue glittery bedroom
import town02 from "@/assets/cb-carousel-new/town-02.jpg"; // teal room with copper bath
import town05 from "@/assets/cb-carousel-new/town-05.jpg"; // chandelier lounge
import town03 from "@/assets/cb-carousel-new/town-03.jpg"; // dark gold bed room
import town04 from "@/assets/cb-carousel-new/town-04.jpg"; // cocktails by fire
import town06 from "@/assets/cb-carousel-new/town-06.jpg"; // thai food plates

import country01 from "@/assets/cb-carousel-new/country-01.jpg"; // red velvet room with copper bath
import country02 from "@/assets/cb-carousel-new/country-02.jpg"; // barn-beam suite
import country03 from "@/assets/cb-carousel-new/country-03.jpg"; // terrace firepit
import country04 from "@/assets/cb-carousel-new/country-04.jpg"; // copper bath close-up
import country05 from "@/assets/cb-carousel-new/country-05.jpg"; // thai food spread
import country06 from "@/assets/cb-carousel-new/country-06.jpg"; // red bus reception

// Brand 2026 — Town glamour / after-hours frames
import b26TownChampagne from "@/assets/brand-2026/town-press-champagne.jpg";
import b26TownLateCheckout from "@/assets/brand-2026/town-late-checkout.jpg";
import b26TownDoorHanger from "@/assets/brand-2026/town-door-hanger.jpg";
import b26TownNoReservations from "@/assets/brand-2026/town-no-reservations.jpg";
import b26TownRedVelvet from "@/assets/brand-2026/town-red-velvet.jpg";
import b26TownBedBreakfast from "@/assets/brand-2026/town-bed-breakfast.jpg";

// Brand 2026 — Country nostalgia / garden frames
import b26CountryFirepit from "@/assets/brand-2026/country-firepit.jpg";
import b26CountryLongTable from "@/assets/brand-2026/country-long-table.jpg";
import b26CountryGrill from "@/assets/brand-2026/country-grill-grapes.jpg";
import b26CountryDisco from "@/assets/brand-2026/country-discoball-dark.jpg";
import b26CountryVinyl from "@/assets/brand-2026/country-vinyl.jpg";
import b26CountryBalloons from "@/assets/brand-2026/country-balloons-dj.jpg";

// Room-only subsets for the Rooms hero
const townRoomImages = [town02, town01, town05, b26TownRedVelvet, town03];
const countryRoomImages = [country02, country04, country01];

export const heroCarouselMap: Record<string, string[]> = {
  // Town landing — glamour first, property shots underneath
  "/town": [
    b26TownChampagne,
    town02,
    b26TownLateCheckout,
    town01,
    b26TownDoorHanger,
    town05,
    b26TownNoReservations,
    town03,
    town04,
    b26TownBedBreakfast,
    town06,
  ],
  // Country landing — nostalgia + property shots
  "/country": [
    b26CountryFirepit,
    country02,
    b26CountryLongTable,
    country04,
    b26CountryGrill,
    country01,
    b26CountryDisco,
    country03,
    b26CountryVinyl,
    country05,
    b26CountryBalloons,
    country06,
  ],
  "/town/rooms": townRoomImages,
  "/country/rooms": countryRoomImages,
};

export const getHeroCarouselFor = (path: string): string[] | undefined =>
  heroCarouselMap[path];
