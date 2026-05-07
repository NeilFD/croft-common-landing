import { Helmet } from "react-helmet-async";
import bearMark from "@/assets/crazy-bear-mark.png";
import type { Menu, MenuItem, MenuSection } from "@/data/menus";

interface Props {
  menu: Menu;
}

const Dish = ({ item }: { item: MenuItem }) => (
  <div className="mb-5">
    <div className="flex items-baseline justify-between gap-3">
      <span className="font-cb-sans font-semibold text-[15px] tracking-wide text-black">
        {item.name}
      </span>
      <span className="font-cb-mono text-xs shrink-0 text-black/70">
        £{item.price}
      </span>
    </div>
    {item.desc && (
      <p className="font-cb-sans text-[12px] italic mt-0.5 text-black/65">
        {item.desc}
      </p>
    )}
    {item.variant && (
      <p className="font-cb-mono text-[10px] tracking-[0.2em] uppercase mt-1 text-black/50">
        {item.variant}
      </p>
    )}
  </div>
);

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <div className="mb-8 mt-14 first:mt-0">
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-black/15" />
      <h3 className="font-cb-mono text-[11px] tracking-[0.5em] uppercase text-black/80">
        {title}
      </h3>
      <div className="flex-1 h-px bg-black/15" />
    </div>
    {subtitle && (
      <p className="text-center font-cb-mono text-[10px] tracking-[0.3em] uppercase mt-2 text-black/60">
        {subtitle}
      </p>
    )}
  </div>
);

const Section = ({ section }: { section: MenuSection }) => {
  if (section.note && !section.items) {
    return (
      <>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <p className="font-cb-sans text-[13px] italic text-center whitespace-pre-line text-black/75">
          {section.note}
        </p>
      </>
    );
  }
  const items = section.items ?? [];
  if (section.layout === "grid") {
    return (
      <>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="grid grid-cols-2 gap-x-8">
          {items.map((i) => <Dish key={i.name} item={i} />)}
        </div>
      </>
    );
  }
  if (section.layout === "two-col") {
    const mid = Math.ceil(items.length / 2);
    return (
      <>
        <SectionHeader title={section.title} subtitle={section.subtitle} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          <div>{items.slice(0, mid).map((i) => <Dish key={i.name} item={i} />)}</div>
          <div>{items.slice(mid).map((i) => <Dish key={i.name} item={i} />)}</div>
        </div>
      </>
    );
  }
  return (
    <>
      <SectionHeader title={section.title} subtitle={section.subtitle} />
      <div>{items.map((i) => <Dish key={i.name} item={i} />)}</div>
    </>
  );
};

const CBMenuPage = ({ menu }: Props) => {
  return (
    <>
      <Helmet>
        <title>{menu.title} | The Crazy Bear</title>
      </Helmet>

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
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-black/60">
              {menu.eyebrow}
            </p>
            <h1 className="mt-3 font-display uppercase text-4xl sm:text-5xl tracking-tight">
              {menu.title}
            </h1>
            {menu.subtitle && (
              <p className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase text-black/70">
                {menu.subtitle}
              </p>
            )}
          </div>

          <div className="w-full h-px my-10 bg-black/15" />

          {menu.sections.map((s) => (
            <Section key={s.title} section={s} />
          ))}

          {menu.footer && (
            <>
              <div className="w-full h-px mt-16 mb-4 bg-black/15" />
              <p className="font-cb-mono text-[9px] tracking-[0.2em] uppercase text-center leading-relaxed text-black/50">
                {menu.footer}
              </p>
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default CBMenuPage;
