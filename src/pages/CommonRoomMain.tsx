import React from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommonRoomHeroCarousel from "@/components/CommonRoomHeroCarousel";
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { AuthModal } from '@/components/AuthModal';
import { useNavigate } from 'react-router-dom';

const CommonRoomMain = () => {
  const { isCMSMode } = useCMSMode();
  const navigate = useNavigate();
  const membershipGate = useMembershipGate();

  // Navigate to member area when authentication is successful
  React.useEffect(() => {
    console.log('[CommonRoomMain] membershipGate.allowed changed:', membershipGate.allowed);
    console.log('[CommonRoomMain] Mobile PWA context:', {
      userAgent: navigator.userAgent,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      viewport: { width: window.innerWidth, height: window.innerHeight }
    });
    
    if (membershipGate.allowed) {
      console.log('[CommonRoomMain] 🚀 MOBILE: Authentication successful, navigating to /den/member');
      
      // Add mobile-specific navigation with retry
      const navigateWithRetry = () => {
        try {
          navigate('/den/member', { replace: true });
          console.log('[CommonRoomMain] ✅ MOBILE: Navigation initiated');
        } catch (error) {
          console.error('[CommonRoomMain] ❌ MOBILE: Navigation failed:', error);
          // Retry after short delay
          setTimeout(() => {
            try {
              window.location.href = '/den/member';
            } catch (e) {
              console.error('[CommonRoomMain] ❌ MOBILE: Fallback navigation failed:', e);
            }
          }, 100);
        }
      };

      // On mobile PWA, add small delay to ensure DOM is ready
      const isMobile = window.innerWidth < 768;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isMobile || isPWA) {
        setTimeout(navigateWithRetry, 50);
      } else {
        navigateWithRetry();
      }
    }
  }, [membershipGate.allowed, navigate]);

  const handleMemberLogin = () => {
    membershipGate.start();
  };

  return (
    <div 
      className="min-h-screen relative overflow-y-auto" 
      style={{ 
        touchAction: 'pan-y pinch-zoom',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}
    >
      {/* Fixed B&W background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url('/lovable-uploads/8f95beef-0163-4ded-a6c4-8b0a8bac8b08.png')`,
          filter: 'grayscale(1) contrast(1.05)',
        }}
      />
      <div className="fixed inset-0 bg-black/55 -z-10" />

      {/* Scrollable content */}
      <div className="relative z-10 text-white">
        {!isCMSMode && <Navigation />}
        <section className="min-h-screen flex items-center" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 120px)', paddingBottom: '6rem' }}>
          <div className="container mx-auto px-6 text-center">
            <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/70 mb-6">
              Members
            </p>
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="title"
              fallback="INSIDE THE DEN"
              as="h1"
              className="font-display uppercase text-5xl md:text-7xl lg:text-8xl tracking-tight leading-[0.9] mb-8"
            />
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="description"
              fallback="Quiet rooms. Loud nights. Yours."
              as="p"
              className="font-sans text-lg md:text-xl text-white/80 max-w-xl mx-auto leading-relaxed mb-12"
            />
            <div>
              <button
                onClick={handleMemberLogin}
                disabled={membershipGate.checking}
                className="inline-block border border-white text-white px-10 py-3 font-mono text-xs tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50 touch-manipulation"
              >
                {membershipGate.checking ? 'Opening' : 'Enter'}
              </button>
            </div>
          </div>
        </section>
      </div>
      
      {/* Authentication Modals */}
      <BiometricUnlockModal
        isOpen={membershipGate.bioOpen}
        onClose={membershipGate.reset}
        onSuccess={membershipGate.handleBioSuccess}
        onFallback={membershipGate.handleBioFallback}
        title="Access Common Room"
        description="Use Face ID or your device passkey to access the member area."
      />
      
      <MembershipLinkModal
        open={membershipGate.linkOpen}
        onClose={membershipGate.reset}
        onSuccess={membershipGate.handleLinkSuccess}
      />
      
      <AuthModal
        isOpen={membershipGate.authOpen}
        onClose={membershipGate.reset}
        onSuccess={membershipGate.handleAuthSuccess}
        title="Member Authentication"
        description="Enter your member email to receive a 6-digit access code."
      />
    </div>
  );
};

export default CommonRoomMain;