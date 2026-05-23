/**
 * BRAND 2026 — Accent rule / section break.
 * 2px line in the active property accent. Use to break sections inside
 * Town / Country / Pub. Outside a property scope falls back to foreground.
 */
interface Props {
  width?: string;
  align?: "left" | "center";
  className?: string;
}

const AccentRule = ({ width = "w-24", align = "left", className = "" }: Props) => (
  <span
    aria-hidden
    className={`block h-[2px] cb-accent-bg ${width} ${align === "center" ? "mx-auto" : ""} ${className}`}
  />
);

export default AccentRule;
