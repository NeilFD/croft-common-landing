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
 * Chalkboard listing of what's pouring at the bar. Hand-drawn feel.
 */
const Chalkboard = () => {
  return (
    <section className="bg-[hsl(var(--pub-cream-warm))] py-20 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="pub-chalkboard p-10 md:p-14 rounded-sm">
          <p className="pub-display text-center text-[hsl(var(--pub-brass))] text-xs tracking-[0.5em] uppercase">
            On the bar today
          </p>
          <h2 className="pub-display mt-4 text-center text-4xl md:text-6xl uppercase">
            What's pouring
          </h2>

          <ul className="mt-10 space-y-5">
            {DEFAULT_POURS.map((pour) => (
              <li
                key={pour.name}
                className="flex items-baseline justify-between gap-4 border-b border-dashed border-[hsl(40_25%_70%_/_0.25)] pb-3"
              >
                <div>
                  <p className="pub-display text-2xl md:text-3xl uppercase leading-tight">
                    {pour.name}
                  </p>
                  <p className="font-cb-sans text-sm opacity-70 mt-1">
                    {pour.origin}
                  </p>
                </div>
                <p className="font-cb-mono text-lg tracking-wider text-[hsl(var(--pub-brass))] whitespace-nowrap">
                  {pour.abv}
                </p>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-center font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
            Rotates with the seasons. And the landlord's mood.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Chalkboard;
