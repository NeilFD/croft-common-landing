// Canonical site map for The Crazy Bear.
// Single source of truth for: global nav, footer site map, homepage section
// order, and public/sitemap.xml. Update routes here, everywhere else follows.

export type SiteMapLink = {
  label: string;
  path: string;
  external?: boolean;
};

export type SiteMapGroup = {
  /** Stable id, used as anchor on the homepage and CMS key. */
  id: string;
  /** Visible H2 / nav label. */
  label: string;
  /** Short editorial intro shown in the homepage section. */
  intro: string;
  /** All routes that belong to this group, flat list. */
  links: SiteMapLink[];
};

export const SITE_MAP: SiteMapGroup[] = [
  {
    id: "stay",
    label: "Stay",
    intro: "Two hotels. One spirit.\nCrazy Bear Country in Stadhampton,\nCrazy Bear Town in Beaconsfield.",
    links: [
      { label: "Country Rooms", path: "/country/rooms" },
      { label: "Country Room Types", path: "/country/rooms/types" },
      { label: "Country Snug", path: "/country/rooms/snug" },
      { label: "Country Cosy", path: "/country/rooms/cosy" },
      { label: "Country Boujee", path: "/country/rooms/boujee" },
      { label: "Country Decadent", path: "/country/rooms/decadent" },
      { label: "Country Room Gallery", path: "/country/rooms/gallery" },
      { label: "Town Rooms", path: "/town/rooms" },
      { label: "Town Room Types", path: "/town/rooms/types" },
      { label: "Town Snug", path: "/town/rooms/snug" },
      { label: "Town Cosy", path: "/town/rooms/cosy" },
      { label: "Town Boujee", path: "/town/rooms/boujee" },
      { label: "Town Decadent", path: "/town/rooms/decadent" },
      { label: "Town Room Gallery", path: "/town/rooms/gallery" },
      { label: "Town Pool", path: "/town/pool" },
    ],
  },
  {
    id: "eat-drink",
    label: "Eat & Drink",
    intro: "Three kitchens, one pub, one cocktail bar. A pool and a party venue. All ours.",
    links: [
      { label: "Town Food", path: "/town/food" },
      { label: "Town Menus", path: "/town/food/menus" },
      { label: "The Black Bear", path: "/town/food/black-bear" },
      { label: "B&B", path: "/town/food/bnb" },
      { label: "Hom Thai", path: "/town/food/hom-thai" },
      { label: "Town Afternoon Tea", path: "/town/food/afternoon-tea" },
      { label: "Town Cocktails", path: "/town/drink/cocktails" },
      { label: "Country Food", path: "/country/food" },
      { label: "Country Menus", path: "/country/food/menus" },
      { label: "Country Afternoon Tea", path: "/country/food/afternoon-tea" },
      { label: "Country Pub Food", path: "/country/pub/food" },
      { label: "Country Pub Drink", path: "/country/pub/drink" },
      { label: "Country Pub Hospitality", path: "/country/pub/hospitality" },
    ],
  },
  {
    id: "celebrate",
    label: "Celebrate",
    intro: "Weddings. Parties. Birthdays. Business done well. Karaoke optional.",
    links: [
      { label: "Weddings", path: "/country/events/weddings" },
      { label: "Parties", path: "/country/parties" },
      { label: "Birthdays", path: "/country/events/birthdays" },
      { label: "Business Events", path: "/country/events/business" },
      { label: "All Country Events", path: "/country/events" },
      { label: "Terraces & Gardens", path: "/country/terraces-and-gardens" },
      { label: "Karaoke", path: "/town/karaoke" },
      { label: "What's Happening", path: "/whats-on" },
      { label: "Gift Vouchers", path: "/gift-vouchers" },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    intro: "Where we came from. How we behave. What we read. What we play.",
    links: [
      { label: "About", path: "/about" },
      { label: "House Rules", path: "/house-rules" },
      { label: "Country Culture", path: "/country/culture" },
      { label: "Country Playlist", path: "/country/playlist" },
      { label: "Town Culture", path: "/town/culture" },
      { label: "Town Playlist", path: "/town/playlist" },
      { label: "Stories from the Bear", path: "/stories" },
    ],
  },
];

/**
 * Single public entry point to the Bear's Den.
 * The Bear's Den is a subscriber area, not a public content pillar.
 * All subscribers get in. Gold subscribers get extras (25% off, everywhere).
 */
export const MEMBERS_ENTRY: SiteMapLink = {
  label: "Join the Bear's Den",
  path: "/curious",
};

export const PRIMARY_CTAS = {
  book: { label: "Book", path: "/book" },
  enquire: { label: "Enquire", path: "/enquire" },
} as const;

export const PROPERTY_PICKER: SiteMapLink[] = [
  { label: "Country, Stadhampton", path: "/country" },
  { label: "Town, Beaconsfield", path: "/town" },
];

export const LEGAL_LINKS: SiteMapLink[] = [
  { label: "Privacy", path: "/privacy" },
  { label: "Unsubscribe", path: "/unsubscribe" },
];

/** Flat list of every public path, used by sitemap.xml generator and audits. */
export const allPublicPaths = (): string[] => {
  const paths = new Set<string>(["/"]);
  for (const group of SITE_MAP) {
    for (const link of group.links) {
      if (!link.external) paths.add(link.path);
    }
  }
  for (const link of PROPERTY_PICKER) paths.add(link.path);
  for (const link of LEGAL_LINKS) paths.add(link.path);
  paths.add(PRIMARY_CTAS.book.path);
  paths.add(PRIMARY_CTAS.enquire.path);
  paths.add("/bears-den");
  paths.add("/curious");
  // Property landing pages (sub-routes under PropertyLayout).
  paths.add("/country/pub");
  paths.add("/country/rooms");
  paths.add("/country/events");
  paths.add("/country/food");
  paths.add("/town/food");
  paths.add("/town/drink");
  paths.add("/town/rooms");
  // Site-wide
  paths.add("/whats-on");
  paths.add("/stories");
  paths.add("/gift-vouchers");
  return Array.from(paths);
};

/* ------------------------------------------------------------------ */
/* SITE_TREE — used by the menu overlay (CBNavOverlay).               */
/* Grouped by site (Town / Country) instead of by topic.              */
/* ------------------------------------------------------------------ */

export type SiteTreeSection = {
  label: string;
  /** Optional landing page for the section itself. */
  path?: string;
  /** Optional child links — when present the section becomes a concertina. */
  links?: SiteMapLink[];
  /** Default open on desktop (md+). Defaults to false. */
  defaultOpenMd?: boolean;
};

export type SiteTreeBranch = {
  label: string;
  home: SiteMapLink;
  sections: SiteTreeSection[];
};

export const SITE_TREE: { town: SiteTreeBranch; country: SiteTreeBranch; both: SiteMapLink[] } = {
  town: {
    label: "Crazy Bear Town",
    home: { label: "Town home", path: "/town" },
    sections: [
      {
        label: "Food",
        path: "/town/food",
        links: [
          { label: "All menus", path: "/town/food/menus" },
          { label: "The Black Bear", path: "/town/food/black-bear" },
          { label: "B&B", path: "/town/food/bnb" },
          { label: "Hom Thai", path: "/town/food/hom-thai" },
          { label: "Afternoon Tea", path: "/town/food/afternoon-tea" },
        ],
      },
      {
        label: "Drink",
        path: "/town/drink",
        links: [{ label: "Cocktails", path: "/town/drink/cocktails" }],
      },
      {
        label: "Rooms",
        path: "/town/rooms",
        defaultOpenMd: true,
        links: [
          { label: "Snug", path: "/town/rooms/snug" },
          { label: "Cosy", path: "/town/rooms/cosy" },
          { label: "Boujee", path: "/town/rooms/boujee" },
          { label: "Decadent", path: "/town/rooms/decadent" },
          { label: "Room Types", path: "/town/rooms/types" },
          { label: "Gallery", path: "/town/rooms/gallery" },
        ],
      },
      { label: "Pool", path: "/town/pool" },
      { label: "Karaoke", path: "/town/karaoke" },
      { label: "Culture", path: "/town/culture" },
      { label: "Playlist", path: "/town/playlist" },
    ],
  },
  country: {
    label: "Crazy Bear Country",
    home: { label: "Country home", path: "/country" },
    sections: [
      {
        label: "Food",
        path: "/country/food",
        links: [
          { label: "All menus", path: "/country/food/menus" },
          { label: "Afternoon Tea", path: "/country/food/afternoon-tea" },
        ],
      },
      {
        label: "Pub",
        path: "/country/pub",
        links: [
          { label: "Food", path: "/country/pub/food" },
          { label: "Drink", path: "/country/pub/drink" },
          { label: "Hospitality", path: "/country/pub/hospitality" },
        ],
      },
      {
        label: "Rooms",
        path: "/country/rooms",
        defaultOpenMd: true,
        links: [
          { label: "Snug", path: "/country/rooms/snug" },
          { label: "Cosy", path: "/country/rooms/cosy" },
          { label: "Boujee", path: "/country/rooms/boujee" },
          { label: "Decadent", path: "/country/rooms/decadent" },
          { label: "Room Types", path: "/country/rooms/types" },
          { label: "Gallery", path: "/country/rooms/gallery" },
        ],
      },
      { label: "Terraces & Gardens", path: "/country/terraces-and-gardens" },
      { label: "Parties", path: "/country/parties" },
      {
        label: "Events",
        path: "/country/events",
        links: [
          { label: "Weddings", path: "/country/events/weddings" },
          { label: "Birthdays", path: "/country/events/birthdays" },
          { label: "Business", path: "/country/events/business" },
        ],
      },
      { label: "Culture", path: "/country/culture" },
      { label: "Playlist", path: "/country/playlist" },
    ],
  },
  both: [
    { label: "What's Happening", path: "/whats-on" },
    { label: "Stories from the Bear", path: "/stories" },
    { label: "Gift Vouchers", path: "/gift-vouchers" },
    { label: "About", path: "/about" },
    { label: "House Rules", path: "/house-rules" },
    { label: "The Bear's Den", path: "/bears-den" },
  ],
};
