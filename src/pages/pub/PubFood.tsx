import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema, restaurantSchema } from "@/components/seo/CBStructuredData";
import { CMSText } from "@/components/cms/CMSText";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import { useCMSMenuData } from "@/hooks/useCMSMenuData";
import { countryPubMenu } from "@/data/menus";
import fishChipsImg from "@/assets/pub/pub-fish-chips.jpg";
import interiorImg from "@/assets/pub/pub-interior.jpg";

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

const Intro = () => (
  <section className="bg-[hsl(var(--pub-oxblood-deep))] text-[hsl(var(--pub-cream))]">
    <div className="mx-auto max-w-6xl grid lg:grid-cols-2">
      <div className="relative min-h-[360px] lg:min-h-[480px]">
        <img
          src={fishChipsImg}
          alt="Fish and chips at the bar"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className="px-8 py-16 md:px-14 md:py-20">
        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))]">
          The kitchen
        </p>
        <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase leading-none">
          Two kitchens. One pass.
        </h2>
        <div className="mt-5 h-px w-12 bg-[hsl(var(--pub-brass))]" />
        <p className="mt-8 font-cb-sans text-base md:text-lg leading-relaxed text-[hsl(var(--pub-cream)/0.85)]">
          Pub on one side. Wok on the other. Eat from either, or both, in any order.
          Pies, chops, Sunday roast. Pad krapow, jungle curry, whole seabass.
          Lunch and dinner, every day.
        </p>
      </div>
    </div>
  </section>
);

const PubFood = () => {
  const { data: cmsMenu } = useCMSMenuData("pub-food");
  const sections =
    cmsMenu.length > 0
      ? cmsMenu
      : countryPubMenu.sections.map((s: any) => ({ title: s.title, items: s.items, note: s.note }));

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
      <Intro />

      <section className="bg-[hsl(var(--pub-cream))] text-[hsl(var(--pub-ink))] py-20 md:py-28 px-6">
        <div className="mx-auto max-w-5xl space-y-20">
          {sections.map((section: any, idx: number) => (
            <div key={section.title}>
              <div className="flex items-baseline gap-6">
                <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--pub-brass-deep))] tabular-nums">
                  {String(idx + 1).padStart(2, "0")}
                </p>
                <h2 className="pub-display text-3xl md:text-4xl uppercase text-[hsl(var(--pub-oxblood))] leading-none">
                  {section.title}
                </h2>
              </div>
              <div className="mt-5 h-px w-full bg-[hsl(var(--pub-ink)/0.15)]" />

              {section.note && (
                <p className="mt-6 font-cb-sans text-sm whitespace-pre-line text-[hsl(var(--pub-ink)/0.8)] leading-relaxed">
                  {section.note}
                </p>
              )}

              {Array.isArray(section.items) && section.items.length > 0 && (
                <ul className="mt-8 grid gap-x-12 gap-y-1 sm:grid-cols-2">
                  {section.items.map((item: any, i: number) => (
                    <li
                      key={`${section.title}-${i}`}
                      className="grid grid-cols-[1fr_auto] gap-x-6 py-4 border-b border-[hsl(var(--pub-ink)/0.08)]"
                    >
                      <p className="pub-display text-base md:text-lg uppercase text-[hsl(var(--pub-oxblood))] leading-tight">
                        {item.name}
                      </p>
                      {item.price && (
                        <p className="font-cb-mono text-sm tracking-wider text-[hsl(var(--pub-brass-deep))] tabular-nums whitespace-nowrap">
                          £{String(item.price).replace(/^£/, "")}
                        </p>
                      )}
                      {item.description && (
                        <p className="font-cb-sans text-sm text-[hsl(var(--pub-ink)/0.7)] col-span-2 mt-1">
                          {item.description}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
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

export default PubFood;
export { SubHero };
