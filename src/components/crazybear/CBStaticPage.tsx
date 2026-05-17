import { ReactNode } from "react";
import { CBSeo } from "@/components/seo/CBSeo";
import { breadcrumbSchema } from "@/components/seo/CBStructuredData";
import CBTopNav from "@/components/crazybear/CBTopNav";
import CBFooter from "@/components/crazybear/CBFooter";
import { CMSText } from "@/components/cms/CMSText";

interface Props {
  title: string;
  /** Small uppercase eyebrow above the H1. Defaults to "Crazy Bear". */
  eyebrow?: string;
  /** Hero kicker paragraph. */
  intro?: string;
  /** SEO title. Defaults to "<title> | Crazy Bear". */
  seoTitle?: string;
  /** SEO description (will be truncated to 158 chars). */
  seoDescription: string;
  /** Public path for canonical + breadcrumb. */
  path: string;
  /** Extra JSON-LD. */
  jsonLd?: Record<string, any>[];
  /** When set, hero text is editable through the CMS under this page slug. */
  cmsPage?: string;
  children?: ReactNode;
}

/**
 * Standard top-level Crazy Bear shell for root pages that aren't tied to a
 * property (Town / Country). Provides: CBTopNav on dark hero, eyebrow + H1 +
 * intro, body slot on the light background, and CBFooter.
 *
 * Pass `cmsPage` to make hero copy editable in the visual CMS.
 */
const CBStaticPage = ({
  title,
  eyebrow = "Crazy Bear",
  intro,
  seoTitle,
  seoDescription,
  path,
  jsonLd,
  cmsPage,
  children,
}: Props) => (
  <>
    <CBSeo
      title={seoTitle ?? `${title} | Crazy Bear`}
      description={seoDescription.slice(0, 158)}
      path={path}
      jsonLd={[breadcrumbSchema(path), ...(jsonLd ?? [])]}
    />

    <section className="relative bg-black text-white pt-40 md:pt-48 pb-24 md:pb-32 px-6">
      <CBTopNav tone="light" />
      <div className="mx-auto max-w-4xl text-center">
        {cmsPage ? (
          <CMSText
            page={cmsPage}
            section="hero"
            contentKey="eyebrow"
            fallback={eyebrow}
            as="p"
            className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70"
          />
        ) : (
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
            {eyebrow}
          </p>
        )}
        {cmsPage ? (
          <CMSText
            page={cmsPage}
            section="hero"
            contentKey="title"
            fallback={title}
            as="h1"
            className="mt-4 font-serif text-5xl md:text-7xl uppercase"
          />
        ) : (
          <h1 className="mt-4 font-serif text-5xl md:text-7xl uppercase">{title}</h1>
        )}
        {intro && (
          cmsPage ? (
            <CMSText
              page={cmsPage}
              section="hero"
              contentKey="intro"
              fallback={intro}
              as="p"
              className="mt-6 font-cb-sans text-lg md:text-xl opacity-90 max-w-2xl mx-auto whitespace-pre-line"
            />
          ) : (
            <p className="mt-6 font-cb-sans text-lg md:text-xl opacity-90 max-w-2xl mx-auto whitespace-pre-line">
              {intro}
            </p>
          )
        )}
      </div>
    </section>

    <section className="bg-background text-foreground px-6 py-16">
      <div className="mx-auto max-w-4xl">{children}</div>
    </section>

    <CBFooter />
  </>
);

export default CBStaticPage;
