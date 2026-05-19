import { useCMSAssets } from "@/hooks/useCMSAssets";
import { CMSText } from "@/components/cms/CMSText";
import discoHero from "@/assets/karaoke/disco-1.jpg";
import DiscoBall from "./DiscoBall";

const scrollToBooking = () => {
  document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const KaraokeHero = () => {
  const { assets } = useCMSAssets("karaoke", "hero");
  const heroImage = assets[0]?.src ?? discoHero;
  const heroAlt = assets[0]?.alt ?? "Mirror-ball dancers on a checkerboard floor";

  return (
    <section className="relative h-screen min-h-[760px] w-full overflow-hidden bg-[hsl(var(--kar-black))]">
      <img
        src={heroImage}
        alt={heroAlt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      {/* Vignette + red wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, hsl(354 78% 10% / 0.35) 0%, hsl(12 8% 6% / 0.78) 60%, hsl(12 8% 4% / 0.96) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(12 8% 4% / 0.55) 0%, transparent 22%, transparent 72%, hsl(12 8% 4% / 0.95) 100%)",
        }}
      />


      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <CMSText
          page="karaoke"
          section="hero"
          contentKey="eyebrow"
          fallback="Crazy Bear Town // After Dark"
          as="p"
          className="kar-condensed text-xs md:text-sm tracking-[0.5em] uppercase text-[hsl(var(--kar-neon))]"
        />
        <h1
          className="kar-display mt-6 text-7xl md:text-[11rem] uppercase leading-[0.85] text-[hsl(var(--kar-cream))]"
          style={{
            textShadow:
              "0 2px 0 hsl(12 8% 4% / 0.4), 0 0 32px hsl(354 78% 42% / 0.5)",
          }}
        >
          <CMSText
            page="karaoke"
            section="hero"
            contentKey="title"
            fallback="KARAOKE"
            as="span"
          />
        </h1>
        <div className="kar-rule mt-8 h-px w-56" />
        <CMSText
          page="karaoke"
          section="hero"
          contentKey="manifesto"
          fallback="Two hours. One booth. No shame."
          as="p"
          className="mt-6 font-cb-sans text-lg md:text-2xl text-[hsl(var(--kar-cream))] opacity-95 max-w-xl tracking-wide"
        />
        <button
          type="button"
          onClick={scrollToBooking}
          className="kar-cta kar-flicker mt-10 inline-flex items-center gap-3 px-8 py-4 kar-condensed text-base md:text-lg uppercase tracking-[0.3em]"
        >
          Book your slot
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 kar-condensed text-xs tracking-[0.5em] uppercase text-[hsl(var(--kar-cream))] opacity-70 z-10">
        Step in ↓
      </p>
    </section>
  );
};

export default KaraokeHero;
