import { Helmet } from "react-helmet-async";

// Existing in-project room images
import cbHeroRoomsCountry from "@/assets/cb-hero-rooms-country.jpg";
import cbHeroRoomsTown from "@/assets/cb-hero-rooms-town.jpg";
import cbRoomsBathtub from "@/assets/cb-rooms-bathtub.jpg";
import cbRoomsChandelier from "@/assets/cb-rooms-chandelier.jpg";
import cbRoomsCopperSuite from "@/assets/cb-rooms-copper-suite.jpg";
import cbRoomsFireplace from "@/assets/cb-rooms-fireplace.jpg";

// Newly imported reference room/interior images
import chateauBed from "@/assets/picker/idea-room-chateau-bed.jpg";
import chateauSuite from "@/assets/picker/idea-room-chateau-suite.jpg";
import copperSuite from "@/assets/picker/idea-room-copper-suite.jpg";
import deluxeSession from "@/assets/picker/idea-room-deluxe-session.jpg";
import fourposter from "@/assets/picker/idea-room-fourposter.jpg";
import marbleBath from "@/assets/picker/idea-room-marble-bath.jpg";
import masterSuite from "@/assets/picker/idea-room-master-suite.avif";
import modelTub from "@/assets/picker/idea-room-model-tub.jpg";
import redBath from "@/assets/picker/idea-room-red-bath.png";
import redVelvet from "@/assets/picker/idea-room-red-velvet.jpg";
import refurb from "@/assets/picker/idea-room-refurb.jpg";
import suiteLounge from "@/assets/picker/idea-room-suite-lounge.avif";
import darkBathroom from "@/assets/picker/idea-dark-bathroom.jpg";
import darkRoom from "@/assets/picker/idea-dark-room.jpg";
import statementInterior from "@/assets/picker/idea-statement-interior.jpg";

type Img = { id: string; src: string; note?: string };

const inProject: Img[] = [
  { id: "cb-hero-rooms-country", src: cbHeroRoomsCountry },
  { id: "cb-hero-rooms-town", src: cbHeroRoomsTown },
  { id: "cb-rooms-bathtub", src: cbRoomsBathtub },
  { id: "cb-rooms-chandelier", src: cbRoomsChandelier },
  { id: "cb-rooms-copper-suite", src: cbRoomsCopperSuite },
  { id: "cb-rooms-fireplace", src: cbRoomsFireplace },
];

const reference: Img[] = [
  { id: "idea-room-chateau-bed", src: chateauBed },
  { id: "idea-room-chateau-suite", src: chateauSuite },
  { id: "idea-room-copper-suite", src: copperSuite },
  { id: "idea-room-deluxe-session", src: deluxeSession },
  { id: "idea-room-fourposter", src: fourposter },
  { id: "idea-room-marble-bath", src: marbleBath },
  { id: "idea-room-master-suite", src: masterSuite },
  { id: "idea-room-model-tub", src: modelTub },
  { id: "idea-room-red-bath", src: redBath },
  { id: "idea-room-red-velvet", src: redVelvet },
  { id: "idea-room-refurb", src: refurb },
  { id: "idea-room-suite-lounge", src: suiteLounge },
  { id: "idea-dark-bathroom", src: darkBathroom },
  { id: "idea-dark-room", src: darkRoom },
  { id: "idea-statement-interior", src: statementInterior },
];

const Grid = ({ title, items }: { title: string; items: Img[] }) => (
  <section className="mb-20">
    <h2 className="font-display uppercase text-2xl tracking-tight mb-6">
      {title}
    </h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((i) => (
        <figure key={i.id} className="bg-black/5">
          <div className="relative aspect-[4/3] overflow-hidden bg-black">
            <img
              src={i.src}
              alt={i.id}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <figcaption className="font-cb-mono text-xs tracking-wider px-3 py-3 select-all">
            {i.id}
          </figcaption>
        </figure>
      ))}
    </div>
  </section>
);

const ImagePicker = () => (
  <>
    <Helmet>
      <title>Image Picker | Crazy Bear</title>
    </Helmet>
    <main className="bg-white text-black min-h-screen px-6 md:px-12 py-16 font-cb-sans">
      <header className="mb-12">
        <p className="font-cb-mono text-[11px] tracking-[0.4em] uppercase opacity-60">
          Temporary
        </p>
        <h1 className="font-display uppercase text-4xl md:text-6xl tracking-tight mt-2">
          Bedroom image picker
        </h1>
        <p className="mt-4 max-w-2xl text-base opacity-70">
          Reference sheet. Tap an ID to copy it, then tell me which image to use where.
          Page will be deleted when we're done.
        </p>
      </header>

      <Grid title="Already in project" items={inProject} />
      <Grid title="Reference library" items={reference} />
    </main>
  </>
);

export default ImagePicker;
