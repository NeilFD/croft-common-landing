import stadhampton from "@/assets/stadhampton-property.jpg";
import beaconsfield from "@/assets/beaconsfield-property.jpg";
import pub from "@/assets/cb-hero-pub.jpg";
import events from "@/assets/cb-hero-events.jpg";
import parties from "@/assets/cb-hero-parties.jpg";
import thai from "@/assets/cb-hero-thai.jpg";
import cocktails from "@/assets/cb-hero-cocktails.jpg";
const pool = "/lovable-uploads/cb-outdoor-terrace-stadhampton.jpg";
import blackBear from "@/assets/cb-hero-blackbear.jpg";

// Glamorous rooms imagery sourced from Crazy Bear reference projects
import roomsCountry from "@/assets/cb-hero-rooms-country.jpg";
import roomsTown from "@/assets/cb-hero-rooms-town.jpg";
import roomChateauSuite from "@/assets/cb-rooms-chateau-suite.jpg";
import roomRedVelvet from "@/assets/cb-rooms-red-velvet.jpg";
import roomMarbleBath from "@/assets/cb-rooms-marble-bath.jpg";
import roomCopperSuite from "@/assets/cb-rooms-copper-suite.jpg";
import roomFourposter from "@/assets/cb-rooms-fourposter.jpg";
import roomFireplace from "@/assets/cb-rooms-fireplace.jpg";

export const propertyHeroMap: Record<string, string> = {
  "/country": stadhampton,
  "/country/pub": pub,
  "/country/pub/food": pub,
  "/country/pub/drink": cocktails,
  "/country/pub/hospitality": pub,
  "/country/rooms": roomsCountry,
  "/country/rooms/types": roomChateauSuite,
  "/country/rooms/gallery": roomRedVelvet,
  "/country/parties": parties,
  "/country/events": events,
  "/country/events/weddings": events,
  "/country/events/birthdays": parties,
  "/country/events/business": events,

  "/town": beaconsfield,
  "/town/food": blackBear,
  "/town/food/black-bear": blackBear,
  "/town/food/bnb": blackBear,
  "/town/food/hom-thai": thai,
  "/town/drink": cocktails,
  "/town/drink/cocktails": cocktails,
  "/town/rooms": roomsTown,
  "/town/rooms/types": roomCopperSuite,
  "/town/rooms/gallery": roomFourposter,
  "/town/pool": pool,
};

// Extra glamour stills available for galleries / future use
export const roomsGalleryAssets = {
  marbleBath: roomMarbleBath,
  fireplace: roomFireplace,
};

export const getHeroFor = (path: string, fallback: string) =>
  propertyHeroMap[path] ?? fallback;
