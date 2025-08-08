import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";

interface CommonMembershipModalProps {
  open: boolean;
  onClose: () => void;
}

const CommonMembershipModal: React.FC<CommonMembershipModalProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="w-[92vw] sm:w-[86vw] md:max-w-2xl max-h-[85vh] overflow-y-auto border border-border bg-background">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CroftLogo size="sm" />
            <span className="font-brutalist text-foreground tracking-wider">CROFT COMMON</span>
          </div>
          <DialogTitle className="font-brutalist text-foreground tracking-wider text-xl">Common Membership</DialogTitle>
          <DialogDescription className="font-industrial text-foreground/80">
            Membership, not members. Quiet perks for people who stick around.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <section>
            <h3 className="font-brutalist text-foreground tracking-wider">Coffee loyalty</h3>
            <p className="font-industrial text-foreground/80">Snap 1–6, the 7th is on us. Hit Lucky Number 7² for seven free coffees — simple.</p>
          </section>
          <section>
            <h3 className="font-brutalist text-foreground tracking-wider">Members‑only beer</h3>
            <p className="font-industrial text-foreground/80">Occasional kegs and quiet pricing. Ask for the word — no noise, just a nod.</p>
          </section>
          <section>
            <h3 className="font-brutalist text-foreground tracking-wider">House cookbook</h3>
            <p className="font-industrial text-foreground/80">Wood. Fire. Dough. Good Taste</p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommonMembershipModal;
