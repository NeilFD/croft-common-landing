// Single source of truth for every image slot the public site renders.
// The Assets CMS iterates this list; the live site uses these as fallbacks
// until an admin uploads/publishes a CMS row for that slot.

import { propertyHeroMap } from "./propertyHeroMap";
import { heroCarouselMap } from "./heroCarousels";
import { townGallery, countryGallery, type GalleryItem } from "./galleryData";
import townCultureHero from "@/assets/cb-town-culture-hero.jpg";
import townLook1 from "@/assets/cb-town-culture-look-1-burlesque.jpg";
import townLook2 from "@/assets/cb-town-culture-look-2-homthai.jpg";
import townLook3 from "@/assets/cb-town-culture-look-3-redroom.jpg";
import townLook4 from "@/assets/cb-town-culture-look-4-rococo.jpg";

export type AssetKind = "hero" | "carousel" | "gallery";

export interface AssetSlot {
  /** Page namespace, e.g. "town/pool" (no leading slash) */
  page: string;
  /** Slot key within the page, e.g. "hero", "hero-carousel", "gallery" */
  slot: string;
  kind: AssetKind;
  /** Human-readable label for the CMS UI */
  label: string;
  /** Default images bundled with the build */
  defaults: { src: string; alt?: string; caption?: string }[];
}

const heroFromMap = (path: string): AssetSlot["defaults"] => {
  const src = propertyHeroMap[path];
  return src ? [{ src }] : [];
};

const carouselFromMap = (path: string): AssetSlot["defaults"] =>
  (heroCarouselMap[path] ?? []).map((src) => ({ src }));

const galleryFromArr = (arr: GalleryItem[]): AssetSlot["defaults"] =>
  arr.map((g) => ({ src: g.src, alt: g.alt, caption: g.caption }));

export const cmsImageRegistry: AssetSlot[] = [
  // ----- TOWN -----
  { page: "town", slot: "hero-carousel", kind: "carousel", label: "Town home carousel", defaults: carouselFromMap("/town") },
  { page: "town/food", slot: "hero", kind: "hero", label: "Town Food hero", defaults: heroFromMap("/town/food") },
  { page: "town/food/black-bear", slot: "hero", kind: "hero", label: "The Black Bear hero", defaults: heroFromMap("/town/food/black-bear") },
  { page: "town/food/bnb", slot: "hero", kind: "hero", label: "The B&B hero", defaults: heroFromMap("/town/food/bnb") },
  { page: "town/food/hom-thai", slot: "hero", kind: "hero", label: "Hom Thai hero", defaults: heroFromMap("/town/food/hom-thai") },
  { page: "town/drink", slot: "hero", kind: "hero", label: "Town Drink hero", defaults: heroFromMap("/town/drink") },
  { page: "town/drink/cocktails", slot: "hero", kind: "hero", label: "Town Cocktails hero", defaults: heroFromMap("/town/drink/cocktails") },
  { page: "town/rooms", slot: "hero-carousel", kind: "carousel", label: "Town Rooms carousel", defaults: carouselFromMap("/town/rooms") },
  { page: "town/rooms/types", slot: "hero", kind: "hero", label: "Town Room Types hero", defaults: heroFromMap("/town/rooms/types") },
  { page: "town/rooms/gallery", slot: "hero", kind: "hero", label: "Town Gallery hero", defaults: heroFromMap("/town/rooms/gallery") },
  { page: "town/rooms/gallery", slot: "gallery", kind: "gallery", label: "Town Bedroom gallery", defaults: galleryFromArr(townGallery) },
  { page: "town/pool", slot: "hero", kind: "hero", label: "Town Pool hero", defaults: heroFromMap("/town/pool") },
  {
    page: "town-culture",
    slot: "hero",
    kind: "hero",
    label: "Town Culture hero",
    defaults: [{ src: townCultureHero, alt: "Town bar at night" }],
  },
  {
    page: "town-culture",
    slot: "collage",
    kind: "gallery",
    label: "Town Culture — The Look",
    defaults: [
      { src: townLook1, alt: "Mirrorball burlesque dancers at Town", caption: "The burlesque years" },
      { src: townLook2, alt: "Pineapple prawn curry at Hom Thai", caption: "Hom Thai" },
      { src: townLook3, alt: "Red velvet bedroom with copper bath", caption: "Bedrooms with baths" },
      { src: townLook4, alt: "Black and gold rococo bedroom", caption: "Black on black on black" },
    ],
  },

  // ----- COUNTRY -----
  { page: "country", slot: "hero-carousel", kind: "carousel", label: "Country home carousel", defaults: carouselFromMap("/country") },
  { page: "country/pub", slot: "hero", kind: "hero", label: "Country Pub hero", defaults: heroFromMap("/country/pub") },
  { page: "country/pub/food", slot: "hero", kind: "hero", label: "Country Pub Food hero", defaults: heroFromMap("/country/pub/food") },
  { page: "country/pub/drink", slot: "hero", kind: "hero", label: "Country Pub Drink hero", defaults: heroFromMap("/country/pub/drink") },
  { page: "country/pub/hospitality", slot: "hero", kind: "hero", label: "Country Hospitality hero", defaults: heroFromMap("/country/pub/hospitality") },
  { page: "country/rooms", slot: "hero-carousel", kind: "carousel", label: "Country Rooms carousel", defaults: carouselFromMap("/country/rooms") },
  { page: "country/rooms/types", slot: "hero", kind: "hero", label: "Country Room Types hero", defaults: heroFromMap("/country/rooms/types") },
  { page: "country/rooms/gallery", slot: "hero", kind: "hero", label: "Country Gallery hero", defaults: heroFromMap("/country/rooms/gallery") },
  { page: "country/rooms/gallery", slot: "gallery", kind: "gallery", label: "Country Bedroom gallery", defaults: galleryFromArr(countryGallery) },
  { page: "country/parties", slot: "hero", kind: "hero", label: "Country Parties hero", defaults: heroFromMap("/country/parties") },
  { page: "country/events", slot: "hero", kind: "hero", label: "Country Events hero", defaults: heroFromMap("/country/events") },
  { page: "country/events/weddings", slot: "hero", kind: "hero", label: "Country Weddings hero", defaults: heroFromMap("/country/events/weddings") },
  { page: "country/events/birthdays", slot: "hero", kind: "hero", label: "Country Birthdays hero", defaults: heroFromMap("/country/events/birthdays") },
  { page: "country/events/business", slot: "hero", kind: "hero", label: "Country Business hero", defaults: heroFromMap("/country/events/business") },
];

export const findSlot = (page: string, slot: string): AssetSlot | undefined =>
  cmsImageRegistry.find((s) => s.page === page && s.slot === slot);

export const slotsForPage = (page: string): AssetSlot[] =>
  cmsImageRegistry.filter((s) => s.page === page);

export const allPagesWithAssets = (): string[] =>
  Array.from(new Set(cmsImageRegistry.map((s) => s.page))).sort();
