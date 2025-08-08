
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface SecretBeerModalProps {
  open: boolean;
  onClose: () => void;
  secretWord: string;
}

const SecretBeerModal: React.FC<SecretBeerModalProps> = ({ open, onClose, secretWord }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md border border-steel/30 bg-background">
        <div className="space-y-4">
          <h2 className="font-brutalist text-foreground text-xl tracking-wider">
            Membership. Not Members
          </h2>
          <p className="font-industrial text-foreground/80">
            Keep it quiet. Just say the word:{" "}
            <span className="font-semibold text-[hsl(var(--accent-orange))]">{secretWord}</span>
          </p>
          <div className="font-industrial text-foreground/90">
            <span className="text-[hsl(var(--accent-orange))] font-semibold">Not So Common Keg:</span>{" "}
            £2.5/5
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecretBeerModal;
