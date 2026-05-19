import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import { SubHero } from "./PubFood";
import SnacksStrip from "@/components/pub/SnacksStrip";

interface Snack {
  name: string;
  description: string;
  price: string;
}

const SNACKS: Snack[] = [
  {
    name: "Pork pie",
    description: "Melton-style, hot water crust, proper jelly. With piccalilli.",
    price: "£5",
  },
  {
    name: "Scotch egg",
    description: "Soft-yolk, Old Spot sausage, panko crumb. Mustard mayo.",
    price: "£5.50",
  },
  {
    name: "Pork scratchings",
    description: "Crisp, salty, dangerous. The proper sort.",
    price: "£3.50",
  },
  {
    name: "Pickled egg",
    description: "From the jar on the bar. As it should be.",
    price: "£2",
  },
  {
    name: "Cheese & onion roll",
    description: "Mature cheddar, red onion, soft white roll. Crisps on the side.",
    price: "£4",
  },
  {
    name: "Bag of crisps",
    description: "Ready salted, salt & vinegar, cheese & onion. No frills.",
    price: "£2",
  },
  {
    name: "Olives & cornichons",
    description: "Castelvetrano olives, cornichons, sea salt almonds.",
    price: "£5",
  },
  {
    name: "Bread & dripping",
    description: "Toasted sourdough, beef dripping, flaked salt.",
    price: "£4.50",
  },
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
      <SnacksStrip />
      <section className="bg-[hsl(var(--pub-cream-warm))] py-16 px-6">
        <div className="mx-auto max-w-3xl">
          <ul className="space-y-5">
            {SNACKS.map((s) => (
              <li
                key={s.name}
                className="flex items-baseline justify-between gap-4 border-b border-dashed border-[hsl(var(--pub-ink)/0.2)] pb-4"
              >
                <div>
                  <p className="pub-display text-xl uppercase text-[hsl(var(--pub-ink))] leading-tight">
                    {s.name}
                  </p>
                  <p className="font-cb-sans text-sm opacity-75 mt-1">
                    {s.description}
                  </p>
                </div>
                <p className="font-cb-mono text-lg whitespace-nowrap text-[hsl(var(--pub-brass-deep))]">
                  {s.price}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
};

export default PubSnacks;
