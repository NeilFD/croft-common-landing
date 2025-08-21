
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LoyaltyBox from './LoyaltyBox';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { toast } from '@/hooks/use-toast';
import { AuthModal } from '@/components/AuthModal';
import CroftLogo from '@/components/CroftLogo';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ensureBiometricUnlockDetailed, createSupabaseSession } from '@/lib/biometricAuth';
import { supabase } from '@/integrations/supabase/client';
interface LoyaltyCardModalProps {
  open: boolean;
  onClose: () => void;
}

const LoyaltyCardModal: React.FC<LoyaltyCardModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [showCard, setShowCard] = useState(false);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [needsEmailLinking, setNeedsEmailLinking] = useState(false);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);
  const prevPunchesRef = useRef(0);

  const {
    loading: loyaltyLoading,
    card,
    entries,
    rewardsDone,
    isRegular,
    isLucky7,
    creatingNext,
    addEntry,
  } = useLoyalty(user);

  const handleUnlock = async () => {
    if (inFlightRef.current) return;
    
    setLoading(true);
    setError(null);
    inFlightRef.current = true;
    
    try {
      console.log('[LoyaltyCardModal] Starting biometric unlock...');
      
      const result = await ensureBiometricUnlockDetailed('Croft Common Member');
      console.log('[LoyaltyCardModal] Biometric result:', result);
      
      if (result.ok && result.session) {
        // We have both successful biometric auth AND a session
        console.log('[LoyaltyCardModal] Got session, setting auth state...');
        
        // Set the session in Supabase
        const { error: sessionError } = await supabase.auth.setSession(result.session);
        if (sessionError) {
          console.error('[LoyaltyCardModal] Session error:', sessionError);
          setError('Failed to establish session');
          return;
        }
        
        console.log('[LoyaltyCardModal] Session set successfully');
        setBioOpen(false);
        setShowCard(true);
        toast({ title: 'Signed in with Face ID', description: 'Your loyalty card is ready.' });
        
      } else if (result.ok && (result.userHandle || result.requiresLinking)) {
        // Biometric success but needs email linking - show email form
        console.log('[LoyaltyCardModal] Biometric success but needs email linking');
        setNeedsEmailLinking(true);
        setUserHandle(result.userHandle || null);
        
      } else if (result.errorCode === 'unsupported') {
        console.log('[LoyaltyCardModal] Biometric unsupported, showing fallback');
        setBioOpen(false);
        setAuthOpen(true);
        
      } else {
        console.error('[LoyaltyCardModal] Biometric failed:', result.error);
        setError(result.error || 'Biometric authentication failed');
      }
      
    } catch (error) {
      console.error('[LoyaltyCardModal] Unexpected error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  const handleEmailLinking = async () => {
    if (!emailInput.trim() || !userHandle) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('[LoyaltyCardModal] Creating session with email linking...');
      
      const sessionResult = await createSupabaseSession(userHandle, emailInput.trim());
      
      if (sessionResult.ok && sessionResult.session) {
        // Set the session in Supabase
        const { error: sessionError } = await supabase.auth.setSession(sessionResult.session);
        if (sessionError) {
          console.error('[LoyaltyCardModal] Session error:', sessionError);
          setError('Failed to establish session');
          return;
        }
        
        console.log('[LoyaltyCardModal] Session set successfully with email linking');
        setNeedsEmailLinking(false);
        setBioOpen(false);
        setShowCard(true);
        toast({ title: 'Signed in with Face ID', description: 'Your loyalty card is ready.' });
        
      } else {
        setError(sessionResult.error || 'Failed to create session');
      }
      
    } catch (error) {
      console.error('[LoyaltyCardModal] Email linking error:', error);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

// Simplified flow: authenticated users see card, unauthenticated see auth choice
useEffect(() => {
  if (!open) {
    setAuthOpen(false);
    setBioOpen(false);
    setShowCard(false);
    setNeedsEmailLinking(false);
    setError(null);
    return;
  }

  if (user) {
    setShowCard(true);
    return;
  }

  // No user: show biometric setup choice
  setBioOpen(true);
  setShowCard(false);
}, [open, user]);

// Detect unlock of the 7th box for regular cards
useEffect(() => {
  if (!user) return; // Only for authenticated users
  const punches = entries.filter((e: any) => e.kind === 'punch').length;
  const rewards = entries.filter((e: any) => e.kind === 'reward').length;
  if (isRegular && punches === 6 && prevPunchesRef.current < 6 && rewards === 0) {
    setUnlocked(true);
    toast({
      title: 'Lucky Number 7 is on us',
      description: 'Your free coffee is unlocked. Upload the receipt in box 7.',
    });
  }
  prevPunchesRef.current = punches;
}, [user, entries, isRegular]);

  // Hide unlock banner when closed or reward uploaded
  useEffect(() => {
    if (!open || rewardsDone > 0) {
      setUnlocked(false);
    }
  }, [open, rewardsDone]);

// Fetch total completed cards for prominence (only when signed in)
useEffect(() => {
  const fetchCompleted = async () => {
    if (!user || !open) {
      setCompletedCount(null);
      return;
    }
    const { supabase } = await import('@/integrations/supabase/client');
    const { count, error } = await supabase
      .from('loyalty_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_complete', true);
    if (error) {
      console.warn('Count completed cards error:', error);
      setCompletedCount(null);
      return;
    }
    setCompletedCount(count ?? 0);
  };
  fetchCompleted();
}, [open, user, card?.id, creatingNext]);

// Celebrate when transitioning into Lucky 7² card
const [luckyCelebrate, setLuckyCelebrate] = useState(false);
const prevIsLucky7Ref = useRef(false);
useEffect(() => {
  if (!user) return; // Only for authenticated users
  if (open && isLucky7 && !prevIsLucky7Ref.current) {
    setLuckyCelebrate(true);
    const t = setTimeout(() => setLuckyCelebrate(false), 5000);
    return () => clearTimeout(t);
  }
  prevIsLucky7Ref.current = !!isLucky7;
}, [open, user, isLucky7]);

const filledMap = useMemo(() => {
  if (!user) return {}; // No entries for unauthenticated users
  const map: Record<number, { kind: 'punch' | 'reward'; url?: string }> = {};
  entries.forEach((e: any) => {
    map[e.index] = { kind: e.kind, url: e.signedUrl };
  });
  return map;
}, [user, entries]);

const handleSelect = (index: number) => async (file: File) => {
  if (!user) {
    setAuthOpen(true);
    return;
  }

  // Determine kind based on card type and index
  let kind: 'punch' | 'reward' = 'punch';
  if (isLucky7) {
    kind = 'reward';
  } else if (isRegular) {
    kind = index === 7 ? 'reward' : 'punch';
  }

  await addEntry(index, kind, file);
};

const subtitle = useMemo(() => {
  if (!user || !card) return '';
  const punches = entries.filter((e: any) => e.kind === 'punch').length;
  const rewards = entries.filter((e: any) => e.kind === 'reward').length;
  if (isRegular) return `Punches ${punches}/6 · Reward ${Math.min(rewards,1)}/1`;
  if (isLucky7) return `Free coffees ${rewards}/7`;
  return '';
}, [user, card, entries, isRegular, isLucky7]);

const title = (user && isLucky7) ? 'Lucky Number 7²' : 'Croft Common Coffee';

  // When dialog closes, reset any auth modal
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAuthOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open && showCard} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="font-brutalist tracking-wider flex items-center gap-2">
              <CroftLogo size="sm" />
              <span>{title}</span>
              {user && isLucky7 && (
                <Badge className="ml-2 border border-accent/30 bg-accent/10 text-accent">7×7</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {user && <span className="text-foreground/70">{user.email}</span>}
              {card && (
                <div className="mt-2 text-sm sm:text-base text-foreground font-medium">{subtitle}</div>
              )}
              {completedCount !== null && (
                <div className="mt-2">
                  <Badge variant="secondary">Completed cards: {completedCount}</Badge>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          {unlocked && (
            <Alert className="mt-3">
              <AlertTitle>Lucky Number 7 is on us</AlertTitle>
              <AlertDescription>Free coffee unlocked — upload your receipt in box 7.</AlertDescription>
            </Alert>
          )}
          {luckyCelebrate && isLucky7 && (
            <Alert className="mt-3 border-accent bg-accent/10">
              <AlertTitle>Lucky Number 7² is here</AlertTitle>
              <AlertDescription>Seven free coffees — snap each one to claim. Let’s go!</AlertDescription>
            </Alert>
          )}
          {!user && (
            <div className="mb-4">
              <Button onClick={() => setAuthOpen(true)}>Sign in to start</Button>
            </div>
          )}

{user && isRegular ? (
            <div className="flex flex-row gap-3 sm:gap-4">
<div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
  {Array.from({ length: 6 }, (_, i) => i + 1).map((idx) => {
    const filled = !!filledMap[idx];
    const img = filledMap[idx]?.url;

    const disabled = loyaltyLoading || creatingNext || (!user);

    return (
      <LoyaltyBox
        key={idx}
        index={idx}
        filled={filled}
        disabled={disabled}
        imageUrl={img}
        onSelectFile={handleSelect(idx)}
      />
    );
  })}
</div>
              <div className="block w-px bg-foreground/60 self-stretch shrink-0" aria-hidden />
              <div className="w-24 sm:w-28 flex flex-col items-center justify-center">
                {(() => {
                  const idx = 7;
                  const filled = !!filledMap[idx];
                  const img = filledMap[idx]?.url;

const disabledRegular = user && isRegular ? (idx === 7 ? (Object.keys(filledMap).filter(k=>filledMap[Number(k)]?.kind==='punch').length < 6) : false) : false;
const disabled = loyaltyLoading || creatingNext || (!user) || disabledRegular;

return (
  <div className="flex flex-col items-center gap-1">
    <LoyaltyBox
      key={idx}
      index={idx}
      filled={filled}
      disabled={disabled}
      imageUrl={img}
      borderless={!filled && !img}
      onSelectFile={handleSelect(idx)}
    />
    <div className="text-center text-xs text-foreground/70">Free coffee</div>
  </div>
);
                })()}
              </div>
            </div>
          ) : (
<div className="rounded-xl border-2 border-border bg-background p-4">
  <div className="flex flex-row gap-3 sm:gap-4">
    <div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
      {Array.from({ length: 6 }, (_, i) => i + 1).map((idx) => {
        const filled = !!filledMap[idx];
        const img = filledMap[idx]?.url;

        const disabled = loyaltyLoading || creatingNext || (!user);

        return (
          <LoyaltyBox
            key={idx}
            index={idx}
            filled={filled}
            disabled={disabled}
            imageUrl={img}
            onSelectFile={handleSelect(idx)}
          />
        );
      })}
    </div>
    <div className="block w-px bg-foreground/60 self-stretch shrink-0" aria-hidden />
    <div className="w-28 sm:w-32 flex flex-col items-center justify-center">
      {(() => {
        const idx = 7;
        const filled = !!filledMap[idx];
        const img = filledMap[idx]?.url;

        const disabled = loyaltyLoading || creatingNext || (!user);

        return (
          <div className="flex flex-col items-center gap-1">
            <LoyaltyBox
              key={idx}
              index={idx}
              filled={filled}
              disabled={disabled}
              imageUrl={img}
              borderless={!filled && !img}
              onSelectFile={handleSelect(idx)}
              
            />
            <div className="text-center text-xs text-foreground/70">Lucky Number 7 is on us</div>
          </div>
        );
      })()}
    </div>
  </div>
</div>
          )}

          {creatingNext && (
            <div className="text-sm text-foreground/70 mt-3">Creating your next card…</div>
          )}

          <div className="mt-4 text-xs text-foreground/60">
            {isLucky7 ? (
              <>
                • This Lucky Number 7² card gives you seven free coffees. • Snap each free coffee to claim. • Images are saved to your account.
              </>
            ) : (
              <>
                • Boxes 1–6: snap your coffee recipe. • Box 7: upload receipt for your free coffee. • Images are stored securely to your account.
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

<Dialog open={open && (bioOpen || needsEmailLinking)} onOpenChange={() => {
        setBioOpen(false);
        setNeedsEmailLinking(false);
        onClose();
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="font-brutalist tracking-wider flex items-center gap-2">
              <CroftLogo size="sm" />
              <span>Croft Common</span>
            </DialogTitle>
            <DialogDescription>
              {needsEmailLinking 
                ? "Almost done! Link your email to complete setup."
                : "Sign in faster with Face ID or device biometrics for instant access to secret perks."
              }
            </DialogDescription>
          </DialogHeader>
          
          {needsEmailLinking ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleEmailLinking}
                  disabled={loading || !emailInput.trim()}
                  className="flex-1"
                >
                  {loading ? 'Linking...' : 'Complete Setup'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBioOpen(false);
                    setAuthOpen(true);
                  }}
                  disabled={loading}
                >
                  Use Email Instead
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <Alert className="border-destructive/50 text-destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleUnlock}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Setting up...' : 'Set up Face ID'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setBioOpen(false);
                    setAuthOpen(true);
                  }}
                  disabled={loading}
                >
                  Use Email Instead
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

<AuthModal
  isOpen={authOpen}
  onClose={() => setAuthOpen(false)}
  onSuccess={() => {
    setAuthOpen(false);
    setShowCard(true);
    toast({ title: 'Signed in', description: 'Your loyalty card is ready.' });
  }}
  requireAllowedDomain={false}
  title="Sign in to start your loyalty card"
  description="Enter your email and we'll send you a magic link to save your punches."
  redirectUrl={`${window.location.origin}/`}
  toastTitle="Magic link sent!"
  toastDescription="Check your email and click the magic link to access your loyalty card."
  emailSentInstructions="Click the magic link to access your loyalty card and start saving punches."
/>
    </>
  );
};

export default LoyaltyCardModal;
