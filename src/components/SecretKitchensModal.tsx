import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";

interface SecretKitchensModalProps {
  open: boolean;
  onClose: () => void;
}

const Separator = () => (
  <div className="my-5 text-center select-none" aria-hidden="true">
    <span className="text-foreground/60">⸻</span>
  </div>
);

const SecretKitchensModal: React.FC<SecretKitchensModalProps> = ({ open, onClose }) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (open) {
      // Ensure we start at the top with no lingering text selection
      try { window.getSelection()?.removeAllRanges(); } catch {}
      contentRef.current?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        ref={contentRef}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        className="w-[92vw] sm:w-[86vw] md:max-w-2xl lg:max-w-3xl max-h-[85vh] overflow-y-auto border border-border bg-background"
      >
        <div className="space-y-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <CroftLogo size="sm" />
            <span className="font-brutalist text-foreground tracking-wider">CROFT COMMON</span>
          </div>

          {/* Title */}
          <h2 className="font-brutalist text-foreground text-2xl tracking-wider">Common Tastes</h2>
          <h3 className="font-brutalist text-foreground text-lg tracking-wider">Porchetta Roll, Sage Apricots</h3>

          {/* Meta */}
          <div className="font-industrial text-foreground/80">
            <p>Serves 6 hungry people</p>
            <p>Two days if you’ve got them. Four hours if you don’t.</p>
          </div>

          <Separator />

          {/* Idea */}
          <div className="space-y-2">
            <h4 className="font-brutalist text-foreground tracking-wider">The Idea</h4>
            <p className="font-industrial text-foreground/90 leading-relaxed">
              Pork that falls when you touch it. Skin that shatters. Sage for the ground. Apricots for the lift. All in a soft roll that barely holds it together.
            </p>
          </div>

          <Separator />

          {/* You'll Need */}
          <div className="space-y-3">
            <h4 className="font-brutalist text-foreground tracking-wider">You’ll Need</h4>
            <ul className="font-industrial text-foreground/90 leading-relaxed space-y-1 list-disc pl-5">
              <li>2kg boneless pork belly, skin on</li>
              <li>Sea salt — the good kind</li>
              <li>Black pepper, cracked fresh</li>
              <li>1 bunch sage, leaves only</li>
              <li>6 garlic cloves, smashed</li>
              <li>Zest of 1 lemon</li>
              <li>Olive oil</li>
              <li>200g dried apricots, chopped</li>
              <li>100ml white wine</li>
              <li>6 soft white rolls</li>
            </ul>
          </div>

          <Separator />

          {/* The Day Before */}
          <div className="space-y-2">
            <h4 className="font-brutalist text-foreground tracking-wider">The Day Before</h4>
            <p className="font-industrial text-foreground/90 leading-relaxed">
              Score the skin fine. Salt deep. Flip it. Pepper, lemon zest, chopped sage, garlic — work it into the meat.
              Wrap. Chill overnight. Let the salt get to work.
            </p>
          </div>

          <Separator />

          {/* The Cook */}
          <div className="space-y-2">
            <h4 className="font-brutalist text-foreground tracking-wider">The Cook</h4>
            <p className="font-industrial text-foreground/90 leading-relaxed">
              Oven to 150°C. Roll the belly tight, skin out. Tie it like you mean it. Rack over tin. Three hours until the meat sighs.
              While it goes, warm a pan. Olive oil. Apricots. Wine. Simmer to sticky — your quiet ace.
              Last half hour, oven to 230°C. Let the skin turn to glass.
            </p>
          </div>

          <Separator />

          {/* To Serve */}
          <div className="space-y-2">
            <h4 className="font-brutalist text-foreground tracking-wider">To Serve</h4>
            <p className="font-industrial text-foreground/90 leading-relaxed">
              Slice thick. Stack into rolls. Apricots on top. No sides, unless it’s a pint.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecretKitchensModal;
