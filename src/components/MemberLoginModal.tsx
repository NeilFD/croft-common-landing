import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { useMembershipAuth } from '@/hooks/useMembershipAuth';

export const MemberLoginModal = () => {
  const {
    bioOpen,
    linkOpen,
    closeMemberLogin,
    handleBioSuccess,
    handleBioFallback,
    handleLinkSuccess
  } = useMembershipAuth();

  return (
    <>
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