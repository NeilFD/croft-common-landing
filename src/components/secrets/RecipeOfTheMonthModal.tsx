import { Dialog, DialogContent } from "@/components/ui/dialog";
import { recipeForRoute } from "@/data/secretRecipes";

interface Props {
  open: boolean;
  onClose: () => void;
  variant: string;
}

const RecipeOfTheMonthModal = ({ open, onClose, variant }: Props) => {
  const r = recipeForRoute(variant);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white text-black border border-black rounded-none p-0">
        <div className="px-8 py-10 sm:px-12">
          <p className="font-cb-mono text-[10px] tracking-[0.5em] uppercase text-black/60">
            Members Only / Recipe Of The Month
          </p>
          <p className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase text-black/70">
            {r.kitchen}
          </p>
          <h2 className="mt-2 font-display uppercase text-3xl sm:text-4xl tracking-tight leading-[0.95]">
            {r.dish}
          </h2>
          <p className="mt-4 font-cb-sans italic text-[14px] text-black/75">
            {r.story}
          </p>
          <p className="mt-2 font-cb-mono text-[10px] tracking-[0.3em] uppercase text-black/50">
            {r.serves}
          </p>

          <div className="w-full h-px my-8 bg-black/15" />

          <h3 className="font-cb-mono text-[11px] tracking-[0.5em] uppercase text-black/80 mb-4">
            Ingredients
          </h3>
          <ul className="space-y-1.5">
            {r.ingredients.map((i) => (
              <li key={i} className="font-cb-sans text-[14px] text-black/85">
                {i}
              </li>
            ))}
          </ul>

          <div className="w-full h-px my-8 bg-black/15" />

          <h3 className="font-cb-mono text-[11px] tracking-[0.5em] uppercase text-black/80 mb-4">
            Method
          </h3>
          <ol className="space-y-4">
            {r.method.map((step, idx) => (
              <li key={idx} className="flex gap-4">
                <span className="font-cb-mono text-[10px] tracking-[0.2em] text-black/50 pt-1 w-6 shrink-0">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="font-cb-sans text-[14px] text-black/85 leading-relaxed">
                  {step}
                </span>
              </li>
            ))}
          </ol>

          <button
            onClick={onClose}
            className="mt-10 w-full border border-black bg-black text-white font-cb-mono text-[11px] tracking-[0.4em] uppercase py-4 hover:bg-white hover:text-black transition-colors"
          >
            Close
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RecipeOfTheMonthModal;
