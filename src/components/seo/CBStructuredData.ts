import { CB_SITE } from "./CBSeo";

type FAQ = { question: string; answer: string };

const TOWN_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "75 Wycombe End",
  addressLocality: "Beaconsfield",
  addressRegion: "Buckinghamshire",
  postalCode: "HP9 1LX",
  addressCountry: "GB",
};

const COUNTRY_ADDRESS = {
  "@type": "PostalAddress",
  streetAddress: "Bear Lane",
  addressLocality: "Stadhampton",
  addressRegion: "Oxfordshire",
  postalCode: "OX44 7UR",
  addressCountry: "GB",
};

const TOWN_GEO = { "@type": "GeoCoordinates", latitude: 51.6074, longitude: -0.6427 };
const COUNTRY_GEO = { "@type": "GeoCoordinates", latitude: 51.6845, longitude: -1.0915 };

const TOWN_MAP = "https://www.google.com/maps/search/?api=1&query=Crazy+Bear+Beaconsfield";
const COUNTRY_MAP = "https://www.google.com/maps/search/?api=1&query=Crazy+Bear+Stadhampton";

const HOURS_VENUE = [
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Sunday"],
    opens: "12:00",
    closes: "23:00",
  },
  {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Friday", "Saturday"],
    opens: "12:00",
    closes: "00:00",
  },
];

const COMMON = {
  priceRange: "£££",
  image: `${CB_SITE}/brand/logo.png`,
};

const addrFor = (p: "town" | "country") => (p === "town" ? TOWN_ADDRESS : COUNTRY_ADDRESS);
const geoFor = (p: "town" | "country") => (p === "town" ? TOWN_GEO : COUNTRY_GEO);
const mapFor = (p: "town" | "country") => (p === "town" ? TOWN_MAP : COUNTRY_MAP);

export const organizationSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Crazy Bear",
  url: CB_SITE,
  logo: `${CB_SITE}/brand/logo.png`,
  description: "Crazy Bear. Two hotels, one spirit. Town in Beaconsfield, Country in Stadhampton.",
});

export const hotelSchema = (property: "town" | "country") => ({
  "@context": "https://schema.org",
  "@type": ["Hotel", "LocalBusiness"],
  "@id": `${CB_SITE}/${property}#hotel`,
  name: property === "town" ? "Crazy Bear Town" : "Crazy Bear Country",
  description:
    property === "town"
      ? "Townhouse glamour in Beaconsfield. Three restaurants, signature bedrooms, hidden pool."
      : "A 16th century inn in Stadhampton, Oxfordshire. Rooms, restaurants and a country pub spirit.",
  address: addrFor(property),
  geo: geoFor(property),
  hasMap: mapFor(property),
  url: `${CB_SITE}/${property}`,
  checkinTime: "15:00",
  checkoutTime: "11:00",
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
  address: addrFor(opts.property),
  geo: geoFor(opts.property),
  hasMap: mapFor(opts.property),
  url: `${CB_SITE}${opts.path}`,
  openingHoursSpecification: HOURS_VENUE,
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
  address: addrFor(opts.property),
  geo: geoFor(opts.property),
  hasMap: mapFor(opts.property),
  url: `${CB_SITE}${opts.path}`,
  openingHoursSpecification: HOURS_VENUE,
  ...COMMON,
});

export const breadcrumbSchema = (path: string) => {
  const segments = path.split("/").filter(Boolean);
  const items: any[] = [
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

export const imageGallerySchema = (
  items: { src: string; alt: string; caption?: string }[],
  pageUrl: string,
) => ({
  "@context": "https://schema.org",
  "@type": "ImageGallery",
  url: pageUrl,
  image: items.map((i) => ({
    "@type": "ImageObject",
    contentUrl: i.src.startsWith("http") ? i.src : `${CB_SITE}${i.src}`,
    name: i.alt,
    caption: i.caption ?? i.alt,
  })),
});

export const websiteSchema = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Crazy Bear",
  url: CB_SITE,
  potentialAction: {
    "@type": "SearchAction",
    target: `${CB_SITE}/?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
});

export const hotelGroupSchema = () => ({
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  name: "Crazy Bear",
  url: CB_SITE,
  logo: `${CB_SITE}/brand/logo.png`,
  description:
    "Two hotels, one spirit. Townhouse glamour in Beaconsfield, 16th century inn in Stadhampton.",
  subOrganization: [
    {
      "@type": "Hotel",
      name: "Crazy Bear Town",
      url: `${CB_SITE}/town`,
      address: TOWN_ADDRESS,
    },
    {
      "@type": "Hotel",
      name: "Crazy Bear Country",
      url: `${CB_SITE}/country`,
      address: COUNTRY_ADDRESS,
    },
  ],
});

export const aboutPageSchema = () => ({
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: `${CB_SITE}/about`,
  name: "About The Crazy Bear",
  description:
    "Born in 1993. Two hotels, one spirit. The story of The Crazy Bear at Stadhampton and Beaconsfield.",
  about: organizationSchema(),
});

export const goldProductSchema = () => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Bear's Den Gold",
  description:
    "Bear's Den Gold. Twenty-five percent off everywhere, in-app and in-venue. A members' room at The Crazy Bear.",
  brand: { "@type": "Brand", name: "Crazy Bear" },
  url: `${CB_SITE}/bears-den`,
  image: `${CB_SITE}/brand/logo.png`,
  offers: {
    "@type": "Offer",
    price: "69.00",
    priceCurrency: "GBP",
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: "69.00",
      priceCurrency: "GBP",
      billingIncrement: 1,
      unitCode: "MON",
      referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
    },
    availability: "https://schema.org/InStock",
    url: `${CB_SITE}/bears-den`,
  },
});

export type { FAQ };
