import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGoldStatus } from '@/hooks/useGoldStatus';
import { useReferralCode } from '@/hooks/useReferralCode';
import { supabase } from '@/integrations/supabase/client';
import { getStripeEnvironment } from '@/lib/stripe';
import { StripeEmbeddedCheckout } from '@/components/payments/StripeEmbeddedCheckout';
import { useToast } from '@/hooks/use-toast';

const ACCESS_KEY = 'gold_access_unlocked';

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

interface GoldSectionProps {
  /** Whether the member has a verified profile photo. Gates Go Gold. */
  avatarReady?: boolean;
}

export const GoldSection: React.FC<GoldSectionProps> = ({ avatarReady = true }) => {
  const { user } = useAuth();
  const { isGold, status, currentPeriodEnd, cancelAtPeriodEnd, loading } = useGoldStatus();
  const { code: referralCode } = useReferralCode();
  const [params] = useSearchParams();
  const incomingRef = params.get('ref') || '';
  const [refInput, setRefInput] = useState(incomingRef);
  const [showInfo, setShowInfo] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [accessUnlocked, setAccessUnlocked] = useState(
    () => typeof window !== 'undefined' && window.sessionStorage?.getItem(ACCESS_KEY) === '1',
  );
  const [accessInput, setAccessInput] = useState('');
  const [accessError, setAccessError] = useState<string | null>(null);
  const [accessChecking, setAccessChecking] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (incomingRef) setRefInput((v) => v || incomingRef);
  }, [incomingRef]);

  useEffect(() => {
    const open = showInfo || showCheckout;
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showInfo, showCheckout]);

  const submitAccessCode = async () => {
    const code = accessInput.trim().toUpperCase();
    if (!code) return;
    setAccessChecking(true);
    setAccessError(null);
    try {
      const { data, error } = await supabase.functions.invoke('validate-gold-access-code', {
        body: { code },
      });
      if (error) throw new Error(error.message || 'Could not check code');
      if (data?.ok) {
        window.sessionStorage?.setItem(ACCESS_KEY, '1');
        setAccessUnlocked(true);
        setAccessInput('');
      } else {
        setAccessError('Code not recognised.');
      }
    } catch (e) {
      setAccessError(e instanceof Error ? e.message : 'Could not check code');
    } finally {
      setAccessChecking(false);
    }
  };

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
        <button onClick={() => setShowInfo(true)} className={btnGold} style={btnGoldStyle}>
          {isGold ? 'Manage Gold' : 'Gold Member'}
        </button>
      </div>

      {showInfo && createPortal(
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
          style={{ zIndex: 2147483600 }}
          onClick={() => setShowInfo(false)}
        >
          <div
            className="bg-white text-black border-2 border-black w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black">
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

            <div className="p-6 space-y-6">
              {isGold ? (
                <>
                  <div>
                    <p className="font-mono text-[10px] tracking-[0.3em] uppercase text-black/60 mb-1">
                      {cancelAtPeriodEnd || status === 'canceled' ? 'Gold until' : 'Renews'}
                    </p>
                    <p className="font-display text-xl tracking-tight">
                      {formatDate(currentPeriodEnd)}
                    </p>
                    <p className="font-sans text-sm text-black/70 mt-2">
                      25% off everywhere. In-app and in-venue. Show your gold card to staff.
                    </p>
                  </div>

                  <button
                    onClick={openPortal}
                    disabled={portalLoading}
                    className={btnFull}
                  >
                    {portalLoading ? 'Opening' : 'Manage subscription'}
                  </button>

                  <div className="border-t-2 border-black pt-6">
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
                    <p className="font-display text-4xl tracking-tight">
                      £69
                      <span className="font-mono text-[10px] tracking-[0.3em] text-black/60 ml-2">
                        / MONTH
                      </span>
                    </p>
                    <ul className="font-sans text-sm text-black/85 space-y-1.5 mt-4">
                      <li>· 25% off Thai takeaway, every order.</li>
                      <li>· 25% off in-venue. Staff honour your gold card.</li>
                      <li>· Cancel any time. Gold lasts to end of paid period.</li>
                    </ul>
                  </div>

                  <div className="border-2 border-black bg-black text-white p-4 space-y-2">
                    <p className="font-mono text-[10px] tracking-[0.4em] uppercase">
                      Internal test
                    </p>
                    <ul className="font-mono text-[11px] tracking-[0.15em] uppercase space-y-1 text-white/85">
                      <li>· Access code: BEARTEST</li>
                      <li>· Card: 4242 4242 4242 4242</li>
                      <li>· Any future date · Any CVC</li>
                      <li>· Card flips to Gold automatically</li>
                    </ul>
                  </div>

                  {accessUnlocked ? (
                    <>
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
                        disabled={!avatarReady}
                        className={btnFull}
                      >
                        {avatarReady ? 'Go Gold' : 'Add a verified profile photo first'}
                      </button>
                    </>
                  ) : (
                    <div className="border-t-2 border-black pt-6 space-y-3">
                      <label className="block font-mono text-[10px] tracking-[0.3em] uppercase text-black/60">
                        Access code
                      </label>
                      <input
                        value={accessInput}
                        onChange={(e) => {
                          setAccessInput(e.target.value.toUpperCase());
                          setAccessError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitAccessCode();
                        }}
                        placeholder="ENTER CODE"
                        className="w-full border-2 border-black bg-white px-3 py-2 font-mono text-sm tracking-[0.2em] placeholder:text-black/30 focus:outline-none"
                      />
                      {accessError && (
                        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-red-700">
                          {accessError}
                        </p>
                      )}
                      <button
                        onClick={submitAccessCode}
                        disabled={accessChecking || !accessInput.trim()}
                        className={btnFull}
                      >
                        {accessChecking ? 'Checking' : 'Unlock'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}

      {showCheckout && user && createPortal(
        <div
          className="fixed inset-0 bg-black/95 overflow-y-auto"
          style={{ zIndex: 2147483600 }}
        >
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
        </div>,
        document.body,
      )}
    </>
  );
};
