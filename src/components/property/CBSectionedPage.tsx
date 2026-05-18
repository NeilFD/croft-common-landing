/**
 * CBSectionedPage — renders a list of anchored sections under a PropertyPage hero.
 * Used for pages like Terraces & Gardens (Country) where one URL holds several
 * adjacent areas (Fishpond / Secret Garden / Garden Terrace / Woodland).
 *
 * When `cmsPage` is supplied, every section title, body and (optional)
 * CTA label is editable from the CMS visual editor.
 */
import { Link } from "react-router-dom";
import { CMSText } from "@/components/cms/CMSText";

export interface CBSection {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  eyebrow?: string;
  cta?: { label: string; href: string };
}

interface Props {
  intro?: string;
  sections: CBSection[];
  /** When set, section copy is wired through CMSText using `section={id}`. */
  cmsPage?: string;
}

const CBSectionedPage = ({ intro, sections, cmsPage }: Props) => {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 text-foreground">
      {intro && (
        cmsPage ? (
          <CMSText
            page={cmsPage}
            section="intro"
            contentKey="body"
            fallback={intro}
            as="p"
            className="mx-auto max-w-3xl text-center font-cb-sans text-lg md:text-xl leading-relaxed opacity-90 mb-12"
          />
        ) : (
          <p className="mx-auto max-w-3xl text-center font-cb-sans text-lg md:text-xl leading-relaxed opacity-90 mb-12">
            {intro}
          </p>
        )
      )}

      {/* Sticky chip nav */}
      <nav className="sticky top-16 z-10 -mx-6 mb-12 border-y border-foreground/10 bg-background/95 backdrop-blur px-6 py-3">
        <ul className="flex flex-wrap gap-3 justify-center">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="inline-block font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-foreground/20 px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
              >
                {cmsPage ? (
                  <CMSText
                    page={cmsPage}
                    section={s.id}
                    contentKey="title"
                    fallback={s.title}
                    as="span"
                  />
                ) : (
                  s.title
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-24">
        {sections.map((s, i) => (
          <article
            key={s.id}
            id={s.id}
            className={`grid gap-8 md:grid-cols-2 md:gap-12 items-center scroll-mt-32 ${
              i % 2 === 1 ? "md:[&>div:first-child]:order-2" : ""
            }`}
          >
            <div>
              {s.imageUrl ? (
                <img
                  src={s.imageUrl}
                  alt={s.title}
                  width={1200}
                  height={900}
                  loading="lazy"
                  className="w-full aspect-[4/3] object-cover bg-muted"
                />
              ) : (
                <div className="w-full aspect-[4/3] bg-muted grid place-items-center">
                  <span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-50">
                    Image coming soon
                  </span>
                </div>
              )}
            </div>
            <div>
              {cmsPage ? (
                <CMSText
                  page={cmsPage}
                  section={s.id}
                  contentKey="eyebrow"
                  fallback={s.eyebrow ?? "Crazy Bear Country"}
                  as="p"
                  className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60"
                />
              ) : (
                <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">
                  {s.eyebrow ?? "Crazy Bear Country"}
                </p>
              )}
              {cmsPage ? (
                <CMSText
                  page={cmsPage}
                  section={s.id}
                  contentKey="title"
                  fallback={s.title}
                  as="h2"
                  className="mt-3 font-serif text-3xl md:text-5xl uppercase"
                />
              ) : (
                <h2 className="mt-3 font-serif text-3xl md:text-5xl uppercase">{s.title}</h2>
              )}
              {cmsPage ? (
                <CMSText
                  page={cmsPage}
                  section={s.id}
                  contentKey="body"
                  fallback={s.body}
                  as="p"
                  className="mt-5 font-cb-sans text-lg leading-relaxed opacity-90 whitespace-pre-line"
                />
              ) : (
                <p className="mt-5 font-cb-sans text-lg leading-relaxed opacity-90 whitespace-pre-line">
                  {s.body}
                </p>
              )}
              {s.cta && (
                <Link
                  to={s.cta.href}
                  className="mt-8 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
                >
                  {cmsPage ? (
                    <CMSText
                      page={cmsPage}
                      section={s.id}
                      contentKey="cta-label"
                      fallback={s.cta.label}
                      as="span"
                    />
                  ) : (
                    s.cta.label
                  )}
                </Link>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CBSectionedPage;
