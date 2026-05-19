import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import { SubHero } from "./PubFood";
import firesideImg from "@/assets/pub/pub-fireside.jpg";
import windowImg from "@/assets/pub/pub-window.jpg";

interface Snack {
  name: string;
  description: string;
  price: string;
}

const SNACKS: Snack[] = [
  { name: "Scotch egg", description: "Soft-yolk, Old Spot sausage, nam jim jaew", price: "8" },
  { name: "Sausage roll", description: "Hand-raised, smoked chilli jam", price: "7" },
  { name: "Pork scratchings", description: "Crisp, salty, dangerous. With apple sauce.", price: "5" },
  { name: "Crispy wings", description: "Tamarind glaze, toasted sesame", price: "9" },
  { name: "Padron peppers", description: "Sea salt, lime", price: "6" },
  { name: "Prawn crackers", description: "Sweet chilli, pickled garlic", price: "5" },
  { name: "Pork pie", description: "Melton-style, hot water crust, proper jelly. Piccalilli.", price: "5" },
  { name: "Pickled egg", description: "From the jar on the bar. As it should be.", price: "2" },
  { name: "Olives & cornichons", description: "Castelvetrano olives, cornichons, salt almonds", price: "5" },
  { name: "Bread & dripping", description: "Toasted sourdough, beef dripping, flaked salt", price: "4.50" },
];

const PubSnacks = () => {
  return (
    <>
      <CBSeo
        title="Bar Snacks | The Pub | Crazy Bear Country"
        description="Pork pie. Scotch egg. Pickled egg. Scratchings. Bar snacks done properly at The Pub, Crazy Bear Country."
        path="/pub/snacks"
        jsonLd={[breadcrumbSchema("/pub/snacks")]}
      />
      <SubHero
        page="pub-snacks"
        eyebrow="The Pub // Snacks"
        title="Bar Snacks"
        manifesto="Pork pie. Scotch egg. Scratchings. The good stuff."
      />

      {/* Photo + intro */}
      <section className="bg-[hsl(var(--pub-oxblood-deep))] text-[hsl(var(--pub-cream))]">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2">
          <div className="relative min-h-[360px] lg:min-h-[480px]">
            <img
              src={firesideImg}
              alt="By the fireside"
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div className="px-8 py-16 md:px-14 md:py-20">
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))]">
              At the bar
            </p>
            <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase leading-none">
              For one hand, drink in the other.
            </h2>
            <div className="mt-5 h-px w-12 bg-[hsl(var(--pub-brass))]" />
            <p className="mt-8 font-cb-sans text-base md:text-lg leading-relaxed text-[hsl(var(--pub-cream)/0.85)]">
              Served all day, every day. From the bar, by the fire, in the garden.
              No bookings. No menus. Just point.
            </p>
          </div>
        </div>
      </section>

      {/* Full list */}
      <section className="bg-[hsl(var(--pub-cream))] text-[hsl(var(--pub-ink))] py-20 md:py-28 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-baseline gap-6">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--pub-brass-deep))] tabular-nums">
              01
            </p>
            <h2 className="pub-display text-3xl md:text-4xl uppercase text-[hsl(var(--pub-oxblood))] leading-none">
              The list
            </h2>
          </div>
          <div className="mt-5 h-px w-full bg-[hsl(var(--pub-ink)/0.15)]" />

          <ul className="mt-8 grid gap-x-12 gap-y-1 sm:grid-cols-2">
            {SNACKS.map((s) => (
              <li
                key={s.name}
                className="grid grid-cols-[1fr_auto] gap-x-6 py-4 border-b border-[hsl(var(--pub-ink)/0.08)]"
              >
                <p className="pub-display text-base md:text-lg uppercase text-[hsl(var(--pub-oxblood))] leading-tight">
                  {s.name}
                </p>
                <p className="font-cb-mono text-sm tracking-wider text-[hsl(var(--pub-brass-deep))] tabular-nums whitespace-nowrap">
                  £{s.price}
                </p>
                <p className="font-cb-sans text-sm text-[hsl(var(--pub-ink)/0.7)] col-span-2 mt-1">
                  {s.description}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-[hsl(var(--pub-oxblood-deep))]">
        <div className="relative h-[280px] md:h-[360px] overflow-hidden">
          <img
            src={windowImg}
            alt="The pub window"
            className="absolute inset-0 h-full w-full object-cover opacity-80"
            loading="lazy"
            decoding="async"
          />
        </div>
      </section>
    </>
  );
};

export default PubSnacks;
