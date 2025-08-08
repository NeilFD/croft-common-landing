
import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";

interface SecretBeerModalProps {
  open: boolean;
  onClose: () => void;
  secretWord: string;
}

const SecretBeerModal: React.FC<SecretBeerModalProps> = ({ open, onClose, secretWord }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[86vw] sm:w-auto max-w-[360px] sm:max-w-md border border-border bg-background">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CroftLogo size="sm" />
            <span className="font-brutalist text-foreground tracking-wider">CROFT COMMON</span>
          </div>
          <h2 className="font-brutalist text-foreground text-xl tracking-wider">
            Membership. Not Members
          </h2>
          <p className="font-industrial text-foreground">
            Keep it quiet. Just say the word:{" "}
            <span className="font-semibold text-foreground">{secretWord}</span>
          </p>
          <div className="font-industrial text-foreground">
            <span className="font-semibold">Not-So-Common Keg:</span> £2.5/5
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SecretBeerModal;
