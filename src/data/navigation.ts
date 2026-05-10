export type NavItem = {
  label: string;
  path: string;
  children?: NavItem[];
};

export const countryNav: NavItem[] = [
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
      { label: "Gallery", path: "/country/rooms/gallery" },
    ],
  },
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
  { label: "Culture", path: "/country/culture" },
  { label: "Members", path: "/members" },
];

export const townNav: NavItem[] = [
  {
    label: "Food",
    path: "/town/food",
    children: [
      { label: "The Black Bear", path: "/town/food/black-bear" },
      { label: "B&B", path: "/town/food/bnb" },
      { label: "Hom Thai", path: "/town/food/hom-thai" },
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
      { label: "Gallery", path: "/town/rooms/gallery" },
    ],
  },
  { label: "Pool", path: "/town/pool" },
  { label: "Culture", path: "/town/culture" },
  { label: "Members", path: "/members" },
];
