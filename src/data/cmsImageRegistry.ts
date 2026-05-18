// Single source of truth for every image slot the public site renders.
//
// Derived automatically from `CMS_PAGES` (src/data/cmsPages.ts) so that every
// public page is editable in the Assets CMS. Pages with bespoke slot setups
// (carousels, galleries, culture collages) declare overrides below; everything
// else gets a default hero slot.
//
// Live site uses these as fallbacks until an admin uploads/publishes a row.

import { CMS_PAGES, CMS_PAGES_BY_SLUG, type CmsPageEntry } from "./cmsPages";
import { propertyHeroMap } from "./propertyHeroMap";
import { heroCarouselMap } from "./heroCarousels";
import { townGallery, countryGallery, type GalleryItem } from "./galleryData";
import townCultureHero from "@/assets/cb-town-culture-hero.jpg";
import townLook1 from "@/assets/cb-town-culture-look-1-burlesque.jpg";
import townLook2 from "@/assets/cb-town-culture-look-2-homthai.jpg";
import townLook3 from "@/assets/cb-town-culture-look-3-redroom.jpg";
import townLook4 from "@/assets/cb-town-culture-look-4-rococo.jpg";
import countryLook1 from "@/assets/cb-country-culture-look-1-routemaster.jpg";
import countryLook2 from "@/assets/cb-country-culture-look-2-bedroom.jpg";
import countryLook3 from "@/assets/cb-country-culture-look-3-feast.jpg";
import countryLook4 from "@/assets/cb-country-culture-look-4-terrace.jpg";

export type AssetKind = "hero" | "carousel" | "gallery";

export interface AssetSlot {
  /** Page namespace as queried by the live site (no leading slash). */
  page: string;
  /** Slot key within the page, e.g. "hero", "hero-carousel", "gallery". */
  slot: string;
  kind: AssetKind;
  /** Human-readable label for the CMS UI. */
  label: string;
  /** Default images bundled with the build. */
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

/**
 * Pages whose slot layout differs from the default single-hero pattern.
 * Keyed by CMS page slug (matches `CmsPageEntry.slug`).
 *
 * Add an entry here when a page needs a carousel, a gallery, or a non-matching
 * page key (e.g. culture pages query `town-culture` not `town/culture`).
 */
const SLOT_OVERRIDES: Record<string, AssetSlot[]> = {
  // Members page renders under live key "cb-members" (legacy), not its slug.
  members: [
    { page: "cb-members", slot: "hero", kind: "hero", label: "Members hero", defaults: [] },
  ],
  // ----- TOWN -----
  town: [
    { page: "town", slot: "hero-carousel", kind: "carousel", label: "Town home carousel", defaults: carouselFromMap("/town") },
  ],
  "town/rooms": [
    { page: "town/rooms", slot: "hero-carousel", kind: "carousel", label: "Town Rooms carousel", defaults: carouselFromMap("/town/rooms") },
  ],
  "town/rooms/gallery": [
    { page: "town/rooms/gallery", slot: "hero", kind: "hero", label: "Town Gallery hero", defaults: heroFromMap("/town/rooms/gallery") },
    { page: "town/rooms/gallery", slot: "gallery", kind: "gallery", label: "Town Bedroom gallery", defaults: galleryFromArr(townGallery) },
  ],
  "town/culture": [
    { page: "town-culture", slot: "hero", kind: "hero", label: "Town Culture hero", defaults: [{ src: townCultureHero, alt: "Town bar at night" }] },
    {
      page: "town-culture",
      slot: "collage",
      kind: "gallery",
      label: "Town Culture — The Look",
      defaults: [
        { src: townLook1, alt: "Mirrorball burlesque dancers at Town", caption: "The burlesque years" },
        { src: townLook2, alt: "Pineapple prawn curry at Hom Thai", caption: "Hom Thai" },
        { src: townLook3, alt: "Red velvet bedroom with copper bath", caption: "Bedrooms with baths" },
        { src: townLook4, alt: "Negroni and red wine by the open fire at Town", caption: "Fireside, after eleven" },
      ],
    },
  ],

  // ----- COUNTRY -----
  country: [
    { page: "country", slot: "hero-carousel", kind: "carousel", label: "Country home carousel", defaults: carouselFromMap("/country") },
  ],
  "country/rooms": [
    { page: "country/rooms", slot: "hero-carousel", kind: "carousel", label: "Country Rooms carousel", defaults: carouselFromMap("/country/rooms") },
  ],
  "country/rooms/gallery": [
    { page: "country/rooms/gallery", slot: "hero", kind: "hero", label: "Country Gallery hero", defaults: heroFromMap("/country/rooms/gallery") },
    { page: "country/rooms/gallery", slot: "gallery", kind: "gallery", label: "Country Bedroom gallery", defaults: galleryFromArr(countryGallery) },
  ],
  "country/culture": [
    {
      page: "country-culture",
      slot: "collage",
      kind: "gallery",
      label: "Country Culture — The Look",
      defaults: [
        { src: countryLook1, alt: "Red Routemaster bus reception with neon sign at The Crazy Bear Stadhampton", caption: "Reception by Routemaster" },
        { src: countryLook2, alt: "Country bedroom with copper roll-top bath, gold tufted headboard and red velvet", caption: "Bedrooms with copper" },
        { src: countryLook3, alt: "Thai seafood feast spread on black table with carved fruit", caption: "The long Thai lunch" },
        { src: countryLook4, alt: "Outdoor terrace at night with firepit, fairy-lit palms and laid tables", caption: "Firepit, after dark" },
      ],
    },
  ],
};

/** Slugs that should NOT appear in Assets (no editable imagery). */
const SKIP_SLUGS = new Set<string>([
  "global/footer",
  "global/navigation",
  "global/email-templates",
]);

const defaultHeroSlot = (entry: CmsPageEntry): AssetSlot => ({
  page: entry.slug,
  slot: "hero",
  kind: "hero",
  label: `${entry.title} hero`,
  defaults: heroFromMap(entry.route),
});

/** Slots for a given CMS page slug. Driven by overrides + default hero. */
export const slotsForSlug = (slug: string): AssetSlot[] => {
  if (SKIP_SLUGS.has(slug)) return [];
  if (SLOT_OVERRIDES[slug]) return SLOT_OVERRIDES[slug];
  const entry = CMS_PAGES_BY_SLUG[slug];
  if (!entry) return [];
  return [defaultHeroSlot(entry)];
};

/** Derived flat registry: every slot for every CMS page. */
export const cmsImageRegistry: AssetSlot[] = CMS_PAGES.flatMap((p) => slotsForSlug(p.slug));

// ---- Back-compat helpers (consumed by useCMSAssets) ----

export const findSlot = (page: string, slot: string): AssetSlot | undefined =>
  cmsImageRegistry.find((s) => s.page === page && s.slot === slot);

/** Legacy: lookup by the slot's `page` (which may differ from slug). */
export const slotsForPage = (page: string): AssetSlot[] =>
  cmsImageRegistry.filter((s) => s.page === page);

/** Legacy: distinct page keys present in the registry. */
export const allPagesWithAssets = (): string[] =>
  Array.from(new Set(cmsImageRegistry.map((s) => s.page))).sort();

/**
 * Picker-friendly list: every CMS page that has at least one asset slot,
 * paired with its slot count and a grouping key from cmsPages.
 */
export interface AssetPageSummary {
  slug: string;
  title: string;
  route: string;
  group: CmsPageEntry["group"];
  slotCount: number;
}

export const assetPagesForPicker = (): AssetPageSummary[] =>
  CMS_PAGES
    .filter((p) => !SKIP_SLUGS.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      route: p.route,
      group: p.group,
      slotCount: slotsForSlug(p.slug).length,
    }))
    .filter((p) => p.slotCount > 0);
