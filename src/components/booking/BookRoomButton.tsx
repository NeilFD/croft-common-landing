import { MEWS_HOTELS, type MewsHotelKey } from "@/data/mewsHotels";

interface Props {
  hotel: MewsHotelKey;
  label?: string;
  variant?: "solid" | "outline" | "ghost";
  tone?: "dark" | "light";
  className?: string;
}

const baseTypography =
  "inline-flex items-center justify-center font-cb-mono text-[10px] tracking-[0.5em] uppercase px-6 py-3 transition-colors";

const variantClasses = (variant: Props["variant"], tone: Props["tone"]) => {
  const dark = tone !== "light";
  switch (variant) {
    case "outline":
      return dark
        ? "border border-foreground text-foreground hover:bg-foreground hover:text-background"
        : "border border-white/80 text-white hover:bg-white hover:text-black";
    case "ghost":
      return dark
        ? "text-foreground underline underline-offset-4 hover:opacity-70"
        : "text-white underline underline-offset-4 hover:opacity-80";
    case "solid":
    default:
      return dark
        ? "bg-foreground text-background hover:opacity-90"
        : "bg-white text-black hover:opacity-90";
  }
};

const BookRoomButton = ({
  hotel,
  label = "Book a room",
  variant = "solid",
  tone = "dark",
  className = "",
}: Props) => {
  const h = MEWS_HOTELS[hotel];

  const handleClick = () => {
    // Same-window redirect to the Mews hosted booking engine.
    // Avoids both the new-tab UX and the Mews "continue on next page" interstitial.
    window.location.href = h.fallbackUrl;
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`${label} at ${h.label}`}
      data-property={h.property}
      className={`${baseTypography} ${variantClasses(variant, tone)} ${className}`}
    >
      {label}
    </button>
  );
};

export default BookRoomButton;
