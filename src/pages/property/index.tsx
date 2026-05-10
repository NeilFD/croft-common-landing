import PropertyPage from "@/components/property/PropertyPage";
import CBMenuPage from "@/components/crazybear/CBMenuPage";
import CBGallery from "@/components/property/CBGallery";
import { townGallery, countryGallery } from "@/data/galleryData";
import { blackBearMenu, bnbMenu, countryPubMenu, type Menu } from "@/data/menus";
import SecretGestureHost, { type SecretVariant } from "@/components/secrets/SecretGestureHost";
import { CBSeo } from "@/components/seo/CBSeo";
import CBFAQ from "@/components/seo/CBFAQ";
import {
  restaurantSchema,
  breadcrumbSchema,
  faqSchema,
  imageGallerySchema,
} from "@/components/seo/CBStructuredData";
import { CB_SITE } from "@/components/seo/CBSeo";
import { cbFaqs } from "@/data/cbFaqs";

const withSecret = (variant: SecretVariant, node: JSX.Element) => (
  <SecretGestureHost variant={variant}>{node}</SecretGestureHost>
);

interface MenuRouteProps {
  menu: Menu;
  property: "town" | "country";
  path: string;
  title: string;
  description: string;
  cuisine: string[];
  faqKey?: string;
  cmsPage?: string;
}

const MenuRoute = ({ menu, property, path, title, description, cuisine, faqKey, cmsPage }: MenuRouteProps) => {
  const faqEntry = faqKey ? cbFaqs[faqKey] : undefined;
  const ld: Record<string, any>[] = [
    breadcrumbSchema(path),
    restaurantSchema({ name: title, description, property, cuisine, path }),
  ];
  if (faqEntry) ld.push(faqSchema(faqEntry.faqs));
  return (
    <>
      <CBSeo title={`${title} | Crazy Bear`} description={description.slice(0, 158)} path={path} jsonLd={ld} />
      <CBMenuPage menu={menu} cmsPage={cmsPage} />
      {(cmsPage || faqEntry) && (
        <CBFAQ
          cmsPage={cmsPage}
          fallbackFaqs={faqEntry?.faqs}
          title={faqEntry?.title ?? "Asked and answered."}
        />
      )}
    </>
  );
};

// Country pages
export const CountryHome = () => (
  <PropertyPage
    title="Crazy Bear Country"
    eyebrow="Stadhampton, Oxfordshire"
    body="The original Crazy Bear. A 16th century inn with rooms, restaurants and a country pub spirit that refuses to behave."
    seoDescription="Crazy Bear Country. 16th century inn in Stadhampton, Oxfordshire. Rooms, restaurants, a pub that refuses to behave."
    faqKey="/country"
    schemaKind="hotel"
    cmsPage="country"
  />
);
export const CountryPub = () =>
  withSecret(
    "recipe-countrypub",
    <MenuRoute
      menu={countryPubMenu}
      property="country"
      path="/country/pub"
      title="The Country Pub"
      description="Real ale, proper food, fires lit. The pub at Crazy Bear Country, Stadhampton."
      cuisine={["British", "Pub"]}
      faqKey="/country/pub"
      cmsPage="country/pub"
    />
  );
export const CountryPubFood = () =>
  withSecret(
    "recipe-countrypub",
    <MenuRoute
      menu={countryPubMenu}
      property="country"
      path="/country/pub/food"
      title="Country Pub Food"
      description="Pub food, properly done. Lunch and dinner every day."
      cuisine={["British", "Pub"]}
      faqKey="/country/pub"
      cmsPage="country/pub/food"
    />
  );
export const CountryPubDrink = () =>
  withSecret(
    "dice-country",
    <PropertyPage
      title="Drink"
      eyebrow="The Pub"
      body="Real ale. Proper wine. Cocktails that bite back."
      seoDescription="Real ale, proper wine, cocktails that bite back. The bar at Crazy Bear Country."
      schemaKind="bar"
      cmsPage="country/pub/drink"
    />
  );
export const CountryPubHospitality = () => (
  <PropertyPage
    title="Hospitality"
    eyebrow="The Pub"
    body="Fires lit. Doors open. Stay as long as you like."
    seoDescription="Fires lit. Doors open. Country pub hospitality at Crazy Bear, Stadhampton."
    cmsPage="country/pub/hospitality"
  />
);
export const CountryRooms = () =>
  withSecret(
    "rooms-country",
    <PropertyPage
      title="Rooms"
      body="Theatrical. Indulgent. Never the same twice."
      seoDescription="Bedrooms at Crazy Bear Country. Theatrical, indulgent, never the same twice."
      faqKey="/country/rooms"
      schemaKind="hotel"
      cmsPage="country/rooms"
    />
  );
export const CountryRoomTypes = () =>
  withSecret(
    "rooms-country",
    <PropertyPage
      title="Room Types"
      eyebrow="Rooms"
      body="Pick your character. Sleep accordingly."
      seoDescription="Room types at Crazy Bear Country. Pick your character. Sleep accordingly."
      faqKey="/country/rooms"
      cmsPage="country/rooms/types"
    />
  );
export const CountryRoomGallery = () =>
  withSecret(
    "rooms-country",
    <PropertyPage
      title="Bedroom Gallery"
      eyebrow="Rooms"
      body="A look behind the bedroom doors."
      seoDescription="Bedroom gallery at Crazy Bear Country, Stadhampton. Theatrical, indulgent, never the same twice. A look behind the doors."
      extraJsonLd={[imageGallerySchema(countryGallery, `${CB_SITE}/country/rooms/gallery`)]}
      cmsPage="country/rooms/gallery"
    >
      <CBGallery items={countryGallery} eyebrow="Country" title="Behind the doors." />
    </PropertyPage>
  );
export const CountryParties = () =>
  withSecret(
    "cinema",
    <PropertyPage
      title="Parties"
      body="Loud, long, late."
      seoDescription="Parties at Crazy Bear Country. Loud, long, late. Group bookings and exclusive use."
      faqKey="/country/parties"
      cmsPage="country/parties"
    />
  );
export const CountryEvents = () => (
  <PropertyPage
    title="Events"
    body="Private rooms. Whole house. Whatever you need."
    seoDescription="Events at Crazy Bear Country. Private rooms, marquee, exclusive use."
    faqKey="/country/events"
    cmsPage="country/events"
  />
);
export const CountryWeddings = () => (
  <PropertyPage
    title="Weddings"
    eyebrow="Events"
    body="Vows, dinner, dancing. Done properly."
    seoDescription="Weddings at Crazy Bear Country. Vows, dinner, dancing. Licensed for ceremonies."
    faqKey="/country/events/weddings"
    cmsPage="country/events/weddings"
  />
);
export const CountryBirthdays = () => (
  <PropertyPage
    title="Birthdays"
    eyebrow="Events"
    body="Another year. Worth marking."
    seoDescription="Birthday parties at Crazy Bear Country. From long tables to whole house hire."
    faqKey="/country/events/birthdays"
    cmsPage="country/events/birthdays"
  />
);
export const CountryBusiness = () => (
  <PropertyPage
    title="Business"
    eyebrow="Events"
    body="Meetings that don't feel like meetings."
    seoDescription="Business meetings and away days at Crazy Bear Country. Private rooms, dinner, rooms."
    faqKey="/country/events/business"
    cmsPage="country/events/business"
  />
);

// Town pages
export const TownHome = () => (
  <PropertyPage
    title="Crazy Bear Town"
    eyebrow="Beaconsfield, Buckinghamshire"
    body="Townhouse glamour, almost in London. Three restaurants, crisp cocktails, signature bedrooms and a hidden pool."
    seoDescription="Crazy Bear Town. Beaconsfield townhouse. Three restaurants, cocktails, signature rooms, hidden pool."
    faqKey="/town"
    schemaKind="hotel"
    cmsPage="town"
  />
);
export const TownFood = () =>
  withSecret(
    "recipe-blackbear",
    <PropertyPage
      title="Food"
      body="Two kitchens. One appetite."
      seoDescription="Food at Crazy Bear Town. The Black Bear, the B&B and Hom Thai."
      faqKey="/town/food"
      cmsPage="town/food"
    />
  );
export const TownBlackBear = () =>
  withSecret(
    "recipe-blackbear",
    <MenuRoute
      menu={blackBearMenu}
      property="town"
      path="/town/food/black-bear"
      title="The Black Bear"
      description="Modern British plates, charcoal and fire. The Black Bear restaurant at Crazy Bear Town."
      cuisine={["British", "Modern European"]}
      faqKey="/town/food"
      cmsPage="town/food/black-bear"
    />
  );
export const TownBnB = () =>
  withSecret(
    "recipe-bnb",
    <MenuRoute
      menu={bnbMenu}
      property="town"
      path="/town/food/bnb"
      title="The B&B"
      description="All day kitchen. Breakfast, brunch and into the night, at Crazy Bear Town."
      cuisine={["British", "Brunch"]}
      faqKey="/town/food"
      cmsPage="town/food/bnb"
    />
  );
export const TownHomThai = () =>
  withSecret(
    "recipe-homthai",
    <PropertyPage
      title="Hom Thai"
      eyebrow="Food"
      body="Bangkok by way of Beaconsfield. Sharp, fragrant, fierce."
      seoDescription="Hom Thai at Crazy Bear Town. Bangkok by way of Beaconsfield. Sharp, fragrant, fierce."
      schemaKind="restaurant"
      cuisine={["Thai", "Asian"]}
      faqKey="/town/food"
      cmsPage="town/food/hom-thai"
    />
  );
export const TownDrink = () =>
  withSecret(
    "dice-town",
    <PropertyPage
      title="Drink"
      body="Mirrored bars. Mischievous pours."
      seoDescription="Bars at Crazy Bear Town. Mirrored rooms, low light, sharp pours."
      schemaKind="bar"
      faqKey="/town/drink"
      cmsPage="town/drink"
    />
  );
export const TownCocktails = () =>
  withSecret(
    "dice-town",
    <PropertyPage
      title="Cocktails"
      eyebrow="Drink"
      body="Stirred with intent. Served without apology."
      seoDescription="Cocktail bar at Crazy Bear Town. Stirred with intent. Served without apology."
      schemaKind="bar"
      faqKey="/town/drink/cocktails"
      cmsPage="town/drink/cocktails"
    />
  );
export const TownRooms = () =>
  withSecret(
    "rooms-town",
    <PropertyPage
      title="Rooms"
      body="Velvet, mirror, marble. Sleep like a rumour."
      seoDescription="Rooms at Crazy Bear Town. Velvet, mirror, marble. Each one its own world."
      schemaKind="hotel"
      faqKey="/town/rooms"
      cmsPage="town/rooms"
    />
  );
export const TownRoomTypes = () =>
  withSecret(
    "rooms-town",
    <PropertyPage
      title="Room Types"
      eyebrow="Rooms"
      body="Each one its own world. None of them shy."
      seoDescription="Room types at Crazy Bear Town. Each one its own world."
      faqKey="/town/rooms"
      cmsPage="town/rooms/types"
    />
  );
export const TownRoomGallery = () =>
  withSecret(
    "rooms-town",
    <PropertyPage
      title="Bedroom Gallery"
      eyebrow="Rooms"
      body="Step inside."
      seoDescription="Bedroom gallery at Crazy Bear Town, Beaconsfield. Velvet, mirror, marble. Each bedroom its own world. Step inside."
      extraJsonLd={[imageGallerySchema(townGallery, `${CB_SITE}/town/rooms/gallery`)]}
      cmsPage="town/rooms/gallery"
    >
      <CBGallery items={townGallery} eyebrow="Town" title="Step inside." />
    </PropertyPage>
  );
export const TownPool = () =>
  withSecret(
    "pool",
    <PropertyPage
      title="Pool"
      body="Hidden. Heated. Yours for the afternoon."
      seoDescription="The hidden pool at Crazy Bear Town. Heated, daytime, hotel guests only."
      faqKey="/town/pool"
      cmsPage="town/pool"
    />
  );
