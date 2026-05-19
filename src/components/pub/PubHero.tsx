import { useCMSAssets } from "@/hooks/useCMSAssets";
import { CMSText } from "@/components/cms/CMSText";

/**
 * Full-bleed dim photo, low light. Etched-glass H1, hand-painted feel.
 * Editable via CMS: page="pub", section="hero".
 */
const PubHero = () => {
  const { assets } = useCMSAssets("pub", "hero");
  const heroImage = assets[0]?.src;

  return (
    <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden bg-[hsl(var(--pub-oxblood-deep))]">
      {heroImage && (
        <img
          src={heroImage}
          alt={assets[0]?.alt ?? ""}
          className="absolute inset-0 h-full w-full object-cover opacity-65"
          loading="eager"
          decoding="async"
        />
      )}
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, hsl(var(--pub-oxblood-deep) / 0.55) 60%, hsl(var(--pub-oxblood-deep) / 0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
        <CMSText
          page="pub"
          section="hero"
          contentKey="eyebrow"
          fallback="Crazy Bear Country // Stadhampton"
          as="p"
          className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-[hsl(var(--pub-cream))] opacity-80"
        />
        <CMSText
          page="pub"
          section="hero"
          contentKey="title"
          fallback="THE PUB"
          as="h1"
          className="pub-display pub-etched mt-6 text-7xl md:text-9xl uppercase leading-none"
        />
        <div className="pub-brass-rule mt-8 h-px w-40" />
        <CMSText
          page="pub"
          section="hero"
          contentKey="manifesto"
          fallback="Proper ale. Proper food. Proper pub."
          as="p"
          className="mt-6 font-cb-sans text-lg md:text-xl text-[hsl(var(--pub-cream))] opacity-90 max-w-xl"
        />
      </div>
    </section>
  );
};

export default PubHero;
