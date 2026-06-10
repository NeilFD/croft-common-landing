import { CBSeo } from "@/components/seo/CBSeo";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import SplitLanding from "@/components/crazybear/SplitLanding";
import { CMSText } from "@/components/cms/CMSText";
import townImg from "@/assets/cb-hero-blackbear.jpg";
import countryImg from "@/assets/cb-hero-pub.jpg";

const FoodLanding = () => {
  return (
    <>
      <CBSeo
        title="Food | Crazy Bear"
        description="Eat at Crazy Bear. Town or Country. Pick your menu."
        canonical="https://crazybear.app/food"
      />
      <CBTopNav tone="light" />
      <main>
        <SplitLanding
          left={{
            label: "Town",
            eyebrow: "Beaconsfield",
            image: townImg,
            href: "/town/food/menus",
            cta: "Click to see Menus",
          }}
          right={{
            label: "Country",
            eyebrow: "Stadhampton",
            image: countryImg,
            href: "/country/food/menus",
            cta: "Click to see Menus",
          }}
        />
        <section className="bg-black text-white py-20 px-6 md:px-12 text-center">
          <CMSText
            as="h1"
            page="food-landing"
            section="intro"
            contentKey="title"
            fallback="Food at Crazy Bear"
            className="font-display uppercase text-4xl md:text-6xl leading-[0.9] tracking-tight"
          />
          <CMSText
            as="p"
            page="food-landing"
            section="intro"
            contentKey="body"
            fallback="From a proper pub plate at Country to The Black Bear, B&B and Hom Thai in Town. Pick a side. Then pick a menu."
            className="mt-6 max-w-2xl mx-auto font-cb-sans text-base md:text-lg opacity-80"
          />
        </section>
      </main>
      <CBFooter />
    </>
  );
};

export default FoodLanding;
