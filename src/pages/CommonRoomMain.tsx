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
      console.log('[CommonRoomMain] 🚀 MOBILE: Authentication successful, navigating to /common-room/member');
      
      // Add mobile-specific navigation with retry
      const navigateWithRetry = () => {
        try {
          navigate('/common-room/member', { replace: true });
          console.log('[CommonRoomMain] ✅ MOBILE: Navigation initiated');
        } catch (error) {
          console.error('[CommonRoomMain] ❌ MOBILE: Navigation failed:', error);
          // Retry after short delay
          setTimeout(() => {
            try {
              window.location.href = '/common-room/member';
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
      {/* Fixed background image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url('/lovable-uploads/8f95beef-0163-4ded-a6c4-8b0a8bac8b08.png')`
        }}
      />
      
      {/* Scrollable content */}
      <div className="relative z-10">
        {!isCMSMode && <Navigation />}
        <CommonRoomHeroCarousel />
        <section className="py-24 bg-background">
          <div className="container mx-auto px-6 text-center">
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="title"
              fallback="THE COMMON ROOM"
              as="h2"
              className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground text-center"
            />
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="description"
              fallback="Quiet access. Shared space. Early invites. Inside track."
              as="p"
              className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-4"
            />
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="subtitle"
              fallback="A place to hear first, see first, know first."
              as="p"
              className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-4"
            />
            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="tagline"
              fallback="Membership, not members."
              as="p"
              className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed mb-8"
            />
            <div className="mt-8">
              <button
                onClick={handleMemberLogin}
                disabled={membershipGate.checking}
                className="inline-block bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 touch-manipulation"
              >
                {membershipGate.checking ? 'Checking...' : 'Member Login'}
              </button>
            </div>
          </div>
        </section>
        {!isCMSMode && <Footer showSubscription={false} />}
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