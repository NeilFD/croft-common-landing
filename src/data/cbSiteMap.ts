// Canonical site map for The Crazy Bear.
// Single source of truth for: global nav, footer site map, homepage section
// order, and public/sitemap.xml. Update routes here, everywhere else follows.

export type SiteMapLink = {
  label: string;
  path: string;
  external?: boolean;
};

export type SiteMapColumn = {
  /** Column heading eyebrow, e.g. "Country / Stadhampton". */
  eyebrow: string;
  /** Primary curated links for this column on the homepage. */
  links: SiteMapLink[];
  /** Optional row of small "chip" links rendered below the primary links. */
  chips?: SiteMapLink[];
  /** Optional "see all" link rendered at the foot of the column. */
  seeAll?: SiteMapLink;
};

export type SiteMapGroup = {
  /** Stable id, used as anchor on the homepage and CMS key. */
  id: string;
  /** Visible H2 / nav label. */
  label: string;
  /** Short editorial intro shown in the homepage section. */
  intro: string;
  /** Country column for the homepage section. */
  country: SiteMapColumn;
  /** Town column for the homepage section. */
  town: SiteMapColumn;
  /** Optional cross-site links rendered full-width beneath the two columns. */
  bothBelow?: SiteMapLink[];
  /** Flat list of every route in this group — used by footer + sitemap. */
  links: SiteMapLink[];
};

const flatten = (g: Omit<SiteMapGroup, "links">): SiteMapLink[] => {
  const seen = new Set<string>();
  const out: SiteMapLink[] = [];
  const push = (l?: SiteMapLink) => {
    if (!l) return;
    if (seen.has(l.path)) return;
    seen.add(l.path);
    out.push(l);
  };
  for (const col of [g.country, g.town]) {
    col.links.forEach(push);
    col.chips?.forEach(push);
    push(col.seeAll);
  }
  g.bothBelow?.forEach(push);
  return out;
};

const group = (g: Omit<SiteMapGroup, "links">): SiteMapGroup => ({
  ...g,
  links: flatten(g),
});

export const SITE_MAP: SiteMapGroup[] = [
  group({
    id: "stay",
    label: "Stay",
    intro: "Two hotels. One spirit.\nCrazy Bear Country in Stadhampton,\nCrazy Bear Town in Beaconsfield.",
    country: {
      eyebrow: "Country / Stadhampton",
      links: [
        { label: "Rooms", path: "/country/rooms" },
        { label: "Room Types", path: "/country/rooms/types" },
        { label: "Gallery", path: "/country/rooms/gallery" },
        { label: "Dogs", path: "/country/dogs" },
      ],
      chips: [
        { label: "Snug", path: "/country/rooms/snug" },
        { label: "Cosy", path: "/country/rooms/cosy" },
        { label: "Boujee", path: "/country/rooms/boujee" },
        { label: "Decadent", path: "/country/rooms/decadent" },
      ],
      seeAll: { label: "All Country rooms", path: "/country/rooms" },
    },
    town: {
      eyebrow: "Town / Beaconsfield",
      links: [
        { label: "Rooms", path: "/town/rooms" },
        { label: "Room Types", path: "/town/rooms/types" },
        { label: "Gallery", path: "/town/rooms/gallery" },
        { label: "Pool", path: "/town/pool" },
      ],
      chips: [
        { label: "Snug", path: "/town/rooms/snug" },
        { label: "Cosy", path: "/town/rooms/cosy" },
        { label: "Boujee", path: "/town/rooms/boujee" },
        { label: "Decadent", path: "/town/rooms/decadent" },
      ],
      seeAll: { label: "All Town rooms", path: "/town/rooms" },
    },
  }),
  group({
    id: "eat-drink",
    label: "Eat & Drink",
    intro: "Three kitchens, one pub, one cocktail bar. A pool and a party venue. All ours.",
    country: {
      eyebrow: "Country / Stadhampton",
      links: [
        { label: "The Pub", path: "/pub" },
        { label: "Pub Food", path: "/pub/food" },
        { label: "Pub Drink", path: "/pub/drink" },
        { label: "Bar Snacks", path: "/pub/snacks" },
        { label: "Afternoon Tea", path: "/country/food/afternoon-tea" },
        { label: "Menus", path: "/country/food/menus" },
      ],
      seeAll: { label: "All Country food & drink", path: "/country/food" },
    },
    town: {
      eyebrow: "Town / Beaconsfield",
      links: [
        { label: "The Black Bear", path: "/town/food/black-bear" },
        { label: "B&B", path: "/town/food/bnb" },
        { label: "Hom Thai", path: "/town/food/hom-thai" },
        { label: "Afternoon Tea", path: "/town/food/afternoon-tea" },
        { label: "Cocktails", path: "/town/drink/cocktails" },
        { label: "Menus", path: "/town/food/menus" },
      ],
      seeAll: { label: "All Town food & drink", path: "/town/food" },
    },
  }),
  group({
    id: "celebrate",
    label: "Celebrate",
    intro: "Weddings. Parties. Birthdays. Business done well. Karaoke optional.",
    country: {
      eyebrow: "Country / Stadhampton",
      links: [
        { label: "Weddings", path: "/country/events/weddings" },
        { label: "Parties", path: "/country/parties" },
        { label: "Birthdays", path: "/country/events/birthdays" },
        { label: "Business Events", path: "/country/events/business" },
        { label: "Terraces & Gardens", path: "/country/terraces-and-gardens" },
      ],
      seeAll: { label: "All Country events", path: "/country/events" },
    },
    town: {
      eyebrow: "Town / Beaconsfield",
      links: [
        { label: "Parties", path: "/town/parties" },
        { label: "Birthdays", path: "/town/birthdays" },
        { label: "Pool Party", path: "/town/pool-party" },
        { label: "Karaoke", path: "/town/karaoke" },
      ],
    },
    bothBelow: [
      { label: "What's Happening", path: "/whats-on" },
      { label: "Gift Vouchers", path: "/gift-vouchers" },
    ],
  }),
  group({
    id: "discover",
    label: "Discover",
    intro: "Where we came from. How we behave. What we read. What we play.",
    country: {
      eyebrow: "Country / Stadhampton",
      links: [
        { label: "Culture", path: "/country/culture" },
        { label: "Playlist", path: "/country/playlist" },
      ],
    },
    town: {
      eyebrow: "Town / Beaconsfield",
      links: [
        { label: "Culture", path: "/town/culture" },
        { label: "Playlist", path: "/town/playlist" },
      ],
    },
    bothBelow: [
      { label: "About", path: "/about" },
      { label: "House Rules", path: "/house-rules" },
      { label: "Stories from the Bear", path: "/stories" },
    ],
  }),
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
        label: "The Pub",
        path: "/pub",
        links: [
          { label: "Food", path: "/pub/food" },
          { label: "Drink", path: "/pub/drink" },
          { label: "Snacks", path: "/pub/snacks" },
        ],
      },
      {
        label: "Rooms",
        path: "/country/rooms",
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
