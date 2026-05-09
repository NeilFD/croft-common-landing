import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGoldStatus } from '@/hooks/useGoldStatus';
import { useReferralCode } from '@/hooks/useReferralCode';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { StripeEmbeddedCheckout } from '@/components/payments/StripeEmbeddedCheckout';
import { PaymentTestModeBanner } from '@/components/payments/PaymentTestModeBanner';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { MembershipCard } from '@/components/membership/MembershipCard';

const chip =
  'inline-flex items-center justify-center border border-white/40 text-white px-5 py-2.5 font-mono text-[10px] tracking-[0.4em] uppercase hover:bg-white hover:text-black transition-colors touch-manipulation';

const chipGold =
  'inline-flex items-center justify-center px-6 py-3 font-mono text-[10px] tracking-[0.4em] uppercase touch-manipulation text-[hsl(var(--gold-ink))] border border-[hsl(var(--gold-pale))] hover:opacity-90';

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="font-mono text-[10px] tracking-[0.5em] uppercase text-white/60 mb-3 text-center">
    {children}
  </p>
);

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const GoldMembership: React.FC = () => {
  const { user } = useAuth();
  const { isGold, currentPeriodEnd, cancelAtPeriodEnd, status, loading } = useGoldStatus();
  const { code: referralCode } = useReferralCode();
  const [params] = useSearchParams();
  const incomingRef = params.get('ref') || '';
  const [refInput, setRefInput] = useState(incomingRef);
  const [showCheckout, setShowCheckout] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (incomingRef && !refInput) setRefInput(incomingRef);
  }, [incomingRef]); // eslint-disable-line react-hooks/exhaustive-deps

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.origin + '/den/member/gold',
        },
      });
      if (error || !data?.url) throw new Error(error?.message || 'No portal URL');
      window.open(data.url, '_blank', 'noopener');
    } catch (e) {
      toast({
        title: 'Could not open portal',
        description: e instanceof Error ? e.message : 'Try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setPortalLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: text });
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' });
    }
  };

  const shareUrl = referralCode
    ? `${window.location.origin}/den/member/gold?ref=${referralCode}`
    : '';

  return (
    <div className="min-h-screen relative overflow-y-auto bg-black">
      <PaymentTestModeBanner />
      <Navigation />

      <div
        className="container mx-auto px-6 pb-24 max-w-3xl text-white"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}
      >
        <div className="mb-10">
          <Link
            to="/den/member"
            className="inline-flex items-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 hover:text-white transition-colors"
          >
            ← Back
          </Link>
        </div>

        <div className="text-center mb-10">
          <p className="font-mono text-[10px] md:text-xs tracking-[0.5em] uppercase text-white/70 mb-6">
            The Den
          </p>
          <h1 className="font-display uppercase text-5xl md:text-7xl tracking-tight leading-[0.9] mb-6">
            Gold
          </h1>
          <p className="font-sans text-base md:text-lg text-white/80 max-w-md mx-auto leading-relaxed">
            25% off. Always. In-app and in-venue.
          </p>
        </div>

        <div className="mb-10">
          <MembershipCard />
        </div>

        {loading ? (
          <p className="text-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/50">
            Loading
          </p>
        ) : isGold ? (
          <div className="border border-[hsl(var(--gold-pale)/0.4)] bg-black/40 p-6 md:p-8 space-y-6">
            <div className="text-center">
              <Eyebrow>Status</Eyebrow>
              <p className="font-display uppercase text-2xl tracking-tight">
                {status === 'canceled' || cancelAtPeriodEnd ? 'Ending soon' : 'Active'}
              </p>
              <p className="font-mono text-xs text-white/60 mt-2">
                {cancelAtPeriodEnd || status === 'canceled'
                  ? `Gold until ${formatDate(currentPeriodEnd)}`
                  : `Renews ${formatDate(currentPeriodEnd)}`}
              </p>
            </div>

            <div className="flex justify-center">
              <button onClick={openPortal} disabled={portalLoading} className={chip}>
                {portalLoading ? 'Opening' : 'Manage subscription'}
              </button>
            </div>

            <div className="border-t border-white/10 pt-6">
              <Eyebrow>Refer a friend</Eyebrow>
              <p className="text-center font-sans text-sm text-white/70 mb-4 max-w-md mx-auto">
                When they go Gold, you both get £69 credited to your next bill.
              </p>
              {referralCode ? (
                <div className="space-y-3 max-w-sm mx-auto">
                  <button
                    onClick={() => copy(referralCode)}
                    className="w-full border border-white/30 px-4 py-3 font-mono text-sm tracking-[0.3em] hover:bg-white/5"
                  >
                    {referralCode}
                  </button>
                  <button
                    onClick={() => copy(shareUrl)}
                    className="w-full font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 hover:text-white"
                  >
                    Copy share link
                  </button>
                </div>
              ) : (
                <p className="text-center font-mono text-[10px] tracking-[0.4em] uppercase text-white/40">
                  Generating
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="border border-white/15 bg-black/40 p-6 md:p-8 space-y-6">
            <div className="text-center">
              <p className="font-display uppercase text-4xl md:text-5xl tracking-tight leading-none">
                £69
                <span className="font-mono text-xs tracking-[0.3em] text-white/60 ml-2">/ MONTH</span>
              </p>
            </div>

            <ul className="font-sans text-sm md:text-base text-white/85 space-y-2 max-w-md mx-auto">
              <li>· 25% off Thai takeaway, every order.</li>
              <li>· 25% off in-venue. Show your gold card to staff.</li>
              <li>· Cancel any time. Gold lasts to end of paid period.</li>
            </ul>

            <div className="max-w-sm mx-auto">
              <label className="block font-mono text-[10px] tracking-[0.4em] uppercase text-white/60 mb-2 text-center">
                Referral code (optional)
              </label>
              <input
                value={refInput}
                onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                placeholder="BEAR-XXXXXX"
                className="w-full bg-transparent border border-white/30 px-4 py-2 font-mono text-sm tracking-[0.2em] text-center placeholder:text-white/30 focus:outline-none focus:border-white"
              />
            </div>

            <div className="flex justify-center">
              <button onClick={() => setShowCheckout(true)} className={chipGold} style={{ backgroundImage: 'var(--gradient-gold)' }}>
                Go Gold
              </button>
            </div>
          </div>
        )}

        {showCheckout && user && (
          <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
            <div className="min-h-screen flex flex-col">
              <div className="p-4 flex justify-between items-center border-b border-white/10">
                <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/70">Checkout</p>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/70 hover:text-white"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 bg-white">
                <StripeEmbeddedCheckout
                  payload={{
                    kind: 'gold',
                    returnUrl: `${window.location.origin}/den/member/gold?checkout=success`,
                    referralCode: refInput.trim() || null,
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default GoldMembership;
