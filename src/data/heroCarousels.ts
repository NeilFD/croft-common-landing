// Triptych hero carousels for /town and /country
import town01 from "@/assets/cb-carousel-new/town-01.jpg"; // blue glittery bedroom
import town02 from "@/assets/cb-carousel-new/town-02.jpg"; // teal room with copper bath
import town05 from "@/assets/cb-carousel-new/town-05.jpg"; // chandelier lounge
import town03 from "@/assets/cb-carousel-new/town-03.jpg"; // dark gold bed room
import town04 from "@/assets/cb-carousel-new/town-04.jpg"; // cocktails by fire
import town06 from "@/assets/cb-carousel-new/town-06.jpg"; // thai food plates

import countryA from "@/assets/cb-carousel/country-snug-bedroom-crazy-bear-stadhampton-bed.jpg";
import countryB from "@/assets/cb-carousel/country-snug-red-bedroom-crazy-bear-stadhampton.jpg";
import countryC from "@/assets/cb-carousel/country-cosy-bedroom-crazy-bear-stadhampton-sofa.jpg";
import countryD from "@/assets/cb-carousel/country-purple-cosy-bedroom-crazy-bear-stadhampton-bed.jpg";
import countryE from "@/assets/cb-carousel/country-boujee-bedroom-crazy-bear-stadhampton-bedroom-with-bath.jpg";
import countryF from "@/assets/cb-carousel/country-boujee-bedroom-crazy-bear-stadhampton-chandelier.jpg";
import countryG from "@/assets/cb-carousel/country-decadent-bedroom-crazy-bear-stadhampton-copper-bathtub.jpg";
import countryH from "@/assets/cb-carousel/country-stadhampton-room-copper-bathtub.jpg";

export const heroCarouselMap: Record<string, string[]> = {
  "/town": [town02, town01, town05, town03, town04, town06],
  "/country": [countryA, countryB, countryC, countryD, countryE, countryF, countryG, countryH],
};

export const getHeroCarouselFor = (path: string): string[] | undefined =>
  heroCarouselMap[path];
