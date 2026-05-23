import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema, barSchema, faqSchema } from "@/components/seo/CBStructuredData";
import { cbFaqs } from "@/data/cbFaqs";
import CBFAQ from "@/components/seo/CBFAQ";
import PubHero from "@/components/pub/PubHero";
import ThreeDoors from "@/components/pub/ThreeDoors";
import SnacksStrip from "@/components/pub/SnacksStrip";
import Chalkboard from "@/components/pub/Chalkboard";
import PinnedSpecials from "@/components/pub/PinnedSpecials";
import DoorSignHours from "@/components/pub/DoorSignHours";
import QuoteScene from "@/components/brand2026/QuoteScene";

const PubHome = () => {
  const faqEntry = cbFaqs["/country/pub"] ?? cbFaqs["/pub"];
  const ld: Record<string, any>[] = [
    breadcrumbSchema("/pub"),
    barSchema({
      name: "The Pub at Crazy Bear Country",
      description:
        "Real ale, proper food, fires lit. The pub at Crazy Bear Country, Stadhampton.",
      property: "country",
      path: "/pub",
    }),
  ];
  if (faqEntry) ld.push(faqSchema(faqEntry.faqs));

  return (
    <div data-property="country">
      <CBSeo
        title="The Pub | Crazy Bear Country"
        description="Real ale, proper food, fires lit. The pub at Crazy Bear Country, Stadhampton. Cask ale, pub snacks, Sunday roast."
        path="/pub"
        jsonLd={ld}
      />
      <PubHero />
      <ThreeDoors />
      <SnacksStrip />
      <QuoteScene
        eyebrow="8ish"
        ctaLabel="See the food"
        ctaTo="/pub/food"
        align="center"
      >
        Lunch runs into dinner. Dinner runs into the night.
      </QuoteScene>
      <Chalkboard />
      <PinnedSpecials />
      <DoorSignHours />
      {faqEntry && (
        <div className="bg-[hsl(var(--pub-cream-warm))]">
          <CBFAQ
            cmsPage="pub"
            fallbackFaqs={faqEntry.faqs}
            title={faqEntry.title ?? "Asked and answered."}
          />
        </div>
      )}
    </div>
  );
};

export default PubHome;
