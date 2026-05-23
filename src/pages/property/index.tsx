import PropertyPage from "@/components/property/PropertyPage";
import CBMenuPage from "@/components/crazybear/CBMenuPage";
import CBGallery from "@/components/property/CBGallery";
import { townGallery, countryGallery } from "@/data/galleryData";
import { blackBearMenu, bnbMenu, countryPubMenu, type Menu } from "@/data/menus";
import SecretGestureHost, { type SecretVariant } from "@/components/secrets/SecretGestureHost";
import { CBSeo } from "@/components/seo/CBSeo";
import CBFAQ from "@/components/seo/CBFAQ";
import PullQuoteSerif from "@/components/brand2026/PullQuoteSerif";
import AccentButton from "@/components/brand2026/AccentButton";
import AccentRule from "@/components/brand2026/AccentRule";
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
  >
    <section className="mx-auto max-w-3xl px-6 pb-20">
      <PullQuoteSerif eyebrow="Since 1500-and-something">
        Older than your grandmother. Twice as much fun.
      </PullQuoteSerif>
      <AccentRule width="w-16" className="mb-8" />
      <div className="flex flex-wrap gap-4">
        <AccentButton to="/country/rooms">Book a room</AccentButton>
        <AccentButton to="/pub" variant="ghost">Visit the pub</AccentButton>
      </div>
    </section>
  </PropertyPage>
);
// Country pub pages retired — see /pub enclave at src/pages/pub/*
// Hospitality page removed entirely; food, drink, snacks now live under /pub.
export const CountryRooms = () =>
  withSecret(
    "rooms-country",
    <PropertyPage
      title="Rooms"
      body="Theatrical. Warm. Never the same twice."
      seoDescription="Bedrooms at Crazy Bear Country. Theatrical, warm, never the same twice."
      faqKey="/country/rooms"
      schemaKind="hotel"
      cmsPage="country/rooms"
    >
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <PullQuoteSerif eyebrow="The 90s">
          Many memories. No evidence.
        </PullQuoteSerif>
        <AccentRule width="w-16" className="mb-8" />
        <AccentButton to="/country/rooms/types">Pick your character</AccentButton>
      </section>
    </PropertyPage>
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
      seoDescription="Bedroom gallery at Crazy Bear Country, Stadhampton. Theatrical, warm, never the same twice. A look behind the doors."
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
  >
    <section className="mx-auto max-w-3xl px-6 pb-20">
      <PullQuoteSerif eyebrow="You look like trouble">
        Velvet. Mirror. Marble. The townhouse where the rules loosen.
      </PullQuoteSerif>
      <AccentRule width="w-16" className="mb-8" />
      <div className="flex flex-wrap gap-4">
        <AccentButton to="/town/rooms">Book a room</AccentButton>
        <AccentButton to="/town/food" variant="ghost">See the kitchens</AccentButton>
      </div>
    </section>
  </PropertyPage>
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
    >
      <section className="mx-auto max-w-3xl px-6 pb-16">
        <PullQuoteSerif eyebrow="Do not disturb">
          Late checkout strongly advised.
        </PullQuoteSerif>
        <AccentRule width="w-16" className="mb-8" />
        <AccentButton to="/town/rooms/types">Pick your character</AccentButton>
      </section>
    </PropertyPage>
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

/* ─────────────────────────────────────────────────────────────────────────
 * Room category pages — Snug / Cosy / Boujee / Decadent (Town + Country)
 * One shared shape, driven by PropertyPage. Editors fill carousel + copy
 * via the CMS visual editor using the cmsPage slug as a content namespace.
 * ────────────────────────────────────────────────────────────────────── */

interface RoomCategoryProps {
  site: "town" | "country";
  category: "snug" | "cosy" | "boujee" | "decadent";
}

const ROOM_CATEGORY_COPY: Record<RoomCategoryProps["category"], { title: string; body: string }> = {
  snug:     { title: "Snug",     body: "Tucked away. Smaller footprint, full character. Made for one big sleep." },
  cosy:     { title: "Cosy",     body: "Warm. Layered. The kind of room that swallows you whole." },
  boujee:   { title: "Boujee",   body: "Velvet. Mirror. A bit much, on purpose." },
  decadent: { title: "Decadent", body: "Top of the bill. Roll-top bath, theatrical bedhead, late checkout strongly advised." },
};

const RoomCategoryRoute = ({ site, category }: RoomCategoryProps) => {
  const copy = ROOM_CATEGORY_COPY[category];
  const propName = site === "town" ? "Crazy Bear Town" : "Crazy Bear Country";
  return (
    <PropertyPage
      title={copy.title}
      eyebrow="Rooms"
      body={copy.body}
      seoDescription={`${copy.title} bedrooms at ${propName}. ${copy.body}`}
      schemaKind="hotel"
      faqKey={`/${site}/rooms`}
      cmsPage={`${site}/rooms/${category}`}
    />
  );
};

export const TownRoomSnug     = () => <RoomCategoryRoute site="town"    category="snug" />;
export const TownRoomCosy     = () => <RoomCategoryRoute site="town"    category="cosy" />;
export const TownRoomBoujee   = () => <RoomCategoryRoute site="town"    category="boujee" />;
export const TownRoomDecadent = () => <RoomCategoryRoute site="town"    category="decadent" />;
export const CountryRoomSnug     = () => <RoomCategoryRoute site="country" category="snug" />;
export const CountryRoomCosy     = () => <RoomCategoryRoute site="country" category="cosy" />;
export const CountryRoomBoujee   = () => <RoomCategoryRoute site="country" category="boujee" />;
export const CountryRoomDecadent = () => <RoomCategoryRoute site="country" category="decadent" />;

/* ─────────────────────────────────────────────────────────────────────────
 * Country Food landing — sits above /country/pub. Hub for everything
 * eat-and-drink at Stadhampton.
 * ────────────────────────────────────────────────────────────────────── */
export const CountryFood = () => (
  <PropertyPage
    title="Food"
    body="Two kitchens, one pub. The Restaurant, Thai upstairs, the Pub downstairs. Long lunches and longer Sundays."
    seoDescription="Food at Crazy Bear Country, Stadhampton. The Restaurant, Thai upstairs, the Pub, afternoon tea, Sunday feasts."
    faqKey="/country/pub"
    cmsPage="country/food"
  />
);

/* ─────────────────────────────────────────────────────────────────────────
 * Afternoon Tea (both sites)
 * ────────────────────────────────────────────────────────────────────── */
export const TownAfternoonTea = () => (
  <PropertyPage
    title="Afternoon Tea"
    eyebrow="Food"
    body="Three tiers. Proper tea. Champagne if you're behaving badly."
    seoDescription="Afternoon tea at Crazy Bear Town, Beaconsfield. Sandwiches, scones, pastries, proper tea. Champagne on request."
    schemaKind="restaurant"
    cuisine={["British", "Afternoon Tea"]}
    cmsPage="town/food/afternoon-tea"
  />
);
export const CountryAfternoonTea = () => (
  <PropertyPage
    title="Afternoon Tea"
    eyebrow="Food"
    body="By the fire or out on the terrace. Scones, sandwiches, cake. The works."
    seoDescription="Afternoon tea at Crazy Bear Country, Stadhampton. By the fire or on the terrace."
    schemaKind="restaurant"
    cuisine={["British", "Afternoon Tea"]}
    cmsPage="country/food/afternoon-tea"
  />
);

/* ─────────────────────────────────────────────────────────────────────────
 * Menus indexes (both sites) — everything in one place.
 * ────────────────────────────────────────────────────────────────────── */
const TOWN_MENUS = [
  {
    name: "The Black Bear",
    href: "/town/food/black-bear",
    blurb: "Modern British plates. Charcoal and fire.",
    menus: [
      { label: "Dinner", href: "/town/food/black-bear", status: "live" as const },
      { label: "Lunch", status: "coming-soon" as const },
      { label: "Sunday", status: "coming-soon" as const },
      { label: "Wine", status: "coming-soon" as const },
    ],
  },
  {
    name: "The B&B",
    href: "/town/food/bnb",
    blurb: "All day kitchen. Breakfast, brunch and into the night.",
    menus: [
      { label: "All Day", href: "/town/food/bnb", status: "live" as const },
      { label: "Breakfast", status: "coming-soon" as const },
      { label: "Lunch", status: "coming-soon" as const },
      { label: "Sunday", status: "coming-soon" as const },
    ],
  },
  {
    name: "Hom Thai",
    href: "/town/food/hom-thai",
    blurb: "Bangkok by way of Beaconsfield. Sharp, fragrant, fierce.",
    menus: [
      { label: "Dinner", status: "coming-soon" as const },
      { label: "Lunch", status: "coming-soon" as const },
    ],
  },
];

const COUNTRY_MENUS = [
  {
    name: "The Pub",
    href: "/pub",
    blurb: "Real ale, proper food, fires lit.",
    menus: [
      { label: "Lunch & Dinner", href: "/pub/food", status: "live" as const },
      { label: "Drink", href: "/pub/drink", status: "live" as const },
      { label: "Sunday", status: "coming-soon" as const },
      { label: "Breakfast", status: "coming-soon" as const },
    ],
  },
];

import CBMenusIndex from "@/components/property/CBMenusIndex";

export const TownMenus = () => (
  <PropertyPage
    title="Menus"
    eyebrow="Food"
    body="Every menu. One place."
    seoDescription="Every menu across Crazy Bear Town, Beaconsfield. The Black Bear, the B&B, Hom Thai."
    cmsPage="town/food/menus"
    heroObjectPosition="center 45%"
  >
    <CBMenusIndex venues={TOWN_MENUS} cmsPage="town/food/menus" />
  </PropertyPage>
);
export const CountryMenus = () => (
  <PropertyPage
    title="Menus"
    eyebrow="Food"
    body="Every menu. One place."
    seoDescription="Every menu across Crazy Bear Country, Stadhampton. The Pub, Restaurant and Thai."
    cmsPage="country/food/menus"
    heroObjectPosition="center 45%"
  >
    <CBMenusIndex venues={COUNTRY_MENUS} cmsPage="country/food/menus" />
  </PropertyPage>
);

/* ─────────────────────────────────────────────────────────────────────────
 * Country — Terraces & Gardens (one page, four areas)
 * ────────────────────────────────────────────────────────────────────── */
import CBSectionedPage from "@/components/property/CBSectionedPage";

export const CountryTerracesAndGardens = () => (
  <PropertyPage
    title="Terraces & Gardens"
    eyebrow="Country"
    body="Four corners of the garden. Fish, secrets, terrace, woodland. All ours, all yours for an afternoon."
    seoDescription="Terraces and gardens at Crazy Bear Country, Stadhampton. The Fishpond, Secret Garden, Garden Terrace and Woodland."
    cmsPage="country/terraces-and-gardens"
  >
    <CBSectionedPage
      cmsPage="country/terraces-and-gardens"
      sections={[
        {
          id: "fishpond",
          title: "The Fishpond",
          body: "Top terrace. Koi gliding under the boards, lanterns strung overhead, a long table built for slow lunches.",
          cta: { label: "Enquire", href: "/enquire" },
        },
        {
          id: "secret-garden",
          title: "Secret Garden",
          body: "Tucked behind the inn. Walled, private, a little wild. The garden you find by accident and never want to leave.",
          cta: { label: "Enquire", href: "/enquire" },
        },
        {
          id: "garden-terrace",
          title: "Garden Terrace",
          body: "Where afternoon tea, long brunches and pre-dinner drinks happen. Heaters in winter, parasols in summer.",
          cta: { label: "Book a table", href: "/book" },
        },
        {
          id: "woodland",
          title: "Woodland",
          body: "Edge of the property. Fire pits, fairy lights, somewhere to disappear after dinner.",
          cta: { label: "Enquire", href: "/enquire" },
        },
      ]}
    />
  </PropertyPage>
);

/* ─────────────────────────────────────────────────────────────────────────
 * Town — Karaoke
 * ────────────────────────────────────────────────────────────────────── */
export const TownKaraoke = () => (
  <PropertyPage
    title="Karaoke"
    eyebrow="Town"
    body={"Private room. Loud system. Bad decisions encouraged. Book a slot, bring your worst song.\n\nTonight you are Celine."}
    seoDescription="Private karaoke room at Crazy Bear Town, Beaconsfield. Book a slot. Loud, late, recommended."
    cmsPage="town/karaoke"
  />
);

/* ─────────────────────────────────────────────────────────────────────────
 * Playlist pages (both sites)
 * ────────────────────────────────────────────────────────────────────── */
import SpotifyPlaylistEmbed from "@/components/crazybear/culture/SpotifyPlaylistEmbed";

const PlaylistBody = ({ url, label }: { url: string; label: string }) => (
  <section className="mx-auto max-w-4xl px-6 pb-24 text-foreground">
    <SpotifyPlaylistEmbed url={url} title={label} />
  </section>
);

export const TownPlaylist = () => (
  <PropertyPage
    title="Playlist"
    eyebrow="Town"
    body="What's on the Town speakers right now. Britpop, lounge, late nights."
    seoDescription="The Crazy Bear Town playlist. Britpop, lounge, late nights at Beaconsfield."
    cmsPage="town/playlist"
  >
    <PlaylistBody url="https://open.spotify.com/playlist/7jx5ZtdeZmTP4PfSk6oRL1" label="Town playlist" />
  </PropertyPage>
);
export const CountryPlaylist = () => (
  <PropertyPage
    title="Playlist"
    eyebrow="Country"
    body="What's on the Country speakers right now. Britpop, folk, long Sundays."
    seoDescription="The Crazy Bear Country playlist. Britpop, folk, long Sundays at Stadhampton."
    cmsPage="country/playlist"
  >
    <PlaylistBody url="https://open.spotify.com/playlist/4KCZQ5fOj3UauK3pTWDZo7" label="Country playlist" />
  </PropertyPage>
);

/* ─────────────────────────────────────────────────────────────────────────
 * Town — Celebrate (Parties / Birthdays / Pool Party)
 * ────────────────────────────────────────────────────────────────────── */
export const TownParties = () => (
  <PropertyPage
    title="Parties"
    eyebrow="Town"
    body={"Bookable rooms. Loud cocktails. A staircase made for entrances.\n\nTell us the night, we'll do the rest."}
    seoDescription="Private parties at Crazy Bear Town, Beaconsfield. Bookable rooms, cocktails, late nights."
    cmsPage="town/parties"
  />
);

export const TownBirthdays = () => (
  <PropertyPage
    title="Birthdays"
    eyebrow="Town"
    body={"Cake by request. Cocktails by default. Karaoke if you must.\n\nTurn another year up in Beaconsfield."}
    seoDescription="Birthday parties at Crazy Bear Town, Beaconsfield. Private rooms, cocktails and karaoke."
    cmsPage="town/birthdays"
  />
);

export const TownPoolParty = () => (
  <PropertyPage
    title="Pool Party"
    eyebrow="Town"
    body={"The hidden pool, after dark. Loungers, low light, louder music.\n\nPrivate hire for the brave."}
    seoDescription="Private pool parties at Crazy Bear Town, Beaconsfield. Hidden pool, late nights, by hire."
    cmsPage="town/pool-party"
  />
);

/* ─────────────────────────────────────────────────────────────────────────
 * Country — Dogs + What's Happening (Pub Quiz / Cinema Nights / Outdoor Feasts)
 * ────────────────────────────────────────────────────────────────────── */
export const CountryDogs = () => (
  <PropertyPage
    title="Dogs"
    eyebrow="Country"
    body={"Dogs welcome. Beds, bowls, biscuits.\n\nWalks from the door. Mud encouraged. Tail-wags rewarded at the bar."}
    seoDescription="Dog-friendly rooms, walks and pub at Crazy Bear Country, Stadhampton. Beds, bowls, biscuits, and walks from the door."
    cmsPage="country/dogs"
    heroObjectPosition="center 30%"
  />
);

export const CountryPubQuiz = () => (
  <PropertyPage
    title="Pub Quiz"
    eyebrow="Country"
    body={"Sharp questions. Sharper opinions.\n\nTeams of six. Prizes at stake. Booking essential."}
    seoDescription="Pub Quiz nights at Crazy Bear Country, Stadhampton. Teams of six, real prizes, regular dates."
    cmsPage="country/pub-quiz"
  />
);

export const CountryCinemaNights = () => (
  <PropertyPage
    title="Cinema Nights"
    eyebrow="Country"
    body={"Classics, cults, curveballs.\n\nThe big screen in the barn. Popcorn, cocktails, the occasional pyjama."}
    seoDescription="Cinema Nights at Crazy Bear Country, Stadhampton. Classic films in the barn with cocktails and popcorn."
    cmsPage="country/cinema-nights"
  />
);

export const CountryOutdoorFeasts = () => (
  <PropertyPage
    title="Outdoor Feasts"
    eyebrow="Country"
    body={"Long tables, open fires, food cooked outside.\n\nSummer evenings the way they should be."}
    seoDescription="Outdoor Feasts at Crazy Bear Country, Stadhampton. Long tables, open-fire cooking, long summer evenings."
    cmsPage="country/outdoor-feasts"
  />
);
