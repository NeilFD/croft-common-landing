import { Link } from "react-router-dom";
import firesideImg from "@/assets/pub/pub-fireside.jpg";

interface Snack {
  name: string;
  detail?: string;
  price: string;
}

// Pulled from the country Pub menu — "To Start".
const SNACKS: Snack[] = [
  { name: "Scotch Egg", detail: "nam jim jaew", price: "8" },
  { name: "Sausage Roll", detail: "smoked chilli jam", price: "7" },
  { name: "Pork Scratchings", detail: "apple sauce", price: "5" },
  { name: "Crispy Wings", detail: "tamarind glaze, sesame", price: "9" },
  { name: "Padron Peppers", detail: "sea salt, lime", price: "6" },
  { name: "Prawn Crackers", detail: "sweet chilli, pickled garlic", price: "5" },
];

/**
 * At the bar — editorial two-column: photograph left, menu list right.
 * No tags, no tilt, no cork.
 */
const SnacksStrip = () => {
  return (
    <section className="bg-[hsl(var(--pub-oxblood-deep))]">
      <div className="mx-auto max-w-6xl grid lg:grid-cols-2">
        {/* Photo */}
        <div className="relative min-h-[420px] lg:min-h-[560px]">
          <img
            src={firesideImg}
            alt="A pint by the fireside"
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        {/* List */}
        <div className="px-8 py-16 md:px-14 md:py-20 text-[hsl(var(--pub-cream))]">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))]">
            At the bar
          </p>
          <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase leading-none">
            Bar snacks
          </h2>
          <div className="mt-5 h-px w-12 bg-[hsl(var(--pub-brass))]" />

          <ul className="mt-10 divide-y divide-[hsl(var(--pub-cream)/0.12)]">
            {SNACKS.map((s) => (
              <li key={s.name} className="flex items-baseline gap-6 py-4">
                <div className="flex-1 min-w-0">
                  <p className="pub-display text-lg md:text-xl uppercase leading-tight">
                    {s.name}
                  </p>
                  {s.detail && (
                    <p className="font-cb-sans text-sm mt-1 text-[hsl(var(--pub-cream)/0.65)]">
                      {s.detail}
                    </p>
                  )}
                </div>
                <p className="font-cb-mono text-base tracking-wider text-[hsl(var(--pub-brass))] tabular-nums">
                  £{s.price}
                </p>
              </li>
            ))}
          </ul>

          <Link
            to="/pub/food"
            className="mt-10 inline-block font-cb-mono text-[11px] tracking-[0.35em] uppercase text-[hsl(var(--pub-brass))] border-b border-[hsl(var(--pub-brass)/0.6)] pb-1 hover:text-[hsl(var(--pub-cream))] hover:border-[hsl(var(--pub-cream))] transition-colors"
          >
            Full menu →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default SnacksStrip;
