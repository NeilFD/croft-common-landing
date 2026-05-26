import { useCallback, useId, useRef, useState } from "react";
import { MEWS_HOTELS, type MewsHotelKey } from "@/data/mewsHotels";
import { useMewsDistributor } from "@/hooks/useMewsDistributor";

interface Props {
  hotel: MewsHotelKey;
  /** Button label. Defaults to "Book a room". */
  label?: string;
  /** Visual style — matches BookTableButton. */
  variant?: "solid" | "outline" | "ghost";
  /** Colour mode — matches BookTableButton. */
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

/**
 * Mews's distributor renders its OWN full-screen branded overlay attached to
 * <body>. Wrapping it inside a shadcn Dialog caused portal / z-index conflicts
 * that left the iframe blank. We now trigger the native Mews overlay directly
 * from the button — same brand-rich experience the user sees on app.mews.com.
 */
const BookRoomButton = ({
  hotel,
  label = "Book a room",
  variant = "solid",
  tone = "dark",
  className = "",
}: Props) => {
  const reactId = useId();
  const triggerId = `cb-mews-trigger-${reactId.replace(/[:]/g, "")}`;
  const h = MEWS_HOTELS[hotel];
  const { status, open: openMews } = useMewsDistributor();
  const [pending, setPending] = useState(false);
  const waitingRef = useRef(false);

  const tryOpen = useCallback(() => {
    return openMews(h.configurationId, triggerId);
  }, [openMews, h.configurationId, triggerId]);

  const handleClick = useCallback(() => {
    if (tryOpen()) return;

    if (status === "error") {
      window.open(h.fallbackUrl, "_blank", "noopener,noreferrer");
      return;
    }

    // Script still loading — poll briefly, then fall back to a new tab.
    if (waitingRef.current) return;
    waitingRef.current = true;
    setPending(true);
    const started = Date.now();
    const iv = window.setInterval(() => {
      if (tryOpen()) {
        window.clearInterval(iv);
        waitingRef.current = false;
        setPending(false);
        return;
      }
      if (Date.now() - started > 4000) {
        window.clearInterval(iv);
        waitingRef.current = false;
        setPending(false);
        window.open(h.fallbackUrl, "_blank", "noopener,noreferrer");
      }
    }, 150);
  }, [tryOpen, status, h.fallbackUrl]);

  return (
    <button
      id={triggerId}
      type="button"
      onClick={handleClick}
      aria-label={`${label} at ${h.label}`}
      data-property={h.property}
      className={`${baseTypography} ${variantClasses(variant, tone)} ${className}`}
    >
      {pending ? "Loading…" : label}
    </button>
  );
};

export default BookRoomButton;
