import stadhampton from "@/assets/cb-hero-country.jpg";
import beaconsfield from "@/assets/cb-hero-town.jpg";
import pub from "@/assets/cb-hero-pub.jpg";
import events from "@/assets/cb-hero-events.jpg";
import parties from "@/assets/cb-hero-parties.jpg";
import thai from "@/assets/cb-hero-thai.jpg";
import cocktails from "@/assets/cb-hero-cocktails.jpg";
const pool = "/lovable-uploads/cb-outdoor-terrace-stadhampton.jpg";
import blackBear from "@/assets/cb-hero-blackbear.jpg";
import chefPlating from "@/assets/idea-chef-plating.jpg";
import englishMenu from "@/assets/hero-english-menu.png";

// Glamorous rooms imagery sourced from Crazy Bear reference projects
import roomsCountry from "@/assets/cb-hero-rooms-country.jpg";
import roomsTown from "@/assets/cb-hero-rooms-town.jpg";
import roomCopperSuite from "@/assets/cb-rooms-copper-suite.jpg";
import roomFireplace from "@/assets/cb-rooms-fireplace.jpg";

export const propertyHeroMap: Record<string, string> = {
  "/country": stadhampton,
  "/country/pub": pub,
  "/country/pub/food": englishMenu,
  "/country/pub/drink": cocktails,
  "/country/pub/hospitality": pub,
  "/country/rooms": roomsCountry,
  "/country/rooms/types": roomsCountry,
  "/country/rooms/gallery": roomFireplace,
  "/country/parties": parties,
  "/country/events": events,
  "/country/events/weddings": events,
  "/country/events/birthdays": parties,
  "/country/events/business": events,

  "/town": beaconsfield,
  "/town/food": blackBear,
  "/town/food/black-bear": chefPlating,
  "/town/food/bnb": chefPlating,
  "/town/food/hom-thai": chefPlating,
  "/town/drink": cocktails,
  "/town/drink/cocktails": cocktails,
  "/town/rooms": roomsTown,
  "/town/rooms/types": roomCopperSuite,
  "/town/rooms/gallery": roomCopperSuite,
  "/town/pool": pool,
};

// Extra glamour stills available for galleries / future use
export const roomsGalleryAssets = {
  fireplace: roomFireplace,
};

export const getHeroFor = (path: string, fallback: string) =>
  propertyHeroMap[path] ?? fallback;
