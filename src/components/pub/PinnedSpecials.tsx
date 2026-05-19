interface Special {
  name: string;
  description: string;
  price: string;
}

const DEFAULT_SPECIALS: Special[] = [
  {
    name: "Steak & ale pie",
    description: "Slow braised shin, Old Hooky gravy, suet crust. Mash, greens.",
    price: "£18",
  },
  {
    name: "Sunday roast",
    description: "Sirloin of Oxfordshire beef, dripping spuds, Yorkshire, the lot.",
    price: "£24",
  },
  {
    name: "Whole plaice",
    description: "Brown butter, capers, brown shrimp. Chips on the side.",
    price: "£22",
  },
];

/**
 * Today's specials — styled as folded paper menus pinned to a corkboard.
 */
const PinnedSpecials = () => {
  return (
    <section
      className="py-20 px-6"
      style={{
        backgroundColor: "hsl(28 25% 35%)",
        backgroundImage:
          "radial-gradient(hsl(28 30% 28%) 1px, transparent 1px), radial-gradient(hsl(28 35% 22%) 1px, transparent 1px)",
        backgroundSize: "3px 3px, 7px 7px",
      }}
    >
      <div className="mx-auto max-w-6xl">
        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-cream))] opacity-80 text-center">
          Today
        </p>
        <h2 className="pub-display mt-3 text-4xl md:text-5xl uppercase text-center text-[hsl(var(--pub-cream))]">
          Pinned specials
        </h2>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {DEFAULT_SPECIALS.map((s, i) => (
            <article
              key={s.name}
              className={`pub-pinned pub-grain relative p-7 ${
                i === 0 ? "pub-pinned-tilt-l" : i === 2 ? "pub-pinned-tilt-r" : ""
              }`}
            >
              {/* Drawing pin */}
              <span
                aria-hidden
                className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[hsl(var(--pub-brass))] shadow-[0_2px_4px_hsl(var(--pub-ink)/0.4),inset_0_1px_0_hsl(40_60%_70%)]"
              />
              <p className="pub-display text-2xl uppercase leading-tight text-[hsl(var(--pub-oxblood))]">
                {s.name}
              </p>
              <div className="pub-brass-rule mt-3 h-px w-16" />
              <p className="mt-4 font-cb-sans text-base leading-relaxed text-[hsl(var(--pub-ink))] opacity-90">
                {s.description}
              </p>
              <p className="font-cb-mono mt-5 text-2xl tracking-wider text-[hsl(var(--pub-ink))]">
                {s.price}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PinnedSpecials;
