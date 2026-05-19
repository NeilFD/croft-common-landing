import disco from "@/assets/karaoke/disco-1.jpg";

const scrollToBooking = () => {
  document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const ClosingCTA = () => (
  <section className="relative h-[70vh] min-h-[520px] overflow-hidden bg-[hsl(var(--kar-black))]">
    <img
      src={disco}
      alt="Mirror-ball dancer silhouette"
      className="absolute inset-0 h-full w-full object-cover opacity-80"
      loading="lazy"
      decoding="async"
    />
    <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black" />
    <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
      <p className="kar-condensed text-xs md:text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]">
        Last orders
      </p>
      <h2 className="kar-display mt-6 text-5xl md:text-8xl uppercase leading-[0.9] text-[hsl(var(--kar-cream))]">
        Your booth<br />awaits.
      </h2>
      <button
        type="button"
        onClick={scrollToBooking}
        className="kar-cta kar-flicker mt-10 inline-flex items-center gap-3 px-10 py-5 kar-condensed text-base md:text-lg uppercase tracking-[0.3em]"
      >
        Book your slot
        <span aria-hidden="true">→</span>
      </button>
    </div>
  </section>
);

export default ClosingCTA;
