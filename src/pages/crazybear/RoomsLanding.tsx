import { CBSeo } from "@/components/seo/CBSeo";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import SplitLanding from "@/components/crazybear/SplitLanding";
import { CMSText } from "@/components/cms/CMSText";
import townImg from "@/assets/cb-hero-rooms-town.jpg";
import countryImg from "@/assets/cb-hero-rooms-country.jpg";

const RoomsLanding = () => {
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
            image: townImg,
            href: "/town/rooms",
            cta: "See Rooms",
          }}
          right={{
            label: "Country",
            eyebrow: "Stadhampton",
            image: countryImg,
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
