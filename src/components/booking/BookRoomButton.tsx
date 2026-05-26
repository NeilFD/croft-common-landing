import { useEffect, useRef, useState } from "react";
import { MEWS_HOTELS, type MewsHotelKey } from "@/data/mewsHotels";
import { useMewsDistributor } from "@/hooks/useMewsDistributor";

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
  const triggerId = `cb-mews-trigger-${hotel}`;
  const { status, open, isReady } = useMewsDistributor(h.configurationId, triggerId);
  const [pending, setPending] = useState(false);
  const waitingRef = useRef(false);

  useEffect(() => {
    if (!waitingRef.current || !isReady) return;
    waitingRef.current = false;
    setPending(false);
    open();
  }, [isReady, open]);

  useEffect(() => {
    if (!pending) return;
    const timer = window.setTimeout(() => {
      waitingRef.current = false;
      setPending(false);
    }, 8000);
    return () => {
      window.clearTimeout(timer);
    };
  }, [pending]);

  const handleClick = () => {
    if (pending) return;
    if (open()) return;
    waitingRef.current = true;
    setPending(true);
  };

  const buttonText = pending || status === "loading" ? "Loading…" : label;

  return (
    <button
      id={triggerId}
      type="button"
      onClick={handleClick}
      aria-label={`${label} at ${h.label}`}
      aria-busy={pending || status === "loading"}
      data-property={h.property}
      className={`${baseTypography} ${variantClasses(variant, tone)} ${className}`}
    >
      {buttonText}
    </button>
  );
};

export default BookRoomButton;
