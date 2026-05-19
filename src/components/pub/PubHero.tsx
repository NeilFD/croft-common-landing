import { useCMSAssets } from "@/hooks/useCMSAssets";
import { CMSText } from "@/components/cms/CMSText";
import pubInterior from "@/assets/pub/pub-interior.jpg";

/**
 * Full-bleed pub interior photograph. Etched-glass H1 floats over a deep vignette.
 * CMS asset (page="pub", section="hero") takes precedence over the bundled photo.
 */
const PubHero = () => {
  const { assets } = useCMSAssets("pub", "hero");
  const heroImage = assets[0]?.src ?? pubInterior;
  const heroAlt = assets[0]?.alt ?? "Dark wood pub interior with warm globe lights";

  return (
    <section className="relative h-screen min-h-[760px] w-full overflow-hidden bg-[hsl(var(--pub-oxblood-deep))]">
      <img
        src={heroImage}
        alt={heroAlt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
      {/* Warm tint + deep vignette so type reads */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 45%, hsl(8 40% 10% / 0.35) 0%, hsl(8 55% 8% / 0.78) 55%, hsl(8 60% 5% / 0.95) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(8 60% 6% / 0.45) 0%, transparent 25%, transparent 70%, hsl(8 60% 5% / 0.9) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <CMSText
          page="pub"
          section="hero"
          contentKey="eyebrow"
          fallback="Crazy Bear Country // Stadhampton"
          as="p"
          className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-brass))] opacity-90"
        />
        <CMSText
          page="pub"
          section="hero"
          contentKey="title"
          fallback="THE PUB"
          as="h1"
          className="pub-display pub-etched mt-6 text-7xl md:text-[10rem] uppercase leading-[0.85]"
        />
        <div className="pub-brass-rule mt-8 h-px w-48" />
        <CMSText
          page="pub"
          section="hero"
          contentKey="manifesto"
          fallback="Proper ale. Proper food. Proper pub."
          as="p"
          className="mt-6 font-cb-sans text-lg md:text-2xl text-[hsl(var(--pub-cream))] opacity-95 max-w-xl tracking-wide"
        />
      </div>

      {/* Bottom hint */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-cream))] opacity-60 z-10">
        Step in ↓
      </p>
    </section>
  );
};

export default PubHero;
