import { useEffect, useId, useState } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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

const BookRoomButton = ({
  hotel,
  label = "Book a room",
  variant = "solid",
  tone = "dark",
  className = "",
}: Props) => {
  const [open, setOpen] = useState(false);
  const reactId = useId();
  const mountId = `cb-mews-mount-${reactId.replace(/[:]/g, "")}`;
  const h = MEWS_HOTELS[hotel];
  const { status, open: openMews } = useMewsDistributor();

  // When the dialog opens and Mews is ready, mount the widget into our container.
  useEffect(() => {
    if (!open) return;
    if (status !== "ready") return;
    // Defer to next tick so the mount node is in the DOM.
    const t = window.setTimeout(() => {
      openMews(h.configurationId, mountId);
    }, 50);
    return () => window.clearTimeout(t);
  }, [open, status, openMews, h.configurationId, mountId]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`${label} at ${h.label}`}
        className={`${baseTypography} ${variantClasses(variant, tone)} ${className}`}
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[1100px] w-[96vw] h-[92vh] sm:h-[88vh] p-0 gap-0 border-foreground bg-black text-white rounded-none sm:rounded-none overflow-hidden flex flex-col"
          overlayClassName="bg-black/85"
          data-property={h.property}
        >
          {/* Header */}
          <div className="relative shrink-0 border-b border-white/15 px-6 py-5">
            <span aria-hidden className="absolute top-0 left-0 h-[2px] w-full cb-accent-bg" />
            <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase opacity-70">
              {h.property === "town" ? "Crazy Bear Town" : "Crazy Bear Country"}
            </p>
            <DialogTitle className="mt-2 font-display text-2xl md:text-3xl uppercase tracking-tight">
              {h.label}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Room reservation widget for {h.label}. If the widget does not load,
              use the link below to open the booking page in a new tab.
            </DialogDescription>
          </div>

          {/* Mews mount + loading state */}
          <div className="relative flex-1 bg-white overflow-auto">
            <div id={mountId} className="min-h-full" />
            {status !== "ready" && (
              <div className="absolute inset-0 flex items-center justify-center bg-white">
                <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-black/60">
                  {status === "error" ? "Booking engine unavailable" : "Loading rooms"}
                </p>
              </div>
            )}
          </div>

          {/* Footer fallback */}
          <div className="shrink-0 border-t border-white/15 px-6 py-3 flex items-center justify-between gap-4">
            <p className="font-cb-sans text-xs opacity-70">
              Booking widget not loading?
            </p>
            <a
              href={h.fallbackUrl}
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

export default BookRoomButton;
