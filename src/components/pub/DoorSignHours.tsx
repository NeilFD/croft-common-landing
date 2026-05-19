const HOURS: { day: string; hours: string }[] = [
  { day: "Monday", hours: "12 — 11" },
  { day: "Tuesday", hours: "12 — 11" },
  { day: "Wednesday", hours: "12 — 11" },
  { day: "Thursday", hours: "12 — 11" },
  { day: "Friday", hours: "12 — Late" },
  { day: "Saturday", hours: "12 — Late" },
  { day: "Sunday", hours: "12 — 10" },
];

/**
 * Opening hours laid out as a pub door sign.
 */
const DoorSignHours = () => {
  return (
    <section className="bg-[hsl(var(--pub-oxblood-deep))] py-20 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="pub-grain border-[6px] border-[hsl(var(--pub-brass))] bg-[hsl(var(--pub-cream))] p-10 md:p-14 text-center shadow-2xl">
          <p className="pub-display text-xs tracking-[0.5em] uppercase text-[hsl(var(--pub-brass-deep))]">
            Established
          </p>
          <h2 className="pub-display mt-2 text-5xl md:text-6xl uppercase text-[hsl(var(--pub-oxblood))]">
            The Pub
          </h2>
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase mt-2 opacity-70">
            Crazy Bear Country // Stadhampton
          </p>

          <div className="pub-brass-rule my-8 h-[2px] w-full" />

          <p className="pub-display text-xs tracking-[0.5em] uppercase text-[hsl(var(--pub-brass-deep))]">
            Hours
          </p>
          <ul className="mt-5 space-y-2">
            {HOURS.map((h) => (
              <li
                key={h.day}
                className="flex items-baseline justify-between gap-4 font-cb-sans"
              >
                <span className="text-[hsl(var(--pub-ink))]">{h.day}</span>
                <span className="flex-1 mx-3 border-b border-dotted border-[hsl(var(--pub-ink)/0.3)] translate-y-[-4px]" />
                <span className="font-cb-mono text-[hsl(var(--pub-ink))]">{h.hours}</span>
              </li>
            ))}
          </ul>

          <div className="pub-brass-rule my-8 h-[2px] w-full" />

          <p className="font-cb-sans text-base">
            Bear Lane, Stadhampton, Oxfordshire OX44 7UR
          </p>
          <p className="font-cb-mono text-xs tracking-wider mt-2 opacity-70">
            01865 890 714
          </p>
        </div>
      </div>
    </section>
  );
};

export default DoorSignHours;
