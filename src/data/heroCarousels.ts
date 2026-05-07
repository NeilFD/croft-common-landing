// Triptych hero carousels for /town and /country
import townHero from "@/assets/cb-hero-rooms-town.jpg"; // blue room with copper bath
import townA from "@/assets/cb-carousel/town-snug-bedroom-at-crazy-bear-beaconsfield-whole-room.jpg";
import townB from "@/assets/cb-carousel/town-snug-bedroom-at-crazy-bear-beaconsfield-pink.jpg";
import townC from "@/assets/cb-carousel/town-cosy-bedroom-at-crazy-bear-beaconsfield-mirrored.jpg";
import townD from "@/assets/cb-carousel/town-cosy-bedroom-at-crazy-bear-beaconsfield-red.jpg";
import townE from "@/assets/cb-carousel/town-cosy-bedroom-at-crazy-bear-beaconsfieldstiars.jpg";
import townF from "@/assets/cb-carousel/town-boujee-bedroom-at-crazy-bear-beaconsfield-copper-bath.jpg";
import townG from "@/assets/cb-carousel/town-boujee-bedroom-at-crazy-bear-beaconsfield-slanted-floor.jpg";
import townH from "@/assets/cb-carousel/town-crazy-bear-beaconsfield-decadent-bedroom-with-roll-top-bath.jpg";

import countryA from "@/assets/cb-carousel/country-snug-bedroom-crazy-bear-stadhampton-bed.jpg";
import countryB from "@/assets/cb-carousel/country-snug-red-bedroom-crazy-bear-stadhampton.jpg";
import countryC from "@/assets/cb-carousel/country-cosy-bedroom-crazy-bear-stadhampton-sofa.jpg";
import countryD from "@/assets/cb-carousel/country-purple-cosy-bedroom-crazy-bear-stadhampton-bed.jpg";
import countryE from "@/assets/cb-carousel/country-boujee-bedroom-crazy-bear-stadhampton-bedroom-with-bath.jpg";
import countryF from "@/assets/cb-carousel/country-boujee-bedroom-crazy-bear-stadhampton-chandelier.jpg";
import countryG from "@/assets/cb-carousel/country-decadent-bedroom-crazy-bear-stadhampton-copper-bathtub.jpg";
import countryH from "@/assets/cb-carousel/country-stadhampton-room-copper-bathtub.jpg";

export const heroCarouselMap: Record<string, string[]> = {
  "/town": [townHero, townA, townB, townC, townD, townE, townF, townG, townH],
  "/country": [countryA, countryB, countryC, countryD, countryE, countryF, countryG, countryH],
};

export const getHeroCarouselFor = (path: string): string[] | undefined =>
  heroCarouselMap[path];
