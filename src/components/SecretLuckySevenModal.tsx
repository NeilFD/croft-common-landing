import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Dice4, Dice3 } from "lucide-react";
import BiometricUnlockModal from "@/components/BiometricUnlockModal";

interface SecretLuckySevenModalProps {
  open: boolean;
  onClose: () => void;
}

const SecretLuckySevenModal: React.FC<SecretLuckySevenModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [bioModalOpen, setBioModalOpen] = useState(false);
  const [showDice, setShowDice] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmailModalOpen(false);
      setBioModalOpen(false);
      setShowDice(false);
      return;
    }
    // Prefer biometrics; if signed in already, show content
    if (!user) {
      setBioModalOpen(true);
      setEmailModalOpen(false);
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

  const handleBiometricSuccess = () => {
    setBioModalOpen(false);
    setShowDice(true);
  };

  const handleBiometricFallback = () => {
    setBioModalOpen(false);
    setEmailModalOpen(true);
  };

  // Close everything
  const handleCloseAll = () => {
    setEmailModalOpen(false);
    setBioModalOpen(false);
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

            {/* Dice visual (Outline Pair 2 + 5, Animation B) */}
            <div className="flex items-center justify-center py-4 select-none">
              <div className="flex items-center gap-6">
                <div className="micro-tilt">
                  <Dice4 className="w-24 h-24 text-foreground" />
                </div>
                <div className="micro-tilt-reverse">
                  <Dice3 className="w-24 h-24 text-foreground" />
                </div>
              </div>
            </div>

            {/* Copy */}
            <div className="space-y-3">
              <p className="font-industrial text-foreground/90">
                Show this to the bartender. Take the dice. Roll a seven. Your drink’s on us.
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
