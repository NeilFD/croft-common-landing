import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useProperty } from "@/contexts/PropertyContext";
import { getHeroFor } from "@/data/propertyHeroMap";

interface Props {
  title: string;
  eyebrow?: string;
  body?: string;
  fallbackHero?: string;
}

const PropertyPage = ({ title, eyebrow, body, fallbackHero }: Props) => {
  const { config } = useProperty();
  const location = useLocation();
  const hero = getHeroFor(location.pathname, fallbackHero ?? "");

  return (
    <>
      <Helmet>
        <title>{`${title} | ${config.name}`}</title>
      </Helmet>
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-black text-white">
        {hero && (
          <img
            src={hero}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 flex h-full items-end px-6 pb-24 md:px-12 md:pb-28">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase opacity-80">
              {eyebrow ?? config.name}
            </p>
            <h1 className="mt-3 font-serif text-5xl md:text-7xl">{title}</h1>
          </div>
        </div>
        <a
          href="#cb-page-body"
          aria-label="Scroll for more"
          className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-white/80 hover:text-white transition-colors"
        >
          <span className="block animate-cb-bounce">
            <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
            </svg>
          </span>
        </a>
      </section>
      <section id="cb-page-body" className="mx-auto max-w-3xl px-6 py-20 text-foreground scroll-mt-16">
        <p className="font-cb-sans text-xl md:text-2xl leading-relaxed">
          {body ?? "More soon. Worth the wait."}
        </p>
      </section>
    </>
  );
};

export default PropertyPage;
