import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema, barSchema } from "@/components/seo/CBStructuredData";
import { SubHero } from "./PubFood";
import Chalkboard from "@/components/pub/Chalkboard";
import caskImg from "@/assets/pub/pub-cask-ales.jpg";
import interiorImg from "@/assets/pub/pub-interior.jpg";

const PubDrink = () => {
  return (
    <>
      <CBSeo
        title="Pub Drink | The Pub | Crazy Bear Country"
        description="Cask ale, proper wine, cocktails that bite back. The bar at The Pub, Crazy Bear Country, Stadhampton."
        path="/pub/drink"
        jsonLd={[
          breadcrumbSchema("/pub/drink"),
          barSchema({
            name: "The Pub at Crazy Bear Country — Bar",
            description: "Cask ale, proper wine, cocktails that bite back.",
            property: "country",
            path: "/pub/drink",
          }),
        ]}
      />
      <SubHero
        page="pub-drink"
        eyebrow="The Pub // Drink"
        title="The Bar"
        manifesto="Cask ale. Proper wine. Cocktails that bite back."
      />

      <Chalkboard />

      <section className="bg-[hsl(var(--pub-oxblood))] text-[hsl(var(--pub-cream))]">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2">
          <div className="px-8 py-16 md:px-14 md:py-20">
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))]">
              Behind the bar
            </p>
            <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase leading-none">
              What we pour
            </h2>
            <div className="mt-5 h-px w-12 bg-[hsl(var(--pub-brass))]" />
            <p className="mt-8 font-cb-sans text-base md:text-lg leading-relaxed text-[hsl(var(--pub-cream)/0.85)]">
              Four cask ales on rotation, with a leaning toward Oxfordshire breweries —
              Hook Norton, Loose Cannon, XT. Two keg, a stout, Aspall on cyder.
              The wine list is short and sharp. The cocktails are simple, cold, and
              properly made. No nonsense, no flair bartending. Just a good drink in
              your hand.
            </p>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[520px]">
            <img
              src={caskImg}
              alt="Cask ale handpulls"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </div>
      </section>

      <section className="bg-[hsl(var(--pub-oxblood-deep))]">
        <div className="relative h-[280px] md:h-[360px] overflow-hidden">
          <img
            src={interiorImg}
            alt="The pub interior"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
    </>
  );
};

export default PubDrink;
