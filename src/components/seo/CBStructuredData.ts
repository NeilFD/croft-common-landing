import { CB_SITE } from "./CBSeo";

type FAQ = { question: string; answer: string };

const TOWN = {
  "@type": "PostalAddress",
  streetAddress: "75 Wycombe End",
  addressLocality: "Beaconsfield",
  addressRegion: "Buckinghamshire",
  postalCode: "HP9 1LX",
  addressCountry: "GB",
};

const COUNTRY = {
  "@type": "PostalAddress",
  streetAddress: "Bear Lane",
  addressLocality: "Stadhampton",
  addressRegion: "Oxfordshire",
  postalCode: "OX44 7UR",
  addressCountry: "GB",
};

const COMMON = {
  priceRange: "£££",
  image: `${CB_SITE}/brand/logo.png`,
  url: CB_SITE,
};

export const hotelSchema = (property: "town" | "country") => ({
  "@context": "https://schema.org",
  "@type": ["Hotel", "LocalBusiness"],
  name: property === "town" ? "Crazy Bear Town" : "Crazy Bear Country",
  description:
    property === "town"
      ? "Townhouse glamour in Beaconsfield. Three restaurants, signature bedrooms, hidden pool."
      : "A 16th century inn in Stadhampton, Oxfordshire. Rooms, restaurants and a country pub spirit.",
  address: property === "town" ? TOWN : COUNTRY,
  url: `${CB_SITE}/${property}`,
  ...COMMON,
  amenityFeature: [
    { "@type": "LocationFeatureSpecification", name: "Restaurant", value: true },
    { "@type": "LocationFeatureSpecification", name: "Bar", value: true },
    { "@type": "LocationFeatureSpecification", name: "Free WiFi", value: true },
    ...(property === "town"
      ? [{ "@type": "LocationFeatureSpecification", name: "Swimming Pool", value: true }]
      : []),
  ],
});

export const restaurantSchema = (opts: {
  name: string;
  description: string;
  property: "town" | "country";
  cuisine: string[];
  path: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: opts.name,
  description: opts.description,
  servesCuisine: opts.cuisine,
  address: opts.property === "town" ? TOWN : COUNTRY,
  url: `${CB_SITE}${opts.path}`,
  ...COMMON,
  acceptsReservations: true,
});

export const barSchema = (opts: {
  name: string;
  description: string;
  property: "town" | "country";
  path: string;
}) => ({
  "@context": "https://schema.org",
  "@type": "BarOrPub",
  name: opts.name,
  description: opts.description,
  address: opts.property === "town" ? TOWN : COUNTRY,
  url: `${CB_SITE}${opts.path}`,
  ...COMMON,
});

export const breadcrumbSchema = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  const items = [
    { "@type": "ListItem", position: 1, name: "Home", item: CB_SITE },
  ];
  segments.forEach((seg, i) => {
    items.push({
      "@type": "ListItem",
      position: i + 2,
      name: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
      item: `${CB_SITE}/${segments.slice(0, i + 1).join("/")}`,
    });
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
};

export const faqSchema = (faqs: FAQ[]) => ({
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
});

export type { FAQ };
