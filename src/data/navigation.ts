export type NavItem = {
  label: string;
  path: string;
  children?: NavItem[];
};

export const countryNav: NavItem[] = [
  {
    label: "Food",
    path: "/country/food",
    children: [
      { label: "Menus", path: "/country/food/menus" },
      { label: "Pub Food", path: "/country/pub/food" },
      { label: "Afternoon Tea", path: "/country/food/afternoon-tea" },
    ],
  },
  {
    label: "Pub",
    path: "/country/pub",
    children: [
      { label: "Food", path: "/country/pub/food" },
      { label: "Drink", path: "/country/pub/drink" },
      { label: "Hospitality", path: "/country/pub/hospitality" },
    ],
  },
  {
    label: "Rooms",
    path: "/country/rooms",
    children: [
      { label: "Room Types", path: "/country/rooms/types" },
      { label: "Snug", path: "/country/rooms/snug" },
      { label: "Cosy", path: "/country/rooms/cosy" },
      { label: "Boujee", path: "/country/rooms/boujee" },
      { label: "Decadent", path: "/country/rooms/decadent" },
      { label: "Gallery", path: "/country/rooms/gallery" },
    ],
  },
  { label: "Terraces & Gardens", path: "/country/terraces-and-gardens" },
  { label: "Parties", path: "/country/parties" },
  {
    label: "Events",
    path: "/country/events",
    children: [
      { label: "Weddings", path: "/country/events/weddings" },
      { label: "Birthdays", path: "/country/events/birthdays" },
      { label: "Business", path: "/country/events/business" },
    ],
  },
  {
    label: "Culture",
    path: "/country/culture",
    children: [
      { label: "Playlist", path: "/country/playlist" },
      { label: "Stories from the Bear", path: "/stories" },
    ],
  },
  { label: "What's Happening", path: "/whats-on" },
  { label: "Members", path: "/members" },
];

export const townNav: NavItem[] = [
  {
    label: "Food",
    path: "/town/food",
    children: [
      { label: "Menus", path: "/town/food/menus" },
      { label: "The Black Bear", path: "/town/food/black-bear" },
      { label: "B&B", path: "/town/food/bnb" },
      { label: "Hom Thai", path: "/town/food/hom-thai" },
      { label: "Afternoon Tea", path: "/town/food/afternoon-tea" },
    ],
  },
  {
    label: "Drink",
    path: "/town/drink",
    children: [{ label: "Cocktails", path: "/town/drink/cocktails" }],
  },
  {
    label: "Rooms",
    path: "/town/rooms",
    children: [
      { label: "Room Types", path: "/town/rooms/types" },
      { label: "Snug", path: "/town/rooms/snug" },
      { label: "Cosy", path: "/town/rooms/cosy" },
      { label: "Boujee", path: "/town/rooms/boujee" },
      { label: "Decadent", path: "/town/rooms/decadent" },
      { label: "Gallery", path: "/town/rooms/gallery" },
    ],
  },
  { label: "Pool", path: "/town/pool" },
  { label: "Karaoke", path: "/town/karaoke" },
  {
    label: "Culture",
    path: "/town/culture",
    children: [
      { label: "Playlist", path: "/town/playlist" },
      { label: "Stories from the Bear", path: "/stories" },
    ],
  },
  { label: "What's Happening", path: "/whats-on" },
  { label: "Members", path: "/members" },
];
