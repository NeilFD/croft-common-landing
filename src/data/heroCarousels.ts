// Triptych hero carousels for /town and /country
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

// Room-only subsets for the Rooms hero
const townRoomImages = [town02, town01, town05, town03];
const countryRoomImages = [country02, country04, country01];

export const heroCarouselMap: Record<string, string[]> = {
  "/town": [town02, town01, town05, town03, town04, town06],
  "/country": [country02, country04, country01, country03, country05, country06],
  "/town/rooms": townRoomImages,
  "/country/rooms": countryRoomImages,
};

export const getHeroCarouselFor = (path: string): string[] | undefined =>
  heroCarouselMap[path];
