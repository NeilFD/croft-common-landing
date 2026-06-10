import { Link } from "react-router-dom";
import { CBSeo } from "@/components/seo/CBSeo";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import { CMSText } from "@/components/cms/CMSText";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import heroImg from "@/assets/cb-hero-events.jpg";
import weddingsImg from "@/assets/cb-country-culture-look-4-terrace.jpg";
import partiesImg from "@/assets/cb-hero-parties.jpg";
import birthdaysImg from "@/assets/cb-hero-cocktails.jpg";
import businessImg from "@/assets/cb-hero-country-exterior.jpg";

interface Tile {
  label: string;
  eyebrow: string;
  fallback: string;
  href: string;
  slot: string;
}

const TILES: Tile[] = [
  { label: "Weddings", eyebrow: "I Do, Loudly", fallback: weddingsImg, href: "/country/events/weddings", slot: "tile-weddings" },
  { label: "Parties", eyebrow: "Late & Loud", fallback: partiesImg, href: "/country/parties", slot: "tile-parties" },
  { label: "Birthdays", eyebrow: "Candles. Sparklers. Cake.", fallback: birthdaysImg, href: "/country/events/birthdays", slot: "tile-birthdays" },
  { label: "Business Events", eyebrow: "Off-Site. On-Brand.", fallback: businessImg, href: "/country/events/business", slot: "tile-business" },
];

const useTileImage = (slot: string, fallback: string) => {
  const { assets } = useCMSAssets("meetings-and-events", slot);
  return assets[0]?.src ?? fallback;
};

const MeetingsAndEvents = () => {
  const heroAssets = useCMSAssets("meetings-and-events", "hero").assets;
  const heroSrc = heroAssets[0]?.src ?? heroImg;
  const tileImages = [
    useTileImage(TILES[0].slot, TILES[0].fallback),
    useTileImage(TILES[1].slot, TILES[1].fallback),
    useTileImage(TILES[2].slot, TILES[2].fallback),
    useTileImage(TILES[3].slot, TILES[3].fallback),
  ];
  return (
    <>
      <CBSeo
        title="Meetings & Events | Crazy Bear"
        description="Weddings, parties, birthdays and business events at Crazy Bear Town & Country."
        path="/meetings-and-events"
      />
      <CBTopNav tone="light" />
      <main className="bg-black text-white">
        {/* Hero */}
        <section className="relative min-h-[70vh] flex items-end overflow-hidden">
          <img
            src={heroImg}
            alt="Crazy Bear events"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/40" />
          <div className="relative z-10 px-6 md:px-12 pb-16 md:pb-24 pt-40 max-w-5xl">
            <CMSText
              as="p"
              page="meetings-and-events"
              section="hero"
              contentKey="eyebrow"
              fallback="Crazy Bear"
              className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 mb-4"
            />
            <CMSText
              as="h1"
              page="meetings-and-events"
              section="hero"
              contentKey="title"
              fallback="Meetings & Events"
              className="font-display uppercase leading-[0.9] tracking-tight text-6xl md:text-8xl"
            />
            <CMSText
              as="p"
              page="meetings-and-events"
              section="hero"
              contentKey="body"
              fallback="From quiet boardrooms to fireworks over the lawn. Pick the occasion."
              className="mt-6 font-cb-sans text-lg md:text-xl opacity-85 max-w-2xl"
            />
          </div>
        </section>

        {/* 2x2 big tiles */}
        <section className="px-0 md:px-0">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {TILES.map((tile) => (
              <Link
                key={tile.href}
                to={tile.href}
                className="group relative flex items-end overflow-hidden min-h-[60vh] md:min-h-[70vh] border-t border-white/10 md:[&:nth-child(-n+2)]:border-t-0 md:[&:nth-child(2n)]:border-l border-white/10"
              >
                <img
                  src={tile.image}
                  alt={tile.label}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 transition-colors duration-500 group-hover:from-black" />
                <div className="relative z-10 w-full px-6 md:px-10 pb-12 md:pb-16">
                  <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 mb-3">
                    {tile.eyebrow}
                  </p>
                  <h2 className="font-display uppercase leading-[0.9] tracking-tight text-5xl md:text-6xl lg:text-7xl">
                    {tile.label}
                  </h2>
                  <span className="mt-6 inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white/80 px-5 py-3 transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                    Enter →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Enquire band */}
        <section className="py-20 px-6 md:px-12 text-center border-t border-white/10">
          <CMSText
            as="h3"
            page="meetings-and-events"
            section="enquire"
            contentKey="title"
            fallback="Something else in mind?"
            className="font-display uppercase text-3xl md:text-5xl leading-[0.9] tracking-tight"
          />
          <CMSText
            as="p"
            page="meetings-and-events"
            section="enquire"
            contentKey="body"
            fallback="Tell us what you're planning. We'll work it out."
            className="mt-4 font-cb-sans opacity-80 max-w-xl mx-auto"
          />
          <Link
            to="/event-enquiry"
            className="mt-8 inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white/80 px-8 py-4 hover:bg-white hover:text-black transition-colors"
          >
            Enquire
          </Link>
        </section>
      </main>
      <CBFooter />
    </>
  );
};

export default MeetingsAndEvents;
