/**
 * CBSectionedPage — renders a list of anchored sections under a PropertyPage hero.
 * Used for pages like Terraces & Gardens (Country) where one URL holds several
 * adjacent areas (Fishpond / Secret Garden / Garden Terrace / Woodland).
 */
import { Link } from "react-router-dom";

export interface CBSection {
  id: string;
  title: string;
  body: string;
  imageUrl?: string;
  cta?: { label: string; href: string };
}

interface Props {
  intro?: string;
  sections: CBSection[];
}

const CBSectionedPage = ({ intro, sections }: Props) => {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24 text-foreground">
      {intro && (
        <p className="mx-auto max-w-3xl text-center font-cb-sans text-lg md:text-xl leading-relaxed opacity-90 mb-12">
          {intro}
        </p>
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
                {s.title}
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
              <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60">
                Crazy Bear Country
              </p>
              <h2 className="mt-3 font-serif text-3xl md:text-5xl uppercase">{s.title}</h2>
              <p className="mt-5 font-cb-sans text-lg leading-relaxed opacity-90 whitespace-pre-line">
                {s.body}
              </p>
              {s.cta && (
                <Link
                  to={s.cta.href}
                  className="mt-8 inline-block font-cb-mono text-[10px] tracking-[0.5em] uppercase border border-foreground px-6 py-3 hover:bg-foreground hover:text-background transition-colors"
                >
                  {s.cta.label}
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
