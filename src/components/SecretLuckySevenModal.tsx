import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import SolidDice from "@/components/graphics/SolidDice";

interface SecretLuckySevenModalProps {
  open: boolean;
  onClose: () => void;
}

const SecretLuckySevenModal: React.FC<SecretLuckySevenModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const sequence = useMemo(() => [2, 3, 4, 5] as const, []);
  const [faceIndex, setFaceIndex] = useState(0);
  const frontFace = sequence[faceIndex];

  useEffect(() => {
    if (!showDice) return;
    const id = setInterval(() => {
      setFaceIndex((i) => (i + 1) % sequence.length);
    }, 2000);
    return () => clearInterval(id);
  }, [showDice, sequence.length]);

  useEffect(() => {
    if (!open) {
      setEmailModalOpen(false);
      setShowDice(false);
      return;
    }
    // If not signed in, open the auth modal immediately
    if (!user) {
      setEmailModalOpen(true);
      setShowDice(false);
    } else {
      setShowDice(true);
    }
  }, [open, user]);

  // If user signs in successfully, reveal the dice screen
  const handleAuthSuccess = () => {
    setEmailModalOpen(false);
    setShowDice(true);
  };

  // Close everything
  const handleCloseAll = () => {
    setEmailModalOpen(false);
    setShowDice(false);
    onClose();
  };

  return (
    <>
      <AuthModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSuccess={handleAuthSuccess}
        requireAllowedDomain={false}
        title="Unlock Lucky No 7"
        description="We’ll email you a magic link to confirm."
      />

      <Dialog open={open && showDice} onOpenChange={(v) => { if (!v) handleCloseAll(); }}>
        <DialogContent className="w-[90vw] max-w-lg border border-border bg-background">
          <div className="space-y-6">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <CroftLogo size="sm" />
              <span className="font-brutalist text-foreground tracking-wider">CROFT COMMON</span>
            </div>

            {/* Title */}
            <h2 className="font-brutalist text-foreground text-2xl md:text-3xl tracking-wider">
              Lucky No 7
            </h2>

            {/* Dice visual */}
            <div className="flex items-center justify-center py-4 select-none">
              <div className="relative w-40 h-28">
                {/* Back die */}
                <div className="absolute left-6 top-2 rotate-[-12deg] opacity-90">
                  <SolidDice face={2} className="w-20 h-20 text-foreground/80" />
                </div>
                {/* Front die (idle roll 2→3→4→5) */}
                <div className="absolute right-6 bottom-0 rotate-[10deg]">
                  <SolidDice key={frontFace} face={frontFace as 2 | 3 | 4 | 5} className="w-24 h-24 text-foreground animate-fade-in" />
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-3">
              <p className="font-industrial text-foreground/90">
                Show it to the bartender. Take the dice. Roll a seven. Your drink’s on us.
              </p>
              <p className="font-industrial text-steel">
                Two max. Don’t be greedy.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecretLuckySevenModal;
