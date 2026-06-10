import { CBSeo } from "@/components/seo/CBSeo";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import SplitLanding from "@/components/crazybear/SplitLanding";
import { CMSText } from "@/components/cms/CMSText";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import townAsset from "@/assets/cb-rooms-split-town.jpg.asset.json";
import countryAsset from "@/assets/cb-rooms-split-country.jpg.asset.json";
const townImg = townAsset.url;
const countryImg = countryAsset.url;

const RoomsLanding = () => {
  const { assets: townAssets } = useCMSAssets("rooms-landing", "split-town");
  const { assets: countryAssets } = useCMSAssets("rooms-landing", "split-country");
  const townSrc = townAssets[0]?.src ?? townImg;
  const countrySrc = countryAssets[0]?.src ?? countryImg;

  return (
    <>
      <CBSeo
        title="Our Rooms | Crazy Bear"
        description="Stay at Crazy Bear. Town or Country. Pick your side."
        path="/rooms"
      />
      <CBTopNav tone="light" />
      <main>
        <SplitLanding
          left={{
            label: "Town",
            eyebrow: "Beaconsfield",
            image: townSrc,
            href: "/town/rooms",
            cta: "See Rooms",
          }}
          right={{
            label: "Country",
            eyebrow: "Stadhampton",
            image: countrySrc,
            href: "/country/rooms",
            cta: "See Rooms",
          }}
        />
        <section className="bg-black text-white py-20 px-6 md:px-12 text-center">
          <CMSText
            as="h1"
            page="rooms-landing"
            section="intro"
            contentKey="title"
            fallback="Our Rooms"
            className="font-display uppercase text-4xl md:text-6xl leading-[0.9] tracking-tight"
          />
          <CMSText
            as="p"
            page="rooms-landing"
            section="intro"
            contentKey="body"
            fallback="Two houses. Different worlds. Same bed-time philosophy: stay late, sleep deep, eat slowly."
            className="mt-6 max-w-2xl mx-auto font-cb-sans text-base md:text-lg opacity-80"
          />
        </section>
      </main>
      <CBFooter />
    </>
  );
};

export default RoomsLanding;
