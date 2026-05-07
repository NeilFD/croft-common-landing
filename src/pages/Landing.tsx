import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import stadhampton from "@/assets/stadhampton-property.jpg";
import beaconsfield from "@/assets/beaconsfield-property.jpg";
import { PROPERTIES } from "@/data/brand";

const Panel = ({
  to,
  image,
  eyebrow,
  title,
  location,
  tagline,
}: {
  to: string;
  image: string;
  eyebrow: string;
  title: string;
  location: string;
  tagline: string;
}) => (
  <Link
    to={to}
    className="group relative flex flex-1 items-center justify-center overflow-hidden bg-black text-white min-h-[50vh] lg:min-h-screen"
  >
    <img
      src={image}
      alt={`${title}, ${location}`}
      className="absolute inset-0 h-full w-full object-cover opacity-50 grayscale transition-all duration-700 group-hover:opacity-70 group-hover:scale-105"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
    <div className="relative z-10 px-8 text-center">
      <p className="text-xs tracking-[0.4em] uppercase opacity-80">{eyebrow}</p>
      <h2 className="mt-4 font-serif text-5xl md:text-7xl leading-none">
        {title}
      </h2>
      <p className="mt-4 text-sm tracking-[0.2em] uppercase">{location}</p>
      <p className="mt-6 max-w-xs mx-auto text-sm opacity-80">{tagline}</p>
      <span className="mt-10 inline-block border-b border-white/60 pb-1 text-xs tracking-[0.3em] uppercase transition-all group-hover:border-white">
        Enter
      </span>
    </div>
  </Link>
);

const Landing = () => (
  <>
    <Helmet>
      <title>Crazy Bear | Country & Town</title>
      <meta
        name="description"
        content="Choose your Crazy Bear: the wild country house in Stadhampton or the townhouse in Beaconsfield."
      />
    </Helmet>
    <main className="flex min-h-screen flex-col bg-black text-white lg:flex-row">
      <Panel
        to="/country"
        image={stadhampton}
        eyebrow="Crazy Bear"
        title="Country"
        location={PROPERTIES.country.location}
        tagline={PROPERTIES.country.tagline}
      />
      <Panel
        to="/town"
        image={beaconsfield}
        eyebrow="Crazy Bear"
        title="Town"
        location={PROPERTIES.town.location}
        tagline={PROPERTIES.town.tagline}
      />
      <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
        <Link
          to="/members"
          className="text-[10px] tracking-[0.4em] uppercase text-white/70 hover:text-white"
        >
          Members
        </Link>
      </div>
    </main>
  </>
);

export default Landing;
