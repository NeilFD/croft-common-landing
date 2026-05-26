import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

/**
 * Branded near-full-page modal that embeds the Mews booking engine in an
 * iframe. This keeps the user inside our chrome (eyebrow, property accent,
 * obvious close button) instead of bouncing them into a separate tab.
 */
const BookRoomButton = ({
  hotel,
  label = "Book a room",
  variant = "solid",
  tone = "dark",
  className = "",
}: Props) => {
  const h = MEWS_HOTELS[hotel];
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label} at ${h.label}`}
        data-property={h.property}
        className={`${baseTypography} ${variantClasses(variant, tone)} ${className}`}
      >
        {label}
      </button>

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Book a room at ${h.label}`}
          data-property={h.property}
          className="fixed inset-0 z-[100000] flex items-stretch justify-center bg-black/90 p-0 md:p-6"
        >
          <div className="relative flex h-full w-full max-w-6xl flex-col border border-white/20 bg-black text-white">
            {/* Accent bar */}
            <span aria-hidden className="absolute top-0 left-0 h-[3px] w-full cb-accent-bg" />

            {/* Header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/15 px-5 py-4 md:px-8 md:py-5">
              <div className="min-w-0">
                <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
                  {h.property === "town" ? "Crazy Bear Town" : "Crazy Bear Country"} — Rooms
                </p>
                <p className="mt-1 truncate font-display text-xl md:text-2xl uppercase leading-none tracking-tight">
                  {h.label}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={h.fallbackUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden md:inline-flex font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white/40 px-4 py-2 hover:bg-white hover:text-black transition-colors"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close booking"
                  className="inline-flex font-cb-mono text-[10px] tracking-[0.4em] uppercase border border-white px-4 py-2 hover:bg-white hover:text-black transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Iframe */}
            <div className="relative flex-1 bg-white">
              <iframe
                title={`Book a room at ${h.label}`}
                src={h.fallbackUrl}
                className="absolute inset-0 h-full w-full border-0"
                allow="payment *; clipboard-write"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default BookRoomButton;
