import stadhampton from "@/assets/cb-hero-country-new.jpg";
import beaconsfield from "@/assets/cb-hero-town-new.jpg";
import pub from "@/assets/cb-hero-pub.jpg";
import events from "@/assets/cb-hero-events.jpg";
import parties from "@/assets/cb-hero-parties.jpg";
import thai from "@/assets/cb-hero-thai.jpg";
import cocktails from "@/assets/cb-hero-cocktails.jpg";
import pool from "@/assets/hero-final-poolside.png";
import blackBear from "@/assets/cb-hero-blackbear.jpg";
import chefPlating from "@/assets/idea-chef-plating.jpg";
import englishMenu from "@/assets/hero-english-menu.png";

// Carousel room shots reused as room page heroes
import country01 from "@/assets/cb-carousel-new/country-01.jpg"; // red velvet room with copper bath
import country02 from "@/assets/cb-carousel-new/country-02.jpg"; // barn-beam suite
import country04 from "@/assets/cb-carousel-new/country-04.jpg"; // copper bath close-up
import town01 from "@/assets/cb-carousel-new/town-01.jpg"; // blue glittery bedroom
import town02 from "@/assets/cb-carousel-new/town-02.jpg"; // teal room with copper bath
import town03 from "@/assets/cb-carousel-new/town-03.jpg"; // dark gold bed room

// Legacy glamour stills (kept for non-room routes / fallback)
import roomsCountry from "@/assets/cb-hero-rooms-country.jpg";
import roomsTown from "@/assets/cb-hero-rooms-town.jpg";
import roomCopperSuite from "@/assets/cb-rooms-copper-suite.jpg";
import roomFireplace from "@/assets/cb-rooms-fireplace.jpg";

export const propertyHeroMap: Record<string, string> = {
  "/country": roomCopperSuite,
  "/country/pub": pub,
  "/country/pub/food": englishMenu,
  "/country/pub/drink": cocktails,
  "/country/pub/hospitality": pub,
  "/country/rooms": roomsCountry,
  "/country/rooms/types": country02,
  "/country/rooms/gallery": country01,
  "/country/parties": parties,
  "/country/events": events,
  "/country/events/weddings": events,
  "/country/events/birthdays": parties,
  "/country/events/business": events,

  "/town": roomsTown,
  "/town/food": blackBear,
  "/town/food/black-bear": chefPlating,
  "/town/food/bnb": chefPlating,
  "/town/food/hom-thai": chefPlating,
  "/town/drink": cocktails,
  "/town/drink/cocktails": cocktails,
  "/town/rooms": roomsTown,
  "/town/rooms/types": town01,
  "/town/rooms/gallery": town03,
  "/town/pool": pool,
};

// Routes whose hero image should be shown in full (contain) instead of cover.
// Useful when the source image is tightly cropped and we want more perspective.
export const heroFitMap: Record<string, "cover" | "contain"> = {};

// Extra glamour stills available for galleries / future use
export const roomsGalleryAssets = {
  fireplace: roomFireplace,
};

export const getHeroFor = (path: string, fallback: string) =>
  propertyHeroMap[path] ?? fallback;

export const getHeroFitFor = (path: string): "cover" | "contain" =>
  heroFitMap[path] ?? "cover";
