interface Props {
  items: string[];
}

/**
 * Infinite scroll marquee. The track is duplicated so the loop is seamless.
 */
const MarqueeTicker = ({ items }: Props) => {
  const row = (
    <div className="flex shrink-0 items-center gap-10 px-5">
      {items.map((t, i) => (
        <span key={i} className="kar-condensed text-2xl md:text-3xl uppercase whitespace-nowrap">
          {t}
          <span className="mx-10 text-[hsl(var(--kar-neon))]">★</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-[hsl(var(--kar-blood))] border-y border-[hsl(var(--kar-neon))] py-3 text-[hsl(var(--kar-cream))]">
      <div className="flex kar-marquee-track" aria-hidden="true">
        {row}
        {row}
      </div>
    </div>
  );
};

export default MarqueeTicker;
