
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import CroftLogo from "@/components/CroftLogo";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/hooks/useAuth";

interface SecretBeerModalProps {
  open: boolean;
  onClose: () => void;
  secretWord: string;
}

const SecretBeerModal: React.FC<SecretBeerModalProps> = ({ open, onClose, secretWord }) => {
  const { user } = useAuth();
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!open) {
      setEmailModalOpen(false);
      setShowContent(false);
      return;
    }
    if (!user) {
      setEmailModalOpen(true);
      setShowContent(false);
    } else {
      setShowContent(true);
    }
  }, [open, user]);

  const handleAuthSuccess = () => {
    setEmailModalOpen(false);
    setShowContent(true);
  };

  const handleCloseAll = () => {
    setEmailModalOpen(false);
    setShowContent(false);
    onClose();
  };

  return (
    <>
      <AuthModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSuccess={handleAuthSuccess}
        requireAllowedDomain={false}
        title="Unlock Secret Beer"
        description="We’ll email you a magic link to confirm."
      />
      <Dialog open={open && showContent} onOpenChange={(v) => { if (!v) handleCloseAll(); }}>
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
              <span className="font-semibold">Not-So-Common IPA:</span> 2.5/5
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecretBeerModal;
