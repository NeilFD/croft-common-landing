import { Link } from "react-router-dom";
import { CBSeo } from "@/components/seo/CBSeo";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import CBBreadcrumb from "@/components/seo/CBBreadcrumb";
import { CMSText } from "@/components/cms/CMSText";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import snugImg from "@/assets/cb-rooms-fireplace.jpg";
import cosyImg from "@/assets/cb-rooms-bathtub.jpg";
import boujeeImg from "@/assets/cb-rooms-chandelier.jpg";
import decadentImg from "@/assets/cb-rooms-copper-suite.jpg";
import townDecadentImg from "@/assets/cb-town-culture-look-3-redroom.jpg";
import countrySnugImg from "@/assets/cb-country-culture-look-2-bedroom.jpg";

interface Tile {
  label: string;
  eyebrow: string;
  fallback: string;
  href: string;
  slot: string;
  alt: string;
}

interface Props {
  site: "town" | "country";
  title: string;
  body: string;
  seoDescription: string;
  cmsPage: string;
}

const useTileImage = (cmsPage: string, slot: string, fallback: string) => {
  const { assets } = useCMSAssets(cmsPage, slot);
  return assets[0]?.src ?? fallback;
};

const RoomTypeNav = ({ site, title, body, seoDescription, cmsPage }: Props) => {
  const path = `/${site}/rooms`;

  const TILES: Tile[] = site === "town"
    ? [
        { label: "Snug", eyebrow: "Tucked Away", fallback: snugImg, href: `${path}/snug`, slot: "tile-snug", alt: "Crazy Bear Town snug bedroom with fireplace" },
        { label: "Cosy", eyebrow: "Warm. Layered.", fallback: cosyImg, href: `${path}/cosy`, slot: "tile-cosy", alt: "Roll-top bath in a Crazy Bear Town cosy bedroom" },
        { label: "Boujee", eyebrow: "A Bit Much, On Purpose", fallback: boujeeImg, href: `${path}/boujee`, slot: "tile-boujee", alt: "Chandelier above a Crazy Bear Town boujee suite" },
        { label: "Decadent", eyebrow: "Top Of The Bill", fallback: townDecadentImg, href: `${path}/decadent`, slot: "tile-decadent", alt: "Red velvet bedroom at Crazy Bear Town" },
      ]
    : [
        { label: "Snug", eyebrow: "Tucked Away", fallback: countrySnugImg, href: `${path}/snug`, slot: "tile-snug", alt: "Crazy Bear Country snug bedroom" },
        { label: "Cosy", eyebrow: "Warm. Layered.", fallback: snugImg, href: `${path}/cosy`, slot: "tile-cosy", alt: "Fireplace in a Crazy Bear Country cosy room" },
        { label: "Boujee", eyebrow: "A Bit Much, On Purpose", fallback: cosyImg, href: `${path}/boujee`, slot: "tile-boujee", alt: "Roll-top bath in a Crazy Bear Country boujee bedroom" },
        { label: "Decadent", eyebrow: "Top Of The Bill", fallback: decadentImg, href: `${path}/decadent`, slot: "tile-decadent", alt: "Copper suite at Crazy Bear Country" },
      ];

  const tileImages = [
    useTileImage(cmsPage, TILES[0].slot, TILES[0].fallback),
    useTileImage(cmsPage, TILES[1].slot, TILES[1].fallback),
    useTileImage(cmsPage, TILES[2].slot, TILES[2].fallback),
    useTileImage(cmsPage, TILES[3].slot, TILES[3].fallback),
  ];

  return (
    <div data-property={site}>
      <CBSeo title={`${title} | Crazy Bear ${site === "town" ? "Town" : "Country"}`} description={seoDescription.slice(0, 158)} path={path} />
      <CBTopNav tone="light" />
      <main className="bg-black text-white">
        {/* 2x2 big tiles — fit above the fold (full viewport minus header) */}
        <section className="px-0 pt-[72px] md:pt-[88px]">
          <div className="grid grid-cols-1 md:grid-cols-2 md:h-[calc(100vh-88px)]">
            {TILES.map((tile, i) => (
              <Link
                key={tile.href}
                to={tile.href}
                className="group relative flex items-end overflow-hidden h-[50vh] md:h-full border-t border-white/10 md:[&:nth-child(-n+2)]:border-t-0 md:[&:nth-child(2n)]:border-l border-white/10"
              >
                <img
                  src={tileImages[i]}
                  alt={tile.alt}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30 transition-colors duration-500 group-hover:from-black" />
                <div className="relative z-10 w-full px-6 md:px-8 pb-6 md:pb-8">
                  <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 mb-2">
                    {tile.eyebrow}
                  </p>
                  <h2 className="font-display uppercase leading-[0.9] tracking-tight text-4xl md:text-5xl lg:text-6xl">
                    {tile.label}
                  </h2>
                  <span className="mt-4 inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white/80 px-4 py-2.5 transition-colors duration-300 group-hover:bg-white group-hover:text-black">
                    Enter →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <CBBreadcrumb />

        {/* Intro band — below the tiles */}
        <section className="px-6 md:px-12 pt-16 md:pt-24 pb-16 md:pb-20 max-w-5xl border-t border-white/10">
          <CMSText
            as="p"
            page={cmsPage}
            section="hero"
            contentKey="eyebrow"
            fallback="Rooms"
            className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-80 mb-4"
          />
          <CMSText
            as="h1"
            page={cmsPage}
            section="hero"
            contentKey="title"
            fallback={title}
            className="font-display uppercase leading-[0.9] tracking-tight text-6xl md:text-8xl"
          />
          <CMSText
            as="p"
            page={cmsPage}
            section="hero"
            contentKey="body"
            fallback={body}
            className="mt-6 font-cb-sans text-lg md:text-xl opacity-85 max-w-2xl"
          />
        </section>


        {/* Gallery link band */}
        <section className="py-20 px-6 md:px-12 text-center border-t border-white/10">
          <h3 className="font-display uppercase text-3xl md:text-5xl leading-[0.9] tracking-tight">
            Behind the doors.
          </h3>
          <p className="mt-4 font-cb-sans opacity-80 max-w-xl mx-auto">
            A look inside every bedroom.
          </p>
          <Link
            to={`${path}/gallery`}
            className="mt-8 inline-flex items-center font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white/80 px-8 py-4 hover:bg-white hover:text-black transition-colors"
          >
            View gallery
          </Link>
        </section>
      </main>
      <CBFooter />
    </div>
  );
};

export default RoomTypeNav;
