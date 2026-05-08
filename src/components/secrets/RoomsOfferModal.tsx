import { Dialog, DialogContent } from "@/components/ui/dialog";
import { roomOffers } from "@/data/secretRoomOffers";

interface Props {
  open: boolean;
  onClose: () => void;
  variant: "rooms-town" | "rooms-country";
}

const RoomsOfferModal = ({ open, onClose, variant }: Props) => {
  const offer = roomOffers[variant === "rooms-town" ? "town" : "country"];
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        className="max-w-lg bg-black text-white border border-white rounded-none p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="px-8 py-10 sm:px-12">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-white/60">
            {offer.eyebrow}
          </p>
          <h2 className="mt-3 font-display uppercase text-3xl sm:text-4xl tracking-tight leading-[0.95]">
            {offer.headline}
          </h2>
          <p className="mt-4 font-cb-sans text-[14px] text-white/75 italic">
            One night. Four favours. Booked direct, no questions.
          </p>

          <div className="w-full h-px my-8 bg-white/20" />

          <ul className="space-y-3">
            {offer.perks.map((p) => (
              <li key={p} className="flex gap-3 items-baseline">
                <span className="font-cb-mono text-[10px] text-white/50">+</span>
                <span className="font-cb-sans text-[15px] text-white/90">{p}</span>
              </li>
            ))}
          </ul>

          <a
            href={offer.href}
            className="mt-10 block text-center border border-white bg-white text-black font-cb-mono text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-black hover:text-white transition-colors"
          >
            {offer.cta}
          </a>
          <button
            onClick={onClose}
            className="mt-3 w-full font-cb-mono text-[10px] tracking-[0.3em] uppercase text-white/50 hover:text-white py-2"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RoomsOfferModal;
