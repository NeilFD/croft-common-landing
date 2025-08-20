import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { useMembershipAuth } from '@/hooks/useMembershipAuth';

export const MemberLoginModal = () => {
  const {
    loginOpen,
    bioOpen,
    linkOpen,
    closeMemberLogin,
    handleBioSuccess,
    handleBioFallback,
    handleLinkSuccess
  } = useMembershipAuth();

  return (
    <>
      <Dialog open={loginOpen} onOpenChange={closeMemberLogin}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Member Access</DialogTitle>
            <DialogDescription>
              {bioOpen ? 'Use Face ID / Passkey to verify your membership.' : 
               linkOpen ? 'Verify your membership via email link.' :
               'Verifying your membership credentials...'}
            </DialogDescription>
          </DialogHeader>
          {!bioOpen && !linkOpen && (
            <div className="py-4 text-center text-muted-foreground">
              Checking membership status...
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BiometricUnlockModal
        isOpen={bioOpen}
        onClose={closeMemberLogin}
        onSuccess={handleBioSuccess}
        onFallback={handleBioFallback}
        title="Member Access"
        description="Use Face ID / Passkey to verify your membership."
      />

      <MembershipLinkModal
        open={linkOpen}
        onClose={closeMemberLogin}
        onSuccess={handleLinkSuccess}
      />
    </>
  );
};