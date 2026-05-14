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
    intro: "Two hotels. One spirit. Country in Stadhampton, Town in Beaconsfield.",
    links: [
      { label: "Country Rooms", path: "/country/rooms" },
      { label: "Country Room Types", path: "/country/rooms/types" },
      { label: "Country Room Gallery", path: "/country/rooms/gallery" },
      { label: "Town Rooms", path: "/town/rooms" },
      { label: "Town Room Types", path: "/town/rooms/types" },
      { label: "Town Room Gallery", path: "/town/rooms/gallery" },
      { label: "Town Pool", path: "/town/pool" },
    ],
  },
  {
    id: "eat-drink",
    label: "Eat & Drink",
    intro: "Three kitchens, two pubs, one cocktail bar. All ours.",
    links: [
      { label: "The Black Bear", path: "/town/food/black-bear" },
      { label: "B&B", path: "/town/food/bnb" },
      { label: "Hom Thai", path: "/town/food/hom-thai" },
      { label: "Town Cocktails", path: "/town/drink/cocktails" },
      { label: "Country Pub Food", path: "/country/pub/food" },
      { label: "Country Pub Drink", path: "/country/pub/drink" },
      { label: "Country Pub Hospitality", path: "/country/pub/hospitality" },
    ],
  },
  {
    id: "celebrate",
    label: "Celebrate",
    intro: "Weddings. Parties. Birthdays. Business done well.",
    links: [
      { label: "Weddings", path: "/country/events/weddings" },
      { label: "Parties", path: "/country/parties" },
      { label: "Birthdays", path: "/country/events/birthdays" },
      { label: "Business Events", path: "/country/events/business" },
      { label: "All Country Events", path: "/country/events" },
    ],
  },
  {
    id: "discover",
    label: "Discover",
    intro: "Where we came from. How we behave. What we read.",
    links: [
      { label: "About", path: "/about" },
      { label: "House Rules", path: "/house-rules" },
      { label: "Country Culture", path: "/country/culture" },
      { label: "Town Culture", path: "/town/culture" },
    ],
  },
  {
    id: "bears-den",
    label: "The Bear's Den",
    intro: "Our members' room. Twenty-five percent off, everywhere.",
    links: [
      { label: "Bear's Den", path: "/bears-den" },
      { label: "Curious", path: "/curious" },
      { label: "Members", path: "/members" },
    ],
  },
];

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
  // Property landing pages (sub-routes under PropertyLayout).
  paths.add("/country/pub");
  paths.add("/country/rooms");
  paths.add("/country/events");
  paths.add("/town/food");
  paths.add("/town/drink");
  paths.add("/town/rooms");
  return Array.from(paths);
};
