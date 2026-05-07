export type RoomOffer = {
  property: "town" | "country";
  eyebrow: string;
  headline: string;
  perks: string[];
  cta: string;
  href: string;
};

export const roomOffers: Record<"town" | "country", RoomOffer> = {
  town: {
    property: "town",
    eyebrow: "Members Only",
    headline: "The Insider Night",
    perks: [
      "Suite upgrade on arrival",
      "Late checkout to 2pm",
      "Breakfast for two",
      "Bottle of house champagne",
    ],
    cta: "Reserve",
    href: "/book?offer=members-town",
  },
  country: {
    property: "country",
    eyebrow: "Members Only",
    headline: "The Insider Night",
    perks: [
      "Room category upgrade",
      "Late checkout to 2pm",
      "Breakfast for two",
      "Negroni on the house",
    ],
    cta: "Reserve",
    href: "/book?offer=members-country",
  },
};
