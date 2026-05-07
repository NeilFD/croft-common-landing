import mark from "@/assets/crazy-bear-mark.png";

interface Props {
  className?: string;
  alt?: string;
  /** "light" = white mark (for dark backgrounds). "dark" = black mark (for light backgrounds). */
  tone?: "light" | "dark";
}

const CrazyBearLogo = ({
  className = "h-9 w-9",
  alt = "Crazy Bear",
  tone = "dark",
}: Props) => (
  <img
    src={mark}
    alt={alt}
    loading="eager"
    className={`${className} ${tone === "light" ? "invert" : ""}`}
  />
);

export default CrazyBearLogo;
