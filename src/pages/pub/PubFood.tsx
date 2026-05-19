import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema, restaurantSchema } from "@/components/seo/CBStructuredData";
import { CMSText } from "@/components/cms/CMSText";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import { useCMSMenuData } from "@/hooks/useCMSMenuData";
import { countryPubMenu } from "@/data/menus";

interface SubPageShellProps {
  page: string;
  eyebrow: string;
  title: string;
  manifesto: string;
}

const SubHero = ({ page, eyebrow, title, manifesto }: SubPageShellProps) => {
  const { assets } = useCMSAssets(page, "hero");
  const hero = assets[0]?.src;
  return (
    <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-[hsl(var(--pub-oxblood-deep))]">
      {hero && (
        <img
          src={hero}
          alt={assets[0]?.alt ?? ""}
          className="absolute inset-0 h-full w-full object-cover opacity-55"
          loading="eager"
          decoding="async"
        />
      )}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, hsl(var(--pub-oxblood-deep) / 0.6) 60%, hsl(var(--pub-oxblood-deep) / 0.95) 100%)",
        }}
      />
      <div className="relative z-10 flex h-full flex-col items-center justify-center text-center px-6">
        <CMSText
          page={page}
          section="hero"
          contentKey="eyebrow"
          fallback={eyebrow}
          as="p"
          className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-cream))] opacity-80"
        />
        <CMSText
          page={page}
          section="hero"
          contentKey="title"
          fallback={title}
          as="h1"
          className="pub-display pub-etched mt-5 text-6xl md:text-8xl uppercase leading-none"
        />
        <div className="pub-brass-rule mt-6 h-px w-32" />
        <CMSText
          page={page}
          section="hero"
          contentKey="manifesto"
          fallback={manifesto}
          as="p"
          className="mt-5 font-cb-sans text-base md:text-lg text-[hsl(var(--pub-cream))] opacity-90 max-w-lg"
        />
      </div>
    </section>
  );
};

const PubFood = () => {
  const { data: cmsMenu } = useCMSMenuData("pub-food");
  const sections =
    cmsMenu.length > 0
      ? cmsMenu
      : countryPubMenu.sections.map((s) => ({ title: s.title, items: s.items }));

  return (
    <>
      <CBSeo
        title="Pub Food | The Pub | Crazy Bear Country"
        description="Pub food, properly done. Pies, roasts, chops, fish. Lunch and dinner every day at The Pub, Crazy Bear Country."
        path="/pub/food"
        jsonLd={[
          breadcrumbSchema("/pub/food"),
          restaurantSchema({
            name: "The Pub at Crazy Bear Country — Food",
            description: "Pub food, properly done. Lunch and dinner every day.",
            property: "country",
            cuisine: ["British", "Pub"],
            path: "/pub/food",
          }),
        ]}
      />
      <SubHero
        page="pub-food"
        eyebrow="The Pub // Eat"
        title="Pub Food"
        manifesto="Pies. Roasts. Chops. Fish. Lunch and dinner, every day."
      />
      <section className="bg-[hsl(var(--pub-cream-warm))] py-16 px-6">
        <div className="mx-auto max-w-3xl space-y-14">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="pub-display text-3xl md:text-4xl uppercase text-[hsl(var(--pub-oxblood))]">
                {section.title}
              </h2>
              <div className="pub-brass-rule mt-3 h-px w-24" />
              <ul className="mt-6 space-y-5">
                {section.items.map((item, i) => (
                  <li
                    key={`${section.title}-${i}`}
                    className="flex items-baseline justify-between gap-4 border-b border-dashed border-[hsl(var(--pub-ink)/0.2)] pb-4"
                  >
                    <div>
                      <p className="pub-display text-xl uppercase text-[hsl(var(--pub-ink))] leading-tight">
                        {item.name}
                      </p>
                      {item.description && (
                        <p className="font-cb-sans text-sm opacity-75 mt-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                    {item.price && (
                      <p className="font-cb-mono text-lg whitespace-nowrap text-[hsl(var(--pub-brass-deep))]">
                        {item.price}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export default PubFood;
export { SubHero };
