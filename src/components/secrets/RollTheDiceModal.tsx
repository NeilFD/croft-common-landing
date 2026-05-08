import { useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onClose: () => void;
  variant: "dice-town" | "dice-country";
}

const PIPS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

const Die = ({ value, rolling }: { value: number; rolling: boolean }) => (
  <div
    className={`w-24 h-24 sm:w-28 sm:h-28 bg-white text-black border-2 border-white grid grid-cols-3 grid-rows-3 gap-1 p-3 transition-transform ${
      rolling ? "animate-spin" : ""
    }`}
    aria-label={`Die showing ${value}`}
  >
    {Array.from({ length: 9 }).map((_, i) => {
      const r = Math.floor(i / 3);
      const c = i % 3;
      const on = PIPS[value]?.some(([pr, pc]) => pr === r && pc === c);
      return (
        <span
          key={i}
          className={`rounded-full ${on ? "bg-black" : "bg-transparent"}`}
        />
      );
    })}
  </div>
);

// Crypto-backed unbiased uniform 1..6
const rollDie = (): number => {
  const buf = new Uint32Array(1);
  // Rejection sampling so distribution is exactly uniform
  const limit = Math.floor(0xffffffff / 6) * 6;
  while (true) {
    crypto.getRandomValues(buf);
    if (buf[0] < limit) return (buf[0] % 6) + 1;
  }
};

const RollTheDiceModal = ({ open, onClose, variant }: Props) => {
  const [a, setA] = useState(1);
  const [b, setB] = useState(6);
  const [rolling, setRolling] = useState(false);
  const [done, setDone] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const region = variant === "dice-town" ? "Town" : "Country";

  const roll = () => {
    setDone(false);
    setRolling(true);
    if (tickRef.current) clearInterval(tickRef.current);
    let n = 0;
    tickRef.current = setInterval(() => {
      setA(rollDie());
      setB(rollDie());
      n++;
      if (n >= 12) {
        if (tickRef.current) clearInterval(tickRef.current);
        const finalA = rollDie();
        const finalB = rollDie();
        setA(finalA);
        setB(finalB);
        setRolling(false);
        setDone(true);
      }
    }, 80);
  };

  const total = a + b;
  const win = done && total === 7;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          if (tickRef.current) clearInterval(tickRef.current);
          setDone(false);
          setRolling(false);
          onClose();
        }
      }}
    >
      <DialogContent
        className="max-w-lg bg-black text-white border border-white rounded-none p-0"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="px-8 py-10 sm:px-12">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-white/60">
            Members Only / {region}
          </p>
          <h2 className="mt-3 font-display uppercase text-3xl sm:text-4xl tracking-tight">
            Roll The Dice
          </h2>
          <p className="mt-3 font-cb-sans text-[13px] text-white/70 italic">
            Take this to the bar. Ask the bartender to play. They will watch you roll.
          </p>

          <div className="w-full h-px my-8 bg-white/20" />

          <div className="flex items-center justify-center gap-6">
            <Die value={a} rolling={rolling} />
            <span className="font-display text-3xl text-white/40">+</span>
            <Die value={b} rolling={rolling} />
          </div>

          <div className="mt-8 text-center min-h-[80px]">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
              Total
            </p>
            <p className="mt-1 font-display uppercase text-5xl tracking-tight">
              {rolling ? "—" : total}
            </p>
            {done && (
              win ? (
                <p className="mt-3 font-display uppercase text-xl tracking-tight text-white">
                  Seven
                </p>
              ) : (
                <p className="mt-3 font-cb-mono text-[11px] tracking-[0.3em] uppercase text-white/60">
                  Not this time
                </p>
              )
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={roll}
              disabled={rolling}
              className="flex-1 border border-white bg-white text-black font-cb-mono text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {rolling ? "Rolling" : done ? "Roll Again" : "Roll"}
            </button>
            <button
              onClick={() => {
                if (tickRef.current) clearInterval(tickRef.current);
                onClose();
              }}
              className="flex-1 border border-white text-white font-cb-mono text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-white hover:text-black transition-colors"
            >
              Close
            </button>
          </div>

          <div className="mt-8 border-t border-white/15 pt-6 space-y-1.5">
            <p className="font-cb-mono text-[9px] tracking-[0.4em] uppercase text-white/50">
              House Rules
            </p>
            <p className="font-cb-sans text-[12px] text-white/65 leading-relaxed">
              One roll per member, per visit. Bartender must witness the roll. All wins honoured at the discretion of The Crazy Bear.
            </p>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RollTheDiceModal;
