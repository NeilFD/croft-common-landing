/**
 * CBMenusIndex — single page listing every menu available at a site,
 * grouped by venue. Renders linkable cards to the venue page and (where
 * present) the inline menu data from src/data/menus.ts.
 *
 * When `cmsPage` is supplied, each venue's name and blurb is editable
 * via the CMS visual editor.
 */
import { Link } from "react-router-dom";
import { CMSText } from "@/components/cms/CMSText";

export interface MenuVenue {
  /** Stable slug used as the CMSText section key. Defaults to the href tail. */
  id?: string;
  name: string;
  href: string;
  blurb: string;
  menus: Array<{ label: string; href?: string; status?: "live" | "coming-soon" }>;
}

interface Props {
  venues: MenuVenue[];
  cmsPage?: string;
}

const slugFor = (v: MenuVenue) =>
  v.id ?? (v.href.replace(/^\/+|\/+$/g, "").replace(/\//g, "-") || "venue");

const CBMenusIndex = ({ venues, cmsPage }: Props) => (
  <section className="mx-auto max-w-5xl px-6 pb-24 text-foreground">
    <ul className="space-y-12">
      {venues.map((v) => {
        const sec = slugFor(v);
        return (
          <li key={v.href} className="border-t border-foreground/15 pt-10">
            <div className="md:flex md:items-baseline md:justify-between">
              <div>
                <h2 className="font-serif text-3xl md:text-4xl uppercase">
                  <Link to={v.href} className="hover:underline">
                    {cmsPage ? (
                      <CMSText
                        page={cmsPage}
                        section={sec}
                        contentKey="name"
                        fallback={v.name}
                        as="span"
                      />
                    ) : (
                      v.name
                    )}
                  </Link>
                </h2>
                {cmsPage ? (
                  <CMSText
                    page={cmsPage}
                    section={sec}
                    contentKey="blurb"
                    fallback={v.blurb}
                    as="p"
                    className="mt-2 font-cb-sans text-base opacity-80 max-w-xl"
                  />
                ) : (
                  <p className="mt-2 font-cb-sans text-base opacity-80 max-w-xl">{v.blurb}</p>
                )}
              </div>
              <Link
                to={v.href}
                className="mt-4 md:mt-0 inline-block font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-foreground/40 px-4 py-2 hover:bg-foreground hover:text-background transition-colors"
              >
                Visit {v.name}
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {v.menus.map((m) => {
                const isComingSoon = m.status === "coming-soon" || !m.href;
                const base =
                  "block w-full text-center font-cb-mono text-[10px] tracking-[0.4em] uppercase px-3 py-4 border";
                if (isComingSoon) {
                  return (
                    <li key={m.label}>
                      <span className={`${base} border-foreground/15 opacity-50`}>
                        {m.label}
                        <br />
                        <span className="opacity-60">Coming soon</span>
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={m.label}>
                    <Link
                      to={m.href!}
                      className={`${base} border-foreground hover:bg-foreground hover:text-background transition-colors`}
                    >
                      {m.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ul>
  </section>
);

export default CBMenusIndex;
