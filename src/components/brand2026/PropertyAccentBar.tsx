/**
 * BRAND 2026 — A thin coloured rule that picks up the active property
 * palette (Red Inferno on Town, Pesto on Country). Reads --cb-accent,
 * which is only set inside a [data-property] subtree, so it stays
 * invisible on the global B&W shell.
 */
interface Props {
  className?: string;
  /** Visual width: short rule (default) or full-bleed bar. */
  variant?: "rule" | "bar";
}

const PropertyAccentBar = ({ className = "", variant = "rule" }: Props) => {
  if (variant === "bar") {
    return (
      <div
        role="presentation"
        aria-hidden
        className={`h-[2px] w-full cb-accent-bg ${className}`}
      />
    );
  }
  return <span role="presentation" aria-hidden className={`cb-accent-rule ${className}`} />;
};

export default PropertyAccentBar;
