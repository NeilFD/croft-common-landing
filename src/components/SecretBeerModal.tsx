import React, { useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { AuthModal } from "@/components/AuthModal";
import BiometricUnlockModal from "@/components/BiometricUnlockModal";
import MembershipLinkModal from "@/components/MembershipLinkModal";
import { useMembershipGate } from "@/hooks/useMembershipGate";
import { useMembershipAuth } from "@/contexts/MembershipAuthContext";

interface SecretBeerModalProps {
  open: boolean;
  onClose: () => void;
  secretWord: string;
}

const SecretBeerModal: React.FC<SecretBeerModalProps> = ({ open, onClose, secretWord }) => {
  const { isFullyAuthenticated } = useMembershipAuth();
  const { bioOpen, linkOpen, authOpen, allowed, start, reset, handleBioSuccess, handleBioFallback, handleLinkSuccess, handleAuthSuccess } = useMembershipGate();

  // Check if user is already fully authenticated, if so skip to content
  const showContent = isFullyAuthenticated() || allowed;

  useEffect(() => {
    if (!open) { 
      reset(); 
      return; 
    }
    
    // If already fully authenticated, don't trigger gate
    if (isFullyAuthenticated()) {
      return;
    }
    
    // Otherwise start the membership gate process
    start();
  }, [open, start, reset, isFullyAuthenticated]);

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
        title="Unlock Secret Beer"
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
        title="Unlock Secret Beer"
        description="We’ll email you a 6-digit verification code to confirm."
      />
      <Dialog open={open && showContent} onOpenChange={(v) => { if (!v) handleCloseAll(); }}>
        <DialogContent hideOverlay={true} className="w-[86vw] sm:w-auto max-w-[360px] sm:max-w-md border border-border bg-background z-[10001]">
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
              <span className="font-semibold">Not-So-Common IPA:</span> 2.5/5
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecretBeerModal;
