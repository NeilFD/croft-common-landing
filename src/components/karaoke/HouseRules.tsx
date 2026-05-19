const rules = [
  "Two hours, no more, no less.",
  "Bring a crowd or bring nobody.",
  "Drinks in. Phones down.",
  "The bear has the last song. Usually Eye of the Tiger.",
];

const HouseRules = () => (
  <section className="bg-[hsl(var(--kar-noir))] text-[hsl(var(--kar-cream))] px-6 py-24 md:py-32">
    <div className="mx-auto max-w-5xl">
      <p className="kar-condensed text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
        House rules
      </p>
      <h2 className="kar-display mt-4 text-4xl md:text-6xl uppercase leading-[0.95]">
        Four rules.<br />Don't break them.
      </h2>
      <ol className="mt-12 grid gap-px bg-[hsl(var(--kar-blood)/0.4)] sm:grid-cols-2">
        {rules.map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-5 bg-[hsl(var(--kar-noir))] p-8"
          >
            <span className="kar-display text-3xl text-[hsl(var(--kar-neon))] leading-none">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="kar-display text-xl md:text-2xl uppercase leading-tight">
              {r}
            </span>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

export default HouseRules;
