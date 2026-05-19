import fishChipsImg from "@/assets/pub/pub-fish-chips.jpg";
import windowImg from "@/assets/pub/pub-window.jpg";

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
 * Today's specials — paper menus pinned over a dim pub-window photograph,
 * with a hero fish-and-chips shot anchoring the left.
 */
const PinnedSpecials = () => {
  return (
    <section className="relative py-24 px-6 overflow-hidden">
      <img
        src={windowImg}
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
            "linear-gradient(180deg, hsl(8 60% 5% / 0.88) 0%, hsl(20 30% 10% / 0.92) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-6xl">
        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))] text-center">
          Today
        </p>
        <h2 className="pub-display mt-3 text-5xl md:text-6xl uppercase text-center text-[hsl(var(--pub-cream))]">
          Pinned specials
        </h2>
        <div className="pub-brass-rule mt-4 mx-auto h-px w-24" />

        <div className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_2fr] items-start">
          {/* Hero plate */}
          <figure className="relative overflow-hidden rounded-sm border-2 border-[hsl(var(--pub-brass-deep))] shadow-[0_20px_60px_-20px_hsl(0_0%_0%_/_0.7)]">
            <img
              src={fishChipsImg}
              alt="Beer-battered fish, hand-cut chips, mushy peas and a glass of ale"
              loading="lazy"
              decoding="async"
              className="block w-full h-full object-cover aspect-[3/4]"
            />
            <figcaption className="absolute bottom-0 inset-x-0 p-5 bg-gradient-to-t from-black/90 to-transparent">
              <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--pub-brass))]">
                Fryer
              </p>
              <p className="pub-display text-2xl uppercase text-[hsl(var(--pub-cream))] mt-1">
                Fish & chips, Fridays.
              </p>
            </figcaption>
          </figure>

          {/* Specials stack */}
          <div className="grid gap-6 sm:grid-cols-1">
            {DEFAULT_SPECIALS.map((s, i) => (
              <article
                key={s.name}
                className={`pub-pinned relative p-7 md:p-8 ${
                  i === 0 ? "pub-pinned-tilt-l" : i === 2 ? "pub-pinned-tilt-r" : ""
                }`}
              >
                <span
                  aria-hidden
                  className="absolute -top-2 left-8 w-4 h-4 rounded-full bg-[hsl(var(--pub-brass))] shadow-[0_2px_4px_hsl(var(--pub-ink)/0.4),inset_0_1px_0_hsl(40_60%_70%)]"
                />
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <p className="pub-display text-2xl md:text-3xl uppercase leading-tight text-[hsl(var(--pub-oxblood))]">
                    {s.name}
                  </p>
                  <p className="font-cb-mono text-xl md:text-2xl tracking-wider text-[hsl(var(--pub-ink))]">
                    {s.price}
                  </p>
                </div>
                <div className="pub-brass-rule mt-3 h-px w-16" />
                <p className="mt-4 font-cb-sans text-base leading-relaxed text-[hsl(var(--pub-ink))] opacity-90">
                  {s.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PinnedSpecials;
