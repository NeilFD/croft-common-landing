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
import PullQuoteSerif from "@/components/brand2026/PullQuoteSerif";
import AccentButton from "@/components/brand2026/AccentButton";

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
      <section className="bg-[hsl(var(--pub-oxblood-deep))] py-20 px-6 text-center text-[hsl(var(--pub-cream))]">
        <div className="mx-auto max-w-2xl">
          <PullQuoteSerif eyebrow="8ish" onLight={false}>
            Lunch runs into dinner. Dinner runs into the night.
          </PullQuoteSerif>
          <div className="mt-2 flex justify-center gap-4">
            <AccentButton to="/pub/food">See the food</AccentButton>
            <AccentButton to="/pub/drink" variant="ghost">See the drink</AccentButton>
          </div>
        </div>
      </section>
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
