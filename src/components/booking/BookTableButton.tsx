import { useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  SEVENROOMS_VENUES,
  type SevenRoomsVenueKey,
} from "@/data/sevenroomsVenues";

interface Props {
  venue: SevenRoomsVenueKey;
  /** Button label. Defaults to "Book a table". */
  label?: string;
  /**
   * Visual style:
   *  - "solid"  — filled accent button (default)
   *  - "outline" — outlined border, transparent fill
   *  - "ghost"  — minimal underline, inherits surrounding colour
   */
  variant?: "solid" | "outline" | "ghost";
  /**
   * Colour mode:
   *  - "dark"  — sits on light bg (default)
   *  - "light" — sits on dark/photo bg
   */
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

const BookTableButton = ({
  venue,
  label = "Book a table",
  variant = "solid",
  tone = "dark",
  className = "",
}: Props) => {
  const [open, setOpen] = useState(false);
  const v = SEVENROOMS_VENUES[venue];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label} at ${v.label}`}
        className={`${baseTypography} ${variantClasses(variant, tone)} ${className}`}
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[1100px] w-[96vw] h-[92vh] sm:h-[88vh] p-0 gap-0 border-foreground bg-black text-white rounded-none sm:rounded-none overflow-hidden flex flex-col"
          overlayClassName="bg-black/85"
          data-property={v.property}
        >
          {/* Header */}
          <div className="relative shrink-0 border-b border-white/15 px-6 py-5">
            <span aria-hidden className="absolute top-0 left-0 h-[2px] w-full cb-accent-bg" />
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
              {v.property === "town" ? "Crazy Bear Town" : "Crazy Bear Country"}
            </p>
            <DialogTitle className="mt-2 font-display text-2xl md:text-3xl uppercase tracking-tight">
              {v.label}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Reservation widget for {v.label}. If the widget does not load, use the
              link below to open the booking page in a new tab.
            </DialogDescription>
          </div>

          {/* Iframe */}
          <div className="relative flex-1 bg-white">
            <iframe
              title={`Book a table at ${v.label}`}
              src={v.url}
              className="absolute inset-0 h-full w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allow="payment *; clipboard-write"
            />
          </div>

          {/* Footer fallback */}
          <div className="shrink-0 border-t border-white/15 px-6 py-3 flex items-center justify-between gap-4">
            <p className="font-cb-sans text-xs opacity-70">
              Booking widget not loading?
            </p>
            <a
              href={v.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase underline underline-offset-4 hover:opacity-80"
            >
              Open in new tab
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BookTableButton;
