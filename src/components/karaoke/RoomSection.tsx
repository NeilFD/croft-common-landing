import chandelier from "@/assets/karaoke/chandelier.jpg";

const stats = [
  { k: "12", l: "Max in the booth" },
  { k: "2 HRS", l: "Per slot, no encore" },
  { k: "30K+", l: "Tracks in the book" },
];

const RoomSection = () => (
  <section className="relative bg-[hsl(var(--kar-noir))] text-[hsl(var(--kar-cream))]">
    <div className="grid md:grid-cols-2">
      <div className="relative aspect-[4/5] md:aspect-auto md:min-h-[640px] overflow-hidden">
        <img
          src={chandelier}
          alt="Crystal chandelier above the karaoke room"
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[hsl(var(--kar-noir))]" />
      </div>
      <div className="flex flex-col justify-center px-8 py-20 md:px-16 lg:px-24">
        <p className="kar-condensed text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
          The booth
        </p>
        <h2 className="kar-display mt-4 text-5xl md:text-7xl uppercase leading-[0.9]">
          A private room.<br />
          A bad idea.
        </h2>
        <p className="mt-6 max-w-md font-cb-sans text-base md:text-lg text-[hsl(var(--kar-cream))] opacity-80 leading-relaxed">
          Velvet booth. Chrome mic. A door that closes behind you.
          What happens in here stays in here. Usually.
        </p>

        <div className="mt-10 grid grid-cols-3 gap-4 border-t border-[hsl(var(--kar-blood)/0.4)] pt-8">
          {stats.map((s) => (
            <div key={s.k}>
              <p className="kar-display text-3xl md:text-5xl text-[hsl(var(--kar-neon))]">{s.k}</p>
              <p className="mt-2 kar-condensed text-xs tracking-[0.25em] uppercase opacity-70">
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default RoomSection;
