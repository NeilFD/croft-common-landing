import neon from "@/assets/karaoke/neon-peep.jpg";

const NeonManifesto = () => (
  <section className="relative overflow-hidden bg-black">
    <img
      src={neon}
      alt="Red neon signs glowing in a dark window"
      className="absolute inset-0 h-full w-full object-cover opacity-55"
      loading="lazy"
      decoding="async"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/90" />
    <div className="relative z-10 flex flex-col items-center justify-center px-6 py-32 md:py-48 text-center">
      <p className="kar-condensed text-xs md:text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-cream))] opacity-80">
        House manifesto
      </p>
      <h2 className="kar-display mt-6 text-5xl md:text-8xl uppercase leading-[0.9] text-[hsl(var(--kar-cream))]">
        Sing like nobody's<br />
        <span className="kar-neon-text kar-flicker">listening.</span>
      </h2>
      <p className="kar-script mt-10 text-3xl md:text-5xl text-[hsl(var(--kar-neon))] kar-flicker">
        because nobody is
      </p>
    </div>
  </section>
);

export default NeonManifesto;
