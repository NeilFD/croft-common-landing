import stadhampton from "@/assets/stadhampton-property.jpg";
import beaconsfield from "@/assets/beaconsfield-property.jpg";
import pub from "@/assets/cb-hero-pub.jpg";
import rooms from "@/assets/cb-hero-rooms.jpg";
import events from "@/assets/cb-hero-events.jpg";
import parties from "@/assets/cb-hero-parties.jpg";
import thai from "@/assets/cb-hero-thai.jpg";
import cocktails from "@/assets/cb-hero-cocktails.jpg";
const pool = "/lovable-uploads/cb-outdoor-terrace-stadhampton.jpg";
import blackBear from "@/assets/cb-hero-blackbear.jpg";

export const propertyHeroMap: Record<string, string> = {
  "/country": stadhampton,
  "/country/pub": pub,
  "/country/pub/food": pub,
  "/country/pub/drink": cocktails,
  "/country/pub/hospitality": pub,
  "/country/rooms": rooms,
  "/country/rooms/types": rooms,
  "/country/rooms/gallery": rooms,
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
  "/town/rooms": rooms,
  "/town/rooms/types": rooms,
  "/town/rooms/gallery": rooms,
  "/town/pool": pool,
};

export const getHeroFor = (path: string, fallback: string) =>
  propertyHeroMap[path] ?? fallback;
