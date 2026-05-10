import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import bearMark from '@/assets/crazy-bear-mark.png';
import CBSubscriptionForm from './CBSubscriptionForm';

import GestureOverlay from '@/components/GestureOverlay';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import MembershipLinkModal from '@/components/MembershipLinkModal';
import { AuthModal } from '@/components/AuthModal';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import { useToast } from '@/hooks/use-toast';

const CBFooter = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLElement>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const { toast } = useToast();
  const {
    bioOpen,
    linkOpen,
    authOpen,
    allowed,
    start,
    reset,
    handleBioSuccess,
    handleBioFallback,
    handleLinkSuccess,
    handleAuthSuccess,
  } = useMembershipGate();

  useEffect(() => {
    if (allowed) {
      reset();
      navigate('/bears-den');
    }
  }, [allowed, navigate, reset]);

  return (
    <footer
      ref={containerRef}
      className="relative bg-black text-white border-t border-white/15"
    >
      <div className="mx-auto max-w-6xl px-6 py-20">
        {/* Subscription */}
        <CBSubscriptionForm />

        {/* Info grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/15 pt-12">
          <div>
            <p className="font-display uppercase text-3xl tracking-tight">Crazy Bear</p>
            <p className="mt-3 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
              Two hotels &nbsp;/&nbsp; one spirit
            </p>
          </div>

          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-3">
              Town &mdash; Beaconsfield
            </p>
            <p className="font-cb-sans text-sm leading-relaxed opacity-90">
              75 Wycombe End<br />
              Beaconsfield HP9 1LX
            </p>
            <a
              href="tel:01494673086"
              className="mt-2 inline-block font-cb-sans text-sm underline-offset-4 hover:underline"
            >
              01494 673 086
            </a>
          </div>

          <div>
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 mb-3">
              Country &mdash; Stadhampton
            </p>
            <p className="font-cb-sans text-sm leading-relaxed opacity-90">
              Bear Lane<br />
              Stadhampton OX44 7UR
            </p>
            <a
              href="tel:01865890714"
              className="mt-2 inline-block font-cb-sans text-sm underline-offset-4 hover:underline"
            >
              01865 890 714
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-white/15 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6 flex-wrap">
            <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-50">
              &copy; {new Date().getFullYear()} The Crazy Bear
            </p>
            <Link
              to="/management/login"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-40 hover:opacity-100 transition-opacity"
            >
              Management
            </Link>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100"
            >
              Privacy
            </Link>
            <button
              onClick={() => setLinkModalOpen(true)}
              className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100"
            >
              Link Membership
            </button>
          </div>
        </div>

        {/* Quiet mark — secret gesture target */}
        <div className="mt-12 flex justify-center">
          <img
            src={bearMark}
            alt=""
            className="h-10 w-auto invert opacity-20 hover:opacity-40 transition-opacity"
          />
        </div>
      </div>

      {/* Secret gesture overlay scoped to footer */}
      <GestureOverlay
        onGestureComplete={() => start()}
        containerRef={containerRef}
      />

      <BiometricUnlockModal
        isOpen={bioOpen}
        onClose={() => reset()}
        onSuccess={handleBioSuccess}
        onFallback={handleBioFallback}
      />
      <MembershipLinkModal
        open={linkOpen || linkModalOpen}
        onClose={() => {
          if (linkOpen) reset();
          setLinkModalOpen(false);
        }}
        onSuccess={(email) => {
          if (linkOpen) {
            handleLinkSuccess(email);
          } else {
            setLinkModalOpen(false);
            toast({
              title: 'Membership linked',
              description: `Linked to ${email}.`,
            });
          }
        }}
      />
      <AuthModal
        isOpen={authOpen}
        onClose={() => reset()}
        onSuccess={handleAuthSuccess}
      />
    </footer>
  );
};

export default CBFooter;
