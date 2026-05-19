import { Link } from "react-router-dom";

interface Snack {
  name: string;
  price: string;
}

const DEFAULT_SNACKS: Snack[] = [
  { name: "Pork pie", price: "£5" },
  { name: "Scotch egg", price: "£5.50" },
  { name: "Pork scratchings", price: "£3.50" },
  { name: "Pickled egg", price: "£2" },
  { name: "Cheese & onion roll", price: "£4" },
  { name: "Bag of crisps", price: "£2" },
  { name: "Olives & cornichons", price: "£5" },
];

/**
 * Horizontal scroll of pub snacks. Each card a hand-drawn price tag.
 */
const SnacksStrip = () => {
  return (
    <section className="bg-[hsl(var(--pub-oxblood))] py-20 px-6 overflow-hidden">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-cream))] opacity-70">
              At the bar
            </p>
            <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase text-[hsl(var(--pub-cream))]">
              Bar snacks
            </h2>
          </div>
          <Link
            to="/pub/snacks"
            className="font-cb-mono text-[11px] tracking-[0.3em] uppercase text-[hsl(var(--pub-brass))] underline-offset-4 hover:underline"
          >
            See the lot →
          </Link>
        </div>

        <div className="mt-10 -mx-6 px-6 overflow-x-auto scrollbar-none">
          <ul className="flex gap-5 pb-2">
            {DEFAULT_SNACKS.map((snack, i) => (
              <li
                key={snack.name}
                className={`pub-pinned pub-grain shrink-0 w-44 md:w-52 px-5 py-6 ${
                  i % 2 === 0 ? "pub-pinned-tilt-l" : "pub-pinned-tilt-r"
                }`}
              >
                <p className="pub-display text-xl uppercase leading-tight text-[hsl(var(--pub-oxblood))]">
                  {snack.name}
                </p>
                <div className="pub-brass-rule mt-3 h-px w-full" />
                <p className="font-cb-mono mt-3 text-2xl tracking-wider text-[hsl(var(--pub-ink))]">
                  {snack.price}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SnacksStrip;
