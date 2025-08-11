
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LoyaltyBox from './LoyaltyBox';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { toast } from '@/hooks/use-toast';
import { AuthModal } from '@/components/AuthModal';
import CroftLogo from '@/components/CroftLogo';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import BiometricUnlockModal from '@/components/BiometricUnlockModal';
import { isBioRecentlyOk, markBioSuccess } from '@/hooks/useRecentBiometric';
import { getStoredUserHandle } from '@/lib/biometricAuth';
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
  const prevPunchesRef = useRef(0);
  const [readOnly, setReadOnly] = useState(false);
  const [publicCard, setPublicCard] = useState<any | null>(null);
  const [publicEntries, setPublicEntries] = useState<any[]>([]);

  const {
    loading,
    card,
    entries,
    punchesDone,
    rewardsDone,
    isRegular,
    isLucky7,
    creatingNext,
    addEntry,
  } = useLoyalty(user);

// Gate modal behind auth on open, but allow read-only via passkey-linked membership
useEffect(() => {
  let active = true;
  const run = async () => {
    if (!open) {
      setAuthOpen(false);
      setBioOpen(false);
      setShowCard(false);
      setReadOnly(false);
      setPublicCard(null);
      setPublicEntries([]);
      return;
    }

    if (user) {
      setShowCard(true);
      setReadOnly(false);
      return;
    }

    // No user: try silent passkey-linked check to show read-only card
    const handle = getStoredUserHandle();
    if (!handle) {
      setBioOpen(true);
      setShowCard(false);
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('loyalty-get-active-card', { body: { userHandle: handle } });
      if (!active) return;
      if (error) throw error;
      const res: any = data;
      if (res?.linked && res?.userHasAccount && res?.hasCard) {
        setPublicCard(res.card);
        setPublicEntries(res.entries || []);
        setReadOnly(true);
        setShowCard(true);
        setBioOpen(false);
        setAuthOpen(false);
        toast({ title: 'Access granted via passkey', description: 'Viewing your loyalty card. Sign in to save punches.' });
      } else {
        // Not linked or no card — fall back to current flow
        setBioOpen(true);
        setShowCard(false);
      }
    } catch (e) {
      console.warn('loyalty-get-active-card failed', e);
      setBioOpen(true);
      setShowCard(false);
    }
  };
  run();
  return () => { active = false; };
}, [open, user]);

// Detect unlock of the 7th box for regular cards
useEffect(() => {
  const entriesForCalc = user ? entries : publicEntries;
  const punches = entriesForCalc.filter((e: any) => e.kind === 'punch').length;
  const rewards = entriesForCalc.filter((e: any) => e.kind === 'reward').length;
  const isReg = (user ? isRegular : (publicCard?.card_type === 'regular'));
  if (isReg && punches === 6 && prevPunchesRef.current < 6 && rewards === 0) {
    setUnlocked(true);
    toast({
      title: 'Lucky Number 7 is on us',
      description: 'Your free coffee is unlocked. Upload the receipt in box 7.',
    });
  }
  prevPunchesRef.current = punches;
}, [user, publicEntries, entries, isRegular, publicCard]);

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
  const isLucky = user ? isLucky7 : (publicCard?.card_type === 'lucky7');
  if (open && isLucky && !prevIsLucky7Ref.current) {
    setLuckyCelebrate(true);
    const t = setTimeout(() => setLuckyCelebrate(false), 5000);
    return () => clearTimeout(t);
  }
  prevIsLucky7Ref.current = !!isLucky;
}, [open, user, isLucky7, publicCard]);

const filledMap = useMemo(() => {
  const list = user ? entries : publicEntries;
  const map: Record<number, { kind: 'punch' | 'reward'; url?: string }> = {};
  list.forEach((e: any) => {
    map[e.index] = { kind: e.kind, url: e.signedUrl };
  });
  return map;
}, [user, entries, publicEntries]);

const handleSelect = (index: number) => async (file: File) => {
  if (!user) {
    setAuthOpen(true);
    return;
  }

  // Determine kind based on card type and index
  let kind: 'punch' | 'reward' = 'punch';
  const isLuckyCard = user ? isLucky7 : (publicCard?.card_type === 'lucky7');
  const isRegularCard = user ? isRegular : (publicCard?.card_type === 'regular');
  if (isLuckyCard) {
    kind = 'reward';
  } else if (isRegularCard) {
    kind = index === 7 ? 'reward' : 'punch';
  }

  await addEntry(index, kind, file);
};

const subtitle = useMemo(() => {
  const c = user ? card : publicCard;
  if (!c) return '';
  const list = user ? entries : publicEntries;
  const punches = list.filter((e: any) => e.kind === 'punch').length;
  const rewards = list.filter((e: any) => e.kind === 'reward').length;
  const isReg = user ? isRegular : (publicCard?.card_type === 'regular');
  const isL7 = user ? isLucky7 : (publicCard?.card_type === 'lucky7');
  if (isReg) return `Punches ${punches}/6 · Reward ${Math.min(rewards,1)}/1`;
  if (isL7) return `Free coffees ${rewards}/7`;
  return '';
}, [user, card, publicCard, entries, publicEntries, isRegular, isLucky7]);

const title = (user ? isLucky7 : (publicCard?.card_type === 'lucky7')) ? 'Lucky Number 7²' : 'Croft Common Coffee';

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
{(user ? isLucky7 : (publicCard?.card_type === 'lucky7')) && (
  <Badge className="ml-2 border border-accent/30 bg-accent/10 text-accent">7×7</Badge>
)}
            </DialogTitle>
            <DialogDescription>
{user ? (
  <span className="text-foreground/70">{user.email}</span>
) : (
  <span className="text-foreground/70">Access granted via passkey — sign in to save punches</span>
)}
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

{(user ? ( ( (user && isRegular) || (!user && publicCard?.card_type === 'regular') ) ) : (publicCard?.card_type === 'regular')) ? (
            <div className="flex flex-row gap-3 sm:gap-4">
<div className="grid grid-cols-3 gap-2 sm:gap-3 flex-1">
  {Array.from({ length: 6 }, (_, i) => i + 1).map((idx) => {
    const filled = !!filledMap[idx];
    const img = filledMap[idx]?.url;

    const disabled = loading || creatingNext || (!user);

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

const disabledRegular = ((user ? (publicCard?.card_type === undefined && isRegular) : (publicCard?.card_type === 'regular'))) ? (idx === 7 ? (Object.keys(filledMap).filter(k=>filledMap[Number(k)]?.kind==='punch').length < 6) : false) : false;
const disabled = loading || creatingNext || (!user) || disabledRegular;

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

        const disabled = loading || creatingNext || (!user);

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

        const disabled = loading || creatingNext || (!user);

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

<BiometricUnlockModal
  isOpen={bioOpen}
  onClose={() => setBioOpen(false)}
  onSuccess={() => { setBioOpen(false); setAuthOpen(true); }}
  onFallback={() => { setBioOpen(false); setAuthOpen(true); }}
  title="Sign in faster next time"
  description="Save a passkey (Face ID / device biometrics) for quick unlock of secret perks."
/>

<AuthModal
  isOpen={authOpen}
  onClose={() => setAuthOpen(false)}
  onSuccess={() => {
    setAuthOpen(false);
    setShowCard(true);
    setReadOnly(false);
    setPublicCard(null);
    setPublicEntries([]);
    toast({ title: 'Signed in', description: 'Your loyalty card is ready.' });
  }}
  requireAllowedDomain={false}
  title="Sign in to start your loyalty card"
  description="Enter your email and we'll send you a magic link to save your punches."
/>
    </>
  );
};

export default LoyaltyCardModal;
