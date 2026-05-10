import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import bearMark from "@/assets/crazy-bear-mark.png";
import type { Menu, MenuItem, MenuSection } from "@/data/menus";
import { getHeroFor } from "@/data/propertyHeroMap";
import { CMSText } from "@/components/cms/CMSText";

interface Props {
  menu: Menu;
  /** When set, hero text is editable through the CMS under this page namespace
   *  (e.g. "town/food/black-bear"). When omitted, falls back to static menu data. */
  cmsPage?: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const Dish = ({
  item,
  cmsPage,
  sectionSlug,
}: {
  item: MenuItem;
  cmsPage?: string;
  sectionSlug: string;
}) => {
  const itemSlug = slugify(item.name);
  const keyBase = `item.${sectionSlug}.${itemSlug}`;
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between gap-3">
        {cmsPage ? (
          <CMSText
            page={cmsPage}
            section="menu"
            contentKey={`${keyBase}.name`}
            fallback={item.name}
            as="div"
            className="font-cb-sans font-semibold text-[15px] tracking-wide text-black"
          />
        ) : (
          <span className="font-cb-sans font-semibold text-[15px] tracking-wide text-black">
            {item.name}
          </span>
        )}
        {cmsPage ? (
          <CMSText
            page={cmsPage}
            section="menu"
            contentKey={`${keyBase}.price`}
            fallback={`£${item.price}`}
            as="div"
            className="font-cb-mono text-xs shrink-0 text-black/70"
          />
        ) : (
          <span className="font-cb-mono text-xs shrink-0 text-black/70">
            £{item.price}
          </span>
        )}
      </div>
      {(item.desc || cmsPage) && (
        cmsPage ? (
          <CMSText
            page={cmsPage}
            section="menu"
            contentKey={`${keyBase}.desc`}
            fallback={item.desc ?? ""}
            as="p"
            className="font-cb-sans text-[12px] italic mt-0.5 text-black/65"
          />
        ) : (
          item.desc && (
            <p className="font-cb-sans text-[12px] italic mt-0.5 text-black/65">
              {item.desc}
            </p>
          )
        )
      )}
      {(item.variant || cmsPage) && (
        cmsPage ? (
          item.variant && (
            <CMSText
              page={cmsPage}
              section="menu"
              contentKey={`${keyBase}.variant`}
              fallback={item.variant}
              as="p"
              className="font-cb-mono text-[10px] tracking-[0.2em] uppercase mt-1 text-black/50"
            />
          )
        ) : (
          item.variant && (
            <p className="font-cb-mono text-[10px] tracking-[0.2em] uppercase mt-1 text-black/50">
              {item.variant}
            </p>
          )
        )
      )}
    </div>
  );
};

const SectionHeader = ({
  title,
  subtitle,
  cmsPage,
  sectionSlug,
}: {
  title: string;
  subtitle?: string;
  cmsPage?: string;
  sectionSlug: string;
}) => (
  <div className="mb-8 mt-14 first:mt-0">
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-black/15" />
      {cmsPage ? (
        <CMSText
          page={cmsPage}
          section="menu"
          contentKey={`section.${sectionSlug}.title`}
          fallback={title}
          as="h3"
          className="font-cb-mono text-[11px] tracking-[0.5em] uppercase text-black/80"
        />
      ) : (
        <h3 className="font-cb-mono text-[11px] tracking-[0.5em] uppercase text-black/80">
          {title}
        </h3>
      )}
      <div className="flex-1 h-px bg-black/15" />
    </div>
    {(subtitle || cmsPage) && (
      cmsPage ? (
        subtitle && (
          <CMSText
            page={cmsPage}
            section="menu"
            contentKey={`section.${sectionSlug}.subtitle`}
            fallback={subtitle}
            as="p"
            className="text-center font-cb-mono text-[10px] tracking-[0.3em] uppercase mt-2 text-black/60"
          />
        )
      ) : (
        subtitle && (
          <p className="text-center font-cb-mono text-[10px] tracking-[0.3em] uppercase mt-2 text-black/60">
            {subtitle}
          </p>
        )
      )
    )}
  </div>
);

const Section = ({ section, cmsPage }: { section: MenuSection; cmsPage?: string }) => {
  const sectionSlug = slugify(section.title);
  if (section.note && !section.items) {
    return (
      <>
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          cmsPage={cmsPage}
          sectionSlug={sectionSlug}
        />
        {cmsPage ? (
          <CMSText
            page={cmsPage}
            section="menu"
            contentKey={`section.${sectionSlug}.note`}
            fallback={section.note}
            as="p"
            className="font-cb-sans text-[13px] italic text-center whitespace-pre-line text-black/75"
          />
        ) : (
          <p className="font-cb-sans text-[13px] italic text-center whitespace-pre-line text-black/75">
            {section.note}
          </p>
        )}
      </>
    );
  }
  const items = section.items ?? [];
  if (section.layout === "grid") {
    return (
      <>
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          cmsPage={cmsPage}
          sectionSlug={sectionSlug}
        />
        <div className="grid grid-cols-2 gap-x-8">
          {items.map((i) => (
            <Dish key={i.name} item={i} cmsPage={cmsPage} sectionSlug={sectionSlug} />
          ))}
        </div>
      </>
    );
  }
  if (section.layout === "two-col") {
    const mid = Math.ceil(items.length / 2);
    return (
      <>
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle}
          cmsPage={cmsPage}
          sectionSlug={sectionSlug}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          <div>
            {items.slice(0, mid).map((i) => (
              <Dish key={i.name} item={i} cmsPage={cmsPage} sectionSlug={sectionSlug} />
            ))}
          </div>
          <div>
            {items.slice(mid).map((i) => (
              <Dish key={i.name} item={i} cmsPage={cmsPage} sectionSlug={sectionSlug} />
            ))}
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <SectionHeader
        title={section.title}
        subtitle={section.subtitle}
        cmsPage={cmsPage}
        sectionSlug={sectionSlug}
      />
      <div>
        {items.map((i) => (
          <Dish key={i.name} item={i} cmsPage={cmsPage} sectionSlug={sectionSlug} />
        ))}
      </div>
    </>
  );
};

const CBMenuPage = ({ menu, cmsPage }: Props) => {
  const location = useLocation();
  const hero = getHeroFor(location.pathname, "");
  return (
    <>
      <Helmet>
        <title>{menu.title} | The Crazy Bear</title>
      </Helmet>

      {hero && (
        <section
          className="relative w-full h-[70vh] min-h-[480px] bg-cover bg-center"
          style={{ backgroundImage: `url(${hero})` }}
        >
          <div className="absolute inset-0 bg-black/40" />
        </section>
      )}

      <section className="bg-white text-black font-cb-sans min-h-screen antialiased">
        <div className="max-w-2xl mx-auto px-6 sm:px-10 py-20">
          <div className="flex justify-center mb-6">
            <img
              src={bearMark}
              alt=""
              className="h-14 w-auto opacity-90"
            />
          </div>

          <div className="text-center">
            {cmsPage ? (
              <CMSText
                page={cmsPage}
                section="hero"
                contentKey="eyebrow"
                fallback={menu.eyebrow}
                as="p"
                className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-black/60"
              />
            ) : (
              <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-black/60">
                {menu.eyebrow}
              </p>
            )}
            {cmsPage ? (
              <CMSText
                page={cmsPage}
                section="hero"
                contentKey="title"
                fallback={menu.title}
                as="h1"
                className="mt-3 font-display uppercase text-4xl sm:text-5xl tracking-tight"
              />
            ) : (
              <h1 className="mt-3 font-display uppercase text-4xl sm:text-5xl tracking-tight">
                {menu.title}
              </h1>
            )}
            {(menu.subtitle || cmsPage) && (
              cmsPage ? (
                <CMSText
                  page={cmsPage}
                  section="hero"
                  contentKey="subtitle"
                  fallback={menu.subtitle ?? ""}
                  as="p"
                  className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase text-black/70"
                />
              ) : (
                <p className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase text-black/70">
                  {menu.subtitle}
                </p>
              )
            )}
          </div>

          <div className="w-full h-px my-10 bg-black/15" />

          {menu.sections.map((s) => (
            <Section key={s.title} section={s} cmsPage={cmsPage} />
          ))}

          {(menu.footer || cmsPage) && (
            <>
              <div className="w-full h-px mt-16 mb-4 bg-black/15" />
              {cmsPage ? (
                <CMSText
                  page={cmsPage}
                  section="hero"
                  contentKey="footer"
                  fallback={menu.footer ?? ""}
                  as="p"
                  className="font-cb-mono text-[9px] tracking-[0.2em] uppercase text-center leading-relaxed text-black/50"
                />
              ) : (
                <p className="font-cb-mono text-[9px] tracking-[0.2em] uppercase text-center leading-relaxed text-black/50">
                  {menu.footer}
                </p>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default CBMenuPage;
