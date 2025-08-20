import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import GestureOverlay from '@/components/GestureOverlay';
import { Toaster } from '@/components/ui/toaster';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { AuthModal } from '@/components/AuthModal';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import { useMembershipAuth } from '@/hooks/useMembershipAuth';
import { BRAND_LOGO } from '@/data/brand';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';

const CommonRoom = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLElement>(null);
  const { bioOpen, linkOpen, authOpen, allowed, start, reset, handleBioSuccess, handleBioFallback, handleLinkSuccess, handleAuthSuccess } = useMembershipGate();
  const { isMember } = useMembershipAuth();
  const { isCMSMode } = useCMSMode();

  const handleGestureComplete = () => {
    // Check if already authenticated as member first
    if (isMember) {
      navigate('/common-room/main');
      return;
    }
    // Otherwise start membership gate flow
    start();
  };

  useEffect(() => {
    if (allowed || isMember) {
      reset();
      navigate('/common-room/main');
    }
  }, [allowed, isMember, navigate, reset]);
  return (
    <div className="min-h-screen bg-white">
      {!isCMSMode && <Navigation />}
      {/* Hero area with watermark */}
      <main ref={containerRef} className="min-h-screen bg-white relative flex flex-col items-center justify-start pt-40 md:pt-32 px-4">
        {/* Page Title - responsive positioning */}
        <div className="absolute top-40 left-1/2 transform -translate-x-1/2 md:top-24 md:left-[106px] md:transform-none z-20">
          <CMSText
            page="common-room"
            section="hero"
            contentKey="title"
            fallback="THE COMMON ROOM"
            as="h1"
            className="text-xl md:text-3xl font-light text-black tracking-[0.1em] md:tracking-[0.2em] uppercase transition-all duration-300 hover:text-[hsl(var(--accent-sage-green))] cursor-pointer text-center md:text-left"
          />
        </div>
        
        {/* Sign in text - responsive spacing and sizing */}
        <CMSText
          page="common-room"
          section="hero"
          contentKey="subtitle"
          fallback="Sign in here"
          as="h2"
          className="relative z-20 text-lg md:text-2xl font-light text-black tracking-[0.1em] md:tracking-[0.2em] uppercase mb-24 md:mb-20 mt-32 md:mt-16"
        />
        
        {/* Watermark image - positioned absolutely like other carousel pages */}
        <div className="absolute inset-0 z-0 pointer-events-none flex items-start justify-center pt-96 md:pt-48">
          <img 
            src={BRAND_LOGO}
            alt="Common Room Layout"
            className="w-[20rem] h-[20rem] sm:w-[22rem] sm:h-[22rem] md:w-[24rem] md:h-[24rem] lg:w-[26rem] lg:h-[26rem] max-h-[60vh] opacity-20 object-contain"
          />
        </div>
      </main>
      {!isCMSMode && <Footer />}
      <GestureOverlay onGestureComplete={handleGestureComplete} containerRef={containerRef} />
      <BiometricUnlockModal
        isOpen={bioOpen}
        onClose={() => { reset(); }}
        onSuccess={handleBioSuccess}
        onFallback={handleBioFallback}
        title="Unlock The Common Room"
        description="Use Face ID / Passkey to sign in."
      />
      <MembershipLinkModal
        open={linkOpen}
        onClose={() => { reset(); }}
        onSuccess={(email) => { handleLinkSuccess(email); }}
      />
      <AuthModal
        isOpen={authOpen}
        onClose={() => { reset(); }}
        onSuccess={handleAuthSuccess}
        requireAllowedDomain={false}
        title="Unlock The Common Room"
        description="We’ll email you a magic link to confirm."
      />
      <Toaster />
    </div>
  );
};

export default CommonRoom;