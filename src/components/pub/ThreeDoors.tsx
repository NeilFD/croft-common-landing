import { Link } from "react-router-dom";

interface Door {
  label: string;
  caption: string;
  to: string;
}

const DOORS: Door[] = [
  { label: "Eat", caption: "Pies, chops, Sunday roast.", to: "/pub/food" },
  { label: "Drink", caption: "Cask ale. Proper wine. A short, sharp list.", to: "/pub/drink" },
  { label: "Snacks", caption: "Pork scratchings. Scotch eggs. The good stuff.", to: "/pub/snacks" },
];

/**
 * Three tactile wood-grain "door" panels — primary navigation into the
 * Eat / Drink / Snacks pillars of the pub.
 */
const ThreeDoors = () => {
  return (
    <section className="bg-[hsl(var(--pub-cream-warm))] py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-ink))] opacity-60 text-center">
          Step in
        </p>
        <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase text-center text-[hsl(var(--pub-oxblood))]">
          Three doors
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {DOORS.map((door, i) => (
            <Link
              key={door.to}
              to={door.to}
              className="pub-wood group relative block aspect-[3/4] overflow-hidden rounded-sm border-2 border-[hsl(var(--pub-brass-deep))] transition-transform duration-300 hover:-translate-y-1"
            >
              {/* Brass nameplate */}
              <div
                className={`pub-pinned absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-6 w-[78%] text-center ${
                  i % 2 === 0 ? "pub-pinned-tilt-l" : "pub-pinned-tilt-r"
                }`}
              >
                <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
                  Door {i + 1}
                </p>
                <p className="pub-display mt-2 text-4xl md:text-5xl uppercase text-[hsl(var(--pub-oxblood))]">
                  {door.label}
                </p>
                <div className="pub-brass-rule mx-auto mt-3 h-px w-20" />
                <p className="mt-3 font-cb-sans text-sm text-[hsl(var(--pub-ink))] opacity-80">
                  {door.caption}
                </p>
              </div>

              {/* Brass studs in corners */}
              {[
                "top-3 left-3",
                "top-3 right-3",
                "bottom-3 left-3",
                "bottom-3 right-3",
              ].map((pos) => (
                <span
                  key={pos}
                  aria-hidden
                  className={`absolute ${pos} w-2 h-2 rounded-full bg-[hsl(var(--pub-brass))] shadow-[0_0_0_1px_hsl(var(--pub-brass-deep))]`}
                />
              ))}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ThreeDoors;
