import { Link } from "react-router-dom";
import fishChipsImg from "@/assets/pub/pub-fish-chips.jpg";

interface Dish {
  name: string;
  description: string;
  price: string;
}

// Pulled from the country Pub menu — "The Pub" (trad anchors).
const DISHES: Dish[] = [
  {
    name: "Wild Mushroom & Ale Pie",
    description: "shortcrust, mash, buttered greens",
    price: "18",
  },
  {
    name: "Slow-Roast Pork Shoulder",
    description: "crackling, burnt apple, cavolo nero",
    price: "20",
  },
  {
    name: "Smoked Haddock",
    description: "grain mustard cream, poached egg, chives",
    price: "19",
  },
  {
    name: "Bavette Steak",
    description: "dripping chips, béarnaise",
    price: "26",
  },
  {
    name: "Braised Ox Cheek",
    description: "horseradish, bone marrow crumb, greens",
    price: "22",
  },
  {
    name: "Roast Bone Marrow",
    description: "parsley, capers, sourdough",
    price: "13",
  },
];

/**
 * From the kitchen — plate hero + editorial list. No pins, no cork, no tilt.
 */
const PinnedSpecials = () => {
  return (
    <section className="bg-[hsl(var(--pub-cream))] text-[hsl(var(--pub-ink))]">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.1fr_1.4fr]">
        {/* Plate */}
        <figure className="relative">
          <img
            src={fishChipsImg}
            alt="Beer-battered fish, hand-cut chips, mushy peas and a glass of ale"
            loading="lazy"
            decoding="async"
            className="block w-full h-full object-cover aspect-[4/5] lg:aspect-auto lg:min-h-[640px]"
          />
          <figcaption className="absolute left-0 bottom-0 bg-[hsl(var(--pub-cream))] px-6 py-4">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--pub-brass-deep))]">
              Fryer · Fridays
            </p>
            <p className="pub-display text-xl uppercase mt-1 text-[hsl(var(--pub-oxblood))]">
              Fish & chips
            </p>
          </figcaption>
        </figure>

        {/* List */}
        <div className="px-8 py-16 md:px-14 md:py-20">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass-deep))]">
            The Pub menu
          </p>
          <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase leading-none text-[hsl(var(--pub-oxblood))]">
            From the kitchen
          </h2>
          <div className="mt-5 h-px w-12 bg-[hsl(var(--pub-brass-deep))]" />

          <ul className="mt-10 divide-y divide-[hsl(var(--pub-ink)/0.12)]">
            {DISHES.map((d) => (
              <li key={d.name} className="grid grid-cols-[1fr_auto] gap-x-6 py-5">
                <p className="pub-display text-lg md:text-xl uppercase leading-tight text-[hsl(var(--pub-oxblood))]">
                  {d.name}
                </p>
                <p className="font-cb-mono text-base tracking-wider text-[hsl(var(--pub-brass-deep))] tabular-nums">
                  £{d.price}
                </p>
                <p className="font-cb-sans text-sm text-[hsl(var(--pub-ink)/0.75)] col-span-2 mt-1">
                  {d.description}
                </p>
              </li>
            ))}
          </ul>

          <Link
            to="/pub/food"
            className="mt-10 inline-block font-cb-mono text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--pub-oxblood))] border-b border-[hsl(var(--pub-oxblood)/0.4)] pb-1 hover:border-[hsl(var(--pub-oxblood))] transition-colors"
          >
            See the full menu →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PinnedSpecials;
