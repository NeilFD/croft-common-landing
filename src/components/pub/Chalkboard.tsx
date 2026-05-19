import caskImg from "@/assets/pub/pub-cask-ales.jpg";
import interiorImg from "@/assets/pub/pub-interior.jpg";
import windowImg from "@/assets/pub/pub-window.jpg";

interface Pour {
  name: string;
  origin: string;
  abv: string;
}

const DEFAULT_POURS: Pour[] = [
  { name: "Old Hooky", origin: "Hook Norton, Oxon", abv: "4.6%" },
  { name: "Tribute", origin: "St Austell, Cornwall", abv: "4.2%" },
  { name: "Loose Cannon Abingdon Bridge", origin: "Abingdon, Oxon", abv: "4.1%" },
  { name: "XT Four", origin: "Long Crendon, Bucks", abv: "3.8%" },
  { name: "Guinness", origin: "Dublin", abv: "4.1%" },
  { name: "Aspall Cyder", origin: "Suffolk", abv: "5.5%" },
];

/**
 * On the bar today — editorial two-column list on deep ink.
 * No frames, no dashed leaders, no chalk dust.
 */
const Chalkboard = () => {
  return (
    <section className="bg-[hsl(var(--pub-ink))] text-[hsl(var(--pub-cream))] py-20 md:py-28 px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))]">
              01 / Cellar
            </p>
            <h2 className="pub-display mt-3 text-5xl md:text-6xl uppercase leading-none">
              On the bar today
            </h2>
          </div>
          <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-[hsl(var(--pub-cream)/0.5)]">
            Rotates weekly
          </p>
        </div>

        <div className="mt-8 h-px w-full bg-[hsl(var(--pub-brass)/0.5)]" />

        <ul className="mt-10 grid gap-x-12 gap-y-1 sm:grid-cols-2">
          {DEFAULT_POURS.map((pour) => (
            <li
              key={pour.name}
              className="flex items-baseline gap-4 py-4 border-b border-[hsl(var(--pub-cream)/0.08)]"
            >
              <div className="flex-1 min-w-0">
                <p className="pub-display text-lg md:text-xl uppercase leading-tight">
                  {pour.name}
                </p>
                <p className="font-cb-sans text-sm mt-1 text-[hsl(var(--pub-cream)/0.6)]">
                  {pour.origin}
                </p>
              </div>
              <p className="font-cb-mono text-sm tracking-wider text-[hsl(var(--pub-brass))] tabular-nums whitespace-nowrap">
                {pour.abv}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid grid-cols-3 gap-3">
          {[caskImg, interiorImg, windowImg].map((src, i) => (
            <div
              key={i}
              className="relative aspect-[16/10] overflow-hidden border border-[hsl(var(--pub-brass)/0.4)]"
            >
              <img
                src={src}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Chalkboard;
