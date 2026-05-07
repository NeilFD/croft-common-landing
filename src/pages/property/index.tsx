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
export const CountryPub = () => <CBMenuPage menu={countryPubMenu} />;
export const CountryPubFood = () => <CBMenuPage menu={countryPubMenu} />;
export const CountryPubDrink = () => (
  <PropertyPage
    title="Drink"
    eyebrow="The Pub"
    body="Real ale. Proper wine. Cocktails that bite back."
  />
);
export const CountryPubHospitality = () => (
  <PropertyPage
    title="Hospitality"
    eyebrow="The Pub"
    body="Fires lit. Doors open. Stay as long as you like."
  />
);
export const CountryRooms = () => (
  <PropertyPage
    title="Rooms"
    body="Theatrical. Indulgent. Never the same twice."
  />
);
export const CountryRoomTypes = () => (
  <PropertyPage
    title="Room Types"
    eyebrow="Rooms"
    body="Pick your character. Sleep accordingly."
  />
);
export const CountryRoomGallery = () => (
  <PropertyPage
    title="Gallery"
    eyebrow="Rooms"
    body="A look behind the bedroom doors."
  />
);
export const CountryParties = () => (
  <PropertyPage
    title="Crazy Bear Parties"
    body="Loud, long, late."
  />
);
export const CountryEvents = () => (
  <PropertyPage
    title="Events"
    body="Private rooms. Whole house. Whatever you need."
  />
);
export const CountryWeddings = () => (
  <PropertyPage
    title="Weddings"
    eyebrow="Events"
    body="Vows, dinner, dancing. Done properly."
  />
);
export const CountryBirthdays = () => (
  <PropertyPage
    title="Birthdays"
    eyebrow="Events"
    body="Another year. Worth marking."
  />
);
export const CountryBusiness = () => (
  <PropertyPage
    title="Business"
    eyebrow="Events"
    body="Meetings that don't feel like meetings."
  />
);

// Town pages
export const TownHome = () => (
  <PropertyPage
    title="Crazy Bear Town"
    eyebrow="Beaconsfield, Buckinghamshire"
    body="Townhouse glamour, almost in London. Three restaurants, crisp cocktails, signature bedrooms and a hidden pool."
  />
);
export const TownFood = () => (
  <PropertyPage
    title="Food"
    body="Two kitchens. One appetite."
  />
);
export const TownBlackBear = () => <CBMenuPage menu={blackBearMenu} />;
export const TownBnB = () => <CBMenuPage menu={bnbMenu} />;
export const TownHomThai = () => (
  <PropertyPage
    title="Hom Thai"
    eyebrow="Food"
    body="Bangkok by way of Beaconsfield. Sharp, fragrant, fierce."
  />
);
export const TownDrink = () => (
  <PropertyPage
    title="Drink"
    body="Mirrored bars. Mischievous pours."
  />
);
export const TownCocktails = () => (
  <PropertyPage
    title="Cocktails"
    eyebrow="Drink"
    body="Stirred with intent. Served without apology."
  />
);
export const TownRooms = () => (
  <PropertyPage
    title="Rooms"
    body="Velvet, mirror, marble. Sleep like a rumour."
  />
);
export const TownRoomTypes = () => (
  <PropertyPage
    title="Room Types"
    eyebrow="Rooms"
    body="Each one its own world. None of them shy."
  />
);
export const TownRoomGallery = () => (
  <PropertyPage
    title="Gallery"
    eyebrow="Rooms"
    body="Step inside."
  />
);
export const TownPool = () => (
  <PropertyPage
    title="Pool"
    body="Hidden. Heated. Yours for the afternoon."
  />
);
