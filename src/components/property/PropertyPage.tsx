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
      <section className="relative h-[60vh] min-h-[420px] w-full overflow-hidden bg-black text-white">
        {hero && (
          <img
            src={hero}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 flex h-full items-end px-6 pb-16 md:px-12">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase opacity-80">
              {eyebrow ?? config.name}
            </p>
            <h1 className="mt-3 font-serif text-5xl md:text-7xl">{title}</h1>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-6 py-20 text-foreground">
        <p className="text-base leading-relaxed">
          {body ??
            "Coming soon. We are crafting this page with care - check back shortly."}
        </p>
      </section>
    </>
  );
};

export default PropertyPage;
