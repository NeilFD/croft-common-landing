import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema, barSchema } from "@/components/seo/CBStructuredData";
import { SubHero } from "./PubFood";
import Chalkboard from "@/components/pub/Chalkboard";

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
      <section className="bg-[hsl(var(--pub-cream-warm))] py-16 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
            Behind the bar
          </p>
          <h2 className="pub-display mt-3 text-3xl md:text-4xl uppercase text-[hsl(var(--pub-oxblood))]">
            What we pour
          </h2>
          <p className="mt-6 font-cb-sans text-lg leading-relaxed text-[hsl(var(--pub-ink))]">
            Four cask ales on rotation, with a leaning toward Oxfordshire breweries
            (Hook Norton, Loose Cannon, XT). Two keg, a stout, and Aspall on cyder.
            The wine list is short and sharp. The cocktails are simple, cold, and
            properly made. No nonsense, no flair bartending. Just a good drink in
            your hand.
          </p>
        </div>
      </section>
    </>
  );
};

export default PubDrink;
