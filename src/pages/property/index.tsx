import PropertyPage from "@/components/property/PropertyPage";
import CBMenuPage from "@/components/crazybear/CBMenuPage";
import { blackBearMenu, bnbMenu, countryPubMenu } from "@/data/menus";

// Country pages
export const CountryHome = () => (
  <PropertyPage
    title="Crazy Bear Country"
    eyebrow="Stadhampton, Oxfordshire"
    body="The original Crazy Bear. A 16th century inn with rooms, restaurants and a country pub spirit that refuses to behave."
  />
);
export const CountryPub = () => <PropertyPage title="The Pub" />;
export const CountryPubFood = () => <CBMenuPage menu={countryPubMenu} />;
export const CountryPubDrink = () => <PropertyPage title="Drink" eyebrow="The Pub" />;
export const CountryPubHospitality = () => (
  <PropertyPage title="Hospitality" eyebrow="The Pub" />
);
export const CountryRooms = () => <PropertyPage title="Rooms" />;
export const CountryRoomTypes = () => <PropertyPage title="Room Types" eyebrow="Rooms" />;
export const CountryRoomGallery = () => <PropertyPage title="Gallery" eyebrow="Rooms" />;
export const CountryParties = () => <PropertyPage title="Crazy Bear Parties" />;
export const CountryEvents = () => <PropertyPage title="Events" />;
export const CountryWeddings = () => <PropertyPage title="Weddings" eyebrow="Events" />;
export const CountryBirthdays = () => <PropertyPage title="Birthdays" eyebrow="Events" />;
export const CountryBusiness = () => <PropertyPage title="Business" eyebrow="Events" />;

// Town pages
export const TownHome = () => (
  <PropertyPage
    title="Crazy Bear Town"
    eyebrow="Beaconsfield, Buckinghamshire"
    body="Townhouse glamour, almost in London. Three restaurants, crisp cocktails, signature bedrooms and a hidden pool."
  />
);
export const TownFood = () => <PropertyPage title="Food" />;
export const TownBlackBear = () => (
  <PropertyPage title="The Black Bear" eyebrow="Food" />
);
export const TownBnB = () => <PropertyPage title="B&B" eyebrow="Food" />;
export const TownHomThai = () => <PropertyPage title="Hom Thai" eyebrow="Food" />;
export const TownDrink = () => <PropertyPage title="Drink" />;
export const TownCocktails = () => <PropertyPage title="Cocktails" eyebrow="Drink" />;
export const TownRooms = () => <PropertyPage title="Rooms" />;
export const TownRoomTypes = () => <PropertyPage title="Room Types" eyebrow="Rooms" />;
export const TownRoomGallery = () => <PropertyPage title="Gallery" eyebrow="Rooms" />;
export const TownPool = () => <PropertyPage title="Pool" />;
