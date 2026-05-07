export const BRAND_LOGO = "/brand/logo.png";
export const BRAND_NAME = "Crazy Bear";
export const BRAND_TAGLINE = "Two hotels. One spirit.";

export const PROPERTIES = {
  country: {
    key: "country" as const,
    name: "Crazy Bear Country",
    location: "Stadhampton",
    tagline: "The original. Wild and wonderful in the Oxfordshire countryside.",
    basePath: "/country",
  },
  town: {
    key: "town" as const,
    name: "Crazy Bear Town",
    location: "Beaconsfield",
    tagline: "Townhouse glamour, just off the M40.",
    basePath: "/town",
  },
};

export type PropertyKey = keyof typeof PROPERTIES;
