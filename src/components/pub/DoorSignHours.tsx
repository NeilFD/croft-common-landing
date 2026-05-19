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
 * Hours — minimal flat card. No brass frame, no dotted leaders.
 */
const DoorSignHours = () => {
  return (
    <section className="bg-[hsl(var(--pub-oxblood-deep))] py-20 md:py-28 px-6">
      <div className="mx-auto max-w-2xl bg-[hsl(var(--pub-cream))] p-10 md:p-14 text-[hsl(var(--pub-ink))]">
        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass-deep))]">
          Established
        </p>
        <h2 className="pub-display mt-3 text-5xl md:text-6xl uppercase leading-none text-[hsl(var(--pub-oxblood))]">
          The Pub
        </h2>
        <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase mt-3 text-[hsl(var(--pub-ink)/0.6)]">
          Crazy Bear Country // Stadhampton
        </p>

        <div className="my-8 h-px w-full bg-[hsl(var(--pub-ink)/0.15)]" />

        <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass-deep))]">
          Hours
        </p>
        <ul className="mt-5">
          {HOURS.map((h) => (
            <li
              key={h.day}
              className="grid grid-cols-2 gap-4 py-2 border-b border-[hsl(var(--pub-ink)/0.08)] last:border-0"
            >
              <span className="font-cb-sans">{h.day}</span>
              <span className="font-cb-mono text-right tabular-nums">{h.hours}</span>
            </li>
          ))}
        </ul>

        <div className="my-8 h-px w-full bg-[hsl(var(--pub-ink)/0.15)]" />

        <p className="font-cb-sans text-base">
          Bear Lane, Stadhampton, Oxfordshire OX44 7UR
        </p>
        <p className="font-cb-mono text-xs tracking-wider mt-2 text-[hsl(var(--pub-ink)/0.6)]">
          01865 890 714
        </p>
      </div>
    </section>
  );
};

export default DoorSignHours;
