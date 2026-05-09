import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGoldStatus } from '@/hooks/useGoldStatus';
import { useReferralCode } from '@/hooks/useReferralCode';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { StripeEmbeddedCheckout } from '@/components/payments/StripeEmbeddedCheckout';
import { useToast } from '@/hooks/use-toast';

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const btnGold =
  'inline-flex items-center justify-center border-2 bg-white text-black hover:bg-black hover:text-white px-3 py-2 font-mono uppercase tracking-[0.25em] text-[10px] transition-colors disabled:opacity-50';
const btnGoldStyle = { borderColor: 'hsl(var(--gold-base))' } as React.CSSProperties;
const btnFull =
  'w-full inline-flex items-center justify-center border-2 border-black bg-black text-white hover:bg-white hover:text-black px-4 py-3 font-mono uppercase tracking-[0.3em] text-xs transition-colors disabled:opacity-50';

export const GoldSection: React.FC = () => {
  const { user } = useAuth();
  const { isGold, status, currentPeriodEnd, cancelAtPeriodEnd, loading } = useGoldStatus();
  const { code: referralCode } = useReferralCode();
  const [params] = useSearchParams();
  const incomingRef = params.get('ref') || '';
  const [refInput, setRefInput] = useState(incomingRef);
  const [showInfo, setShowInfo] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (incomingRef) setRefInput((v) => v || incomingRef);
  }, [incomingRef]);

  // Lock body scroll when modal open
  useEffect(() => {
    const open = showInfo || showCheckout;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showInfo, showCheckout]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          environment: getStripeEnvironment(),
          returnUrl: window.location.origin + '/den/member/profile',
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
    ? `${window.location.origin}/den/member/profile?ref=${referralCode}`
    : '';

  if (loading) return null;

  return (
    <>
      <div>
        <button onClick={() => setShowInfo(true)} className={btnSmall}>
          {isGold ? 'Manage Gold' : 'Gold Member'}
        </button>
      </div>

      {showInfo && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-white text-black border-2 border-black w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b-2 border-black">
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase">
                Bear's Den · Gold
              </p>
              <button
                onClick={() => setShowInfo(false)}
                className="font-mono text-[10px] tracking-[0.3em] uppercase hover:underline"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-5">
              {isGold ? (
                <>
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-black/60 mb-1">
                      {cancelAtPeriodEnd || status === 'canceled' ? 'Gold until' : 'Renews'}
                    </p>
                    <p className="font-display text-xl tracking-tight">
                      {formatDate(currentPeriodEnd)}
                    </p>
                    <p className="font-sans text-xs text-black/70 mt-2">
                      25% off everywhere. In-app and in-venue. Show your gold card to staff.
                    </p>
                  </div>

                  <button
                    onClick={openPortal}
                    disabled={portalLoading}
                    className={btnSmallDark}
                  >
                    {portalLoading ? 'Opening' : 'Manage subscription'}
                  </button>

                  <div className="border-t-2 border-black pt-5">
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/60 mb-2">
                      Refer a friend
                    </p>
                    <p className="font-sans text-sm text-black/80 mb-3">
                      When they go Gold, you both get £69 credited to your next bill.
                    </p>
                    {referralCode ? (
                      <div className="space-y-2">
                        <button
                          onClick={() => copy(referralCode)}
                          className="w-full border-2 border-black px-4 py-3 font-mono text-sm tracking-[0.3em] hover:bg-black hover:text-white transition-colors"
                        >
                          {referralCode}
                        </button>
                        <button
                          onClick={() => copy(shareUrl)}
                          className="w-full font-mono text-[10px] tracking-[0.3em] uppercase text-black/60 hover:text-black"
                        >
                          Copy share link
                        </button>
                      </div>
                    ) : (
                      <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-black/40">
                        Generating
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="font-display text-3xl tracking-tight">
                      £69
                      <span className="font-mono text-[10px] tracking-[0.3em] text-black/60 ml-2">
                        / MONTH
                      </span>
                    </p>
                    <ul className="font-sans text-sm text-black/85 space-y-1 mt-3">
                      <li>· 25% off Thai takeaway, every order.</li>
                      <li>· 25% off in-venue. Staff honour your gold card.</li>
                      <li>· Cancel any time. Gold lasts to end of paid period.</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] tracking-[0.3em] uppercase text-black/60 mb-2">
                      Referral code (optional)
                    </label>
                    <input
                      value={refInput}
                      onChange={(e) => setRefInput(e.target.value.toUpperCase())}
                      placeholder="BEAR-XXXXXX"
                      className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-sm tracking-[0.2em] placeholder:text-black/30 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setShowInfo(false);
                      setShowCheckout(true);
                    }}
                    className={btnSmallDark}
                  >
                    Go Gold
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showCheckout && user && (
        <div className="fixed inset-0 z-50 bg-black/90 overflow-y-auto">
          <div className="min-h-screen flex flex-col">
            <div className="p-4 flex justify-between items-center border-b border-white/10">
              <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/70">
                Checkout
              </p>
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
                  returnUrl: `${window.location.origin}/den/member/profile?checkout=success`,
                  referralCode: refInput.trim() || null,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
