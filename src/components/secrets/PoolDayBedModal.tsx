import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PoolDayBedModal = ({ open, onClose }: Props) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg bg-black text-white border border-white rounded-none p-0">
        <div className="px-8 py-10 sm:px-12">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-white/60">
            Members Only
          </p>
          <h2 className="mt-3 font-display uppercase text-3xl sm:text-4xl tracking-tight leading-[0.95]">
            The Day Bed
          </h2>
          <p className="mt-4 font-cb-sans text-[14px] text-white/75 italic">
            Hidden pool. Members rate. Twenty five percent off any day bed, any afternoon.
          </p>

          <div className="w-full h-px my-8 bg-white/20" />

          <div className="border border-white/30 px-6 py-5">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
              Use Code
            </p>
            <p className="mt-2 font-display uppercase text-3xl tracking-tight">BEAR25</p>
          </div>

          <a
            href="/book?offer=pool-daybed"
            className="mt-8 block text-center border border-white bg-white text-black font-cb-mono text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-black hover:text-white transition-colors"
          >
            Reserve
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

export default PoolDayBedModal;
