import { useLocation } from "react-router-dom";
import { useProperty } from "@/contexts/PropertyContext";
import { getHeroFor, getHeroFitFor } from "@/data/propertyHeroMap";
import HeroCarousel from "./HeroCarousel";
import { CBSeo } from "@/components/seo/CBSeo";
import CBFAQ from "@/components/seo/CBFAQ";
import CBBreadcrumb from "@/components/seo/CBBreadcrumb";
import { CMSText } from "@/components/cms/CMSText";
import { useCMSAssets } from "@/hooks/useCMSAssets";
import {
  hotelSchema,
  restaurantSchema,
  barSchema,
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
} from "@/components/seo/CBStructuredData";
import { cbFaqs } from "@/data/cbFaqs";

interface Props {
  title: string;
  eyebrow?: string;
  body?: string;
  fallbackHero?: string;
  seoDescription?: string;
  faqKey?: string;
  schemaKind?: "hotel" | "restaurant" | "bar" | "none";
  cuisine?: string[];
  extraJsonLd?: Record<string, any>[];
  children?: React.ReactNode;
  /** When set, hero text is editable through the CMS under this page namespace
   *  (e.g. "town/pool"). When omitted, falls back to static props. */
  cmsPage?: string;
}

const PropertyPage = ({
  title,
  eyebrow,
  body,
  fallbackHero,
  seoDescription,
  faqKey,
  schemaKind = "none",
  cuisine,
  extraJsonLd,
  children,
  cmsPage,
}: Props) => {
  const { config } = useProperty();
  const location = useLocation();
  const pageNs = (cmsPage ?? location.pathname.replace(/^\//, "")).toLowerCase();
  const { assets: cmsCarousel } = useCMSAssets(pageNs, "hero-carousel");
  const { assets: cmsHero } = useCMSAssets(pageNs, "hero");
  const fit = getHeroFitFor(location.pathname);
  const carousel = cmsCarousel.length > 0 ? cmsCarousel.map((a) => a.src) : undefined;
  const hero = cmsHero[0]?.src ?? getHeroFor(location.pathname, fallbackHero ?? "");

  const property: "town" | "country" = location.pathname.startsWith("/town") ? "town" : "country";
  const fullTitle = `${title} | ${config.name}`;
  const description =
    seoDescription ?? body ?? `${title} at ${config.name}.`;

  const faqEntry = faqKey ? cbFaqs[faqKey] : undefined;

  const isPropertyHome = location.pathname === "/town" || location.pathname === "/country";
  const ld: Record<string, any>[] = [breadcrumbSchema(location.pathname)];
  if (isPropertyHome) ld.push(organizationSchema());
  if (schemaKind === "hotel") {
    ld.push(hotelSchema(property));
  } else if (schemaKind === "restaurant") {
    ld.push(
      restaurantSchema({
        name: `${title} at ${config.name}`,
        description,
        property,
        cuisine: cuisine ?? ["British"],
        path: location.pathname,
      })
    );
  } else if (schemaKind === "bar") {
    ld.push(
      barSchema({
        name: `${title} at ${config.name}`,
        description,
        property,
        path: location.pathname,
      })
    );
  }
  if (faqEntry) ld.push(faqSchema(faqEntry.faqs));
  if (extraJsonLd) ld.push(...extraJsonLd);

  const eyebrowText = eyebrow ?? config.name;
  const bodyText = body ?? "More soon. Worth the wait.";

  return (
    <>
      <CBSeo
        title={fullTitle}
        description={description.slice(0, 158)}
        path={location.pathname}
        jsonLd={ld}
      />
      <section className="relative h-[70vh] min-h-[480px] w-full overflow-hidden bg-black text-white">
        {carousel ? (
          <HeroCarousel images={carousel} alt={title} />
        ) : (
          hero && (
            <img
              src={hero}
              alt={title}
              className={`absolute inset-0 h-full w-full ${fit === "contain" ? "object-contain" : "object-cover"}`}
            />
          )
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative z-10 flex h-full items-end px-6 pb-24 md:px-12 md:pb-28">
          <div>
            {cmsPage ? (
              <CMSText
                page={cmsPage}
                section="hero"
                contentKey="eyebrow"
                fallback={eyebrowText}
                as="p"
                className="text-[10px] tracking-[0.4em] uppercase opacity-80"
              />
            ) : (
              <p className="text-[10px] tracking-[0.4em] uppercase opacity-80">
                {eyebrowText}
              </p>
            )}
            {cmsPage ? (
              <CMSText
                page={cmsPage}
                section="hero"
                contentKey="title"
                fallback={title}
                as="h1"
                className="mt-3 font-serif text-5xl md:text-7xl"
              />
            ) : (
              <h1 className="mt-3 font-serif text-5xl md:text-7xl">{title}</h1>
            )}
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
      <CBBreadcrumb />
      <section id="cb-page-body" className="mx-auto max-w-3xl px-6 pt-10 pb-20 text-foreground scroll-mt-16">
        {cmsPage ? (
          <CMSText
            page={cmsPage}
            section="hero"
            contentKey="body"
            fallback={bodyText}
            as="p"
            className="font-cb-sans text-xl md:text-2xl leading-relaxed"
          />
        ) : (
          <p className="font-cb-sans text-xl md:text-2xl leading-relaxed">
            {bodyText}
          </p>
        )}
      </section>
      {children}
      {(cmsPage || faqEntry) && (
        <CBFAQ
          cmsPage={cmsPage}
          fallbackFaqs={faqEntry?.faqs}
          title={faqEntry?.title ?? "Asked and answered."}
        />
      )}
    </>
  );
};

export default PropertyPage;
