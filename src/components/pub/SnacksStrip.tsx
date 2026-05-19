import { Link } from "react-router-dom";
import firesideImg from "@/assets/pub/pub-fireside.jpg";

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
 * Bar snacks — pinned price tags floating over a fireside photograph.
 */
const SnacksStrip = () => {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      {/* Photo base */}
      <img
        src={firesideImg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(8 60% 6% / 0.78) 0%, hsl(8 50% 8% / 0.85) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))]">
              At the bar
            </p>
            <h2 className="pub-display mt-3 text-5xl md:text-6xl uppercase text-[hsl(var(--pub-cream))]">
              Bar snacks
            </h2>
            <div className="pub-brass-rule mt-4 h-px w-24" />
          </div>
          <Link
            to="/pub/snacks"
            className="font-cb-mono text-[11px] tracking-[0.3em] uppercase text-[hsl(var(--pub-brass))] underline-offset-4 hover:underline"
          >
            See the lot →
          </Link>
        </div>

        <div className="mt-12 -mx-6 px-6 overflow-x-auto scrollbar-none">
          <ul className="flex gap-5 pb-4">
            {DEFAULT_SNACKS.map((snack, i) => (
              <li
                key={snack.name}
                className={`pub-pinned shrink-0 w-44 md:w-52 px-5 py-6 ${
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
