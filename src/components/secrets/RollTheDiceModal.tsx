import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { townDice, countryDice, type DiceCategory } from "@/data/secretCocktailDice";

interface Props {
  open: boolean;
  onClose: () => void;
  variant: "dice-town" | "dice-country";
}

const roll = (dice: DiceCategory[]) =>
  dice.map((d) => d.faces[Math.floor(Math.random() * d.faces.length)]);

const RollTheDiceModal = ({ open, onClose, variant }: Props) => {
  const dice = variant === "dice-town" ? townDice : countryDice;
  const [result, setResult] = useState<string[]>(() => roll(dice));
  const [rolling, setRolling] = useState(false);

  const reroll = () => {
    setRolling(true);
    let n = 0;
    const tick = setInterval(() => {
      setResult(roll(dice));
      n++;
      if (n >= 8) {
        clearInterval(tick);
        setRolling(false);
      }
    }, 70);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl bg-black text-white border border-white rounded-none p-0">
        <div className="px-8 py-10 sm:px-12">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-white/60">
            Members Only
          </p>
          <h2 className="mt-3 font-display uppercase text-3xl sm:text-4xl tracking-tight">
            Roll The Dice
          </h2>
          <p className="mt-3 font-cb-sans text-[13px] text-white/70 italic">
            Five dice. One drink. The bar will make whatever lands.
          </p>

          <div className="w-full h-px my-8 bg-white/20" />

          <div className="space-y-4">
            {dice.map((d, idx) => (
              <div key={d.label} className="flex items-baseline justify-between gap-4 border-b border-white/15 pb-3">
                <span className="font-cb-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
                  {d.label}
                </span>
                <span
                  className={`font-display uppercase text-xl sm:text-2xl tracking-tight ${
                    rolling ? "opacity-60" : ""
                  }`}
                >
                  {result[idx]}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={reroll}
              disabled={rolling}
              className="flex-1 border border-white bg-white text-black font-cb-mono text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-black hover:text-white transition-colors disabled:opacity-50"
            >
              {rolling ? "Rolling" : "Roll Again"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-white text-white font-cb-mono text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-white hover:text-black transition-colors"
            >
              Close
            </button>
          </div>

          <p className="mt-6 font-cb-mono text-[9px] tracking-[0.3em] uppercase text-white/40 text-center">
            Show this screen at the bar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RollTheDiceModal;
