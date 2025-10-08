import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { AuthModal } from "@/components/AuthModal";
import AnimatedDice from "@/components/graphics/AnimatedDice";
import BiometricUnlockModal from "@/components/BiometricUnlockModal";
import MembershipLinkModal from "@/components/MembershipLinkModal";
import { useMembershipGate } from "@/hooks/useMembershipGate";

interface SecretLuckySevenModalProps {
  open: boolean;
  onClose: () => void;
}

const SecretLuckySevenModal: React.FC<SecretLuckySevenModalProps> = ({ open, onClose }) => {
  const { bioOpen, linkOpen, authOpen, allowed, start, reset, handleBioSuccess, handleBioFallback, handleLinkSuccess, handleAuthSuccess } = useMembershipGate();

  useEffect(() => {
    if (!open) { reset(); return; }
    start();
  }, [open, start, reset]);

  const handleCloseAll = () => {
    reset();
    onClose();
  };

  return (
    <>
      <BiometricUnlockModal
        isOpen={bioOpen}
        onClose={handleCloseAll}
        onSuccess={handleBioSuccess}
        onFallback={handleBioFallback}
        title="Unlock Lucky No 7"
        email=""
        description="Use Face ID / Passkey to access."
      />
      <MembershipLinkModal
        open={linkOpen}
        onClose={handleCloseAll}
        onSuccess={(email) => { handleLinkSuccess(email); }}
      />
      <AuthModal
        isOpen={authOpen}
        onClose={handleCloseAll}
        onSuccess={handleAuthSuccess}
        requireAllowedDomain={false}
        title="Unlock Lucky No 7"
        description="We’ll email you a 6-digit verification code to confirm."
      />

      <Dialog open={open && allowed} onOpenChange={(v) => { if (!v) handleCloseAll(); }}>
        <DialogContent hideOverlay={true} className="w-[90vw] max-w-lg border border-border bg-background z-[10001]">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <CroftLogo size="sm" />
              <span className="font-brutalist text-foreground tracking-wider">CROFT COMMON</span>
            </div>

            <h2 className="font-brutalist text-foreground text-2xl md:text-3xl tracking-wider">
              Lucky No 7
            </h2>

            <div className="flex items-center justify-center py-4 select-none">
              <div className="flex items-center gap-6">
                <div className="micro-tilt">
                  <AnimatedDice 
                    className="text-foreground" 
                    pairIndex={0}
                    animationDelay={100}
                  />
                </div>
                <div className="micro-tilt-reverse">
                  <AnimatedDice 
                    className="text-foreground" 
                    pairIndex={1}
                    animationDelay={100}
                  />
                </div>
              </div>
            </div>

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
