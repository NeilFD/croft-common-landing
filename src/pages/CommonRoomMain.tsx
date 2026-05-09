import React, { useState } from 'react';
import Navigation from '@/components/Navigation';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import { useAuth } from '@/hooks/useAuth';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { AuthModal } from '@/components/AuthModal';
import { useNavigate } from 'react-router-dom';
import denBg from '@/assets/den-bg-neon.jpg';

type Tile = {
  index: string;
  title: string;
  copy: string;
  route: string;
};

const TILES: Tile[] = [
  { index: '01', title: 'Home', copy: 'Streaks. Stats. The lot.', route: '/den/member' },
  { index: '02', title: 'Takeaway', copy: 'Order in. Members only.', route: '/den/member/lunch-run' },
  { index: '03', title: 'Ledger', copy: 'Receipts. Spend. Quiet maths.', route: '/den/member/ledger' },
  { index: '04', title: 'You', copy: 'Profile. Moments. Yours.', route: '/den/member/profile' },
];

const CommonRoomMain = () => {
  const { isCMSMode } = useCMSMode();
  const { user } = useAuth();
  const navigate = useNavigate();
  const membershipGate = useMembershipGate();
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  // Navigate after successful auth, honouring any pending tile target
  React.useEffect(() => {
    if (membershipGate.allowed) {
      const target = pendingTarget || '/den/member';
      const isMobile = window.innerWidth < 768;
      const isPWA = window.matchMedia('(display-mode: standalone)').matches;
      const go = () => {
        try {
          navigate(target, { replace: true });
        } catch {
          window.location.href = target;
        }
      };
      if (isMobile || isPWA) setTimeout(go, 50); else go();
    }
  }, [membershipGate.allowed, navigate, pendingTarget]);

  const handleEnter = (target?: string) => {
    setPendingTarget(target ?? null);
    if (user) {
      navigate(target ?? '/den/member');
      return;
    }
    membershipGate.start();
  };

  return (
    <div
      className="min-h-screen relative overflow-y-auto"
      style={{
        touchAction: 'pan-y pinch-zoom',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
    >
      {/* Fixed B&W Crazy Bear background */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{
          backgroundImage: `url(${denBg})`,
          filter: 'grayscale(1) contrast(1.05)',
        }}
      />
      <div className="fixed inset-0 bg-black/65 -z-10" />

      <div className="relative z-10 text-white">
        {!isCMSMode && <Navigation />}

        <section
          className="min-h-screen flex items-center justify-center"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 120px)', paddingBottom: '6rem' }}
        >
          <div className="mx-auto px-6 text-center flex flex-col items-center max-w-3xl w-full">
            <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/70 mb-6">
              Members
            </p>

            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="title"
              fallback="INSIDE THE DEN"
              as="h1"
              className="font-display uppercase text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-[0.9] mb-6 text-center w-full"
            />

            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="welcome"
              fallback={"A quiet door inside Crazy Bear.\nYours, once you're in."}
              as="p"
              className="font-sans text-base md:text-lg text-white/90 max-w-md mx-auto leading-relaxed mb-6 whitespace-pre-line"
            />

            <CMSText
              page="common-room-main"
              section="hero"
              contentKey="description"
              fallback="Your room for the things members get. Streaks. Spend. Lunch. Late nights. The bits we don't put on the menu."
              as="p"
              className="font-sans text-sm md:text-base text-white/70 max-w-xl mx-auto leading-relaxed mb-10"
            />

            <button
              onClick={() => handleEnter()}
              disabled={membershipGate.checking}
              className="inline-block border border-white text-white px-10 py-3 font-mono text-xs tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors disabled:opacity-50 touch-manipulation mb-16"
            >
              {membershipGate.checking ? 'Opening' : user ? 'Continue' : 'Enter'}
            </button>

            {/* Hairline + section eyebrow */}
            <div className="w-full flex flex-col items-center mb-8">
              <div className="h-px w-16 bg-white/30 mb-6" />
              <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/60">
                What's inside
              </p>
            </div>

            {/* Nav tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {TILES.map((t) => (
                <button
                  key={t.route}
                  onClick={() => handleEnter(t.route)}
                  disabled={membershipGate.checking}
                  className="group text-left border border-white/25 bg-black/40 backdrop-blur-sm p-6 hover:bg-white hover:text-black hover:border-white transition-colors disabled:opacity-50"
                >
                  <p className="font-mono text-[9px] tracking-[0.5em] uppercase text-white/50 group-hover:text-black/60 mb-3">
                    {t.index} / {t.title}
                  </p>
                  <h3 className="font-display uppercase text-2xl md:text-3xl tracking-tight leading-none mb-2">
                    {t.title}
                  </h3>
                  <p className="font-sans text-sm text-white/70 group-hover:text-black/70">
                    {t.copy}
                  </p>
                </button>
              ))}
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
        title="Enter the Den"
        description="Use Face ID or your device passkey to enter."
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
        title="Enter the Den"
        description="Enter your member email. We'll send a 6-digit code."
      />
    </div>
  );
};

export default CommonRoomMain;
