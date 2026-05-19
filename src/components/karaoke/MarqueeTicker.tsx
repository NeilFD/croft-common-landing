interface Props {
  items: string[];
}

/**
 * Infinite scroll marquee. The track is duplicated so the loop is seamless.
 */
const MarqueeTicker = ({ items }: Props) => {
  const row = (
    <div className="flex shrink-0 items-center gap-16 px-8">
      {items.map((t, i) => (
        <span
          key={i}
          className="kar-condensed text-2xl md:text-3xl uppercase whitespace-nowrap text-[hsl(var(--kar-neon))]"
          style={{
            textShadow:
              "0 0 4px hsl(var(--kar-neon) / 0.9), 0 0 12px hsl(var(--kar-neon) / 0.8), 0 0 28px hsl(var(--kar-neon) / 0.6), 0 0 48px hsl(var(--kar-neon) / 0.45)",
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );

  return (
    <div
      className="relative overflow-hidden bg-[hsl(var(--kar-black))] border-y border-[hsl(var(--kar-neon))] py-4"
      style={{
        boxShadow:
          "inset 0 0 40px hsl(var(--kar-neon) / 0.25), 0 0 24px hsl(var(--kar-neon) / 0.35)",
      }}
    >
      <div className="flex kar-marquee-track" aria-hidden="true">
        {row}
        {row}
      </div>
    </div>
  );
};

export default MarqueeTicker;
