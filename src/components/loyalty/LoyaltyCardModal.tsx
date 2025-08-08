
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
interface LoyaltyCardModalProps {
  open: boolean;
  onClose: () => void;
}

const LoyaltyCardModal: React.FC<LoyaltyCardModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const prevPunchesRef = useRef(0);

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

  // Detect unlock of the 7th box for regular cards
  useEffect(() => {
    if (isRegular && punchesDone === 6 && prevPunchesRef.current < 6 && rewardsDone === 0) {
      setUnlocked(true);
      toast({
        title: 'Lucky Number 7 is on us',
        description: 'Your free coffee is unlocked. Upload the receipt in box 7.',
      });
    }
    prevPunchesRef.current = punchesDone;
  }, [isRegular, punchesDone, rewardsDone]);

  // Hide unlock banner when closed or reward uploaded
  useEffect(() => {
    if (!open || rewardsDone > 0) {
      setUnlocked(false);
    }
  }, [open, rewardsDone]);

  // Fetch total completed cards for prominence
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
  }, [open, user, card?.id, creatingNext, rewardsDone]);

  // Celebrate when transitioning into Lucky 7² card
  const [luckyCelebrate, setLuckyCelebrate] = useState(false);
  const prevIsLucky7Ref = useRef(false);
  useEffect(() => {
    if (open && isLucky7 && !prevIsLucky7Ref.current) {
      setLuckyCelebrate(true);
      const t = setTimeout(() => setLuckyCelebrate(false), 5000);
      return () => clearTimeout(t);
    }
    prevIsLucky7Ref.current = isLucky7;
  }, [open, isLucky7]);

  const filledMap = useMemo(() => {
    const map: Record<number, { kind: 'punch' | 'reward'; url?: string }> = {};
    entries.forEach((e) => {
      map[e.index] = { kind: e.kind, url: e.signedUrl };
    });
    return map;
  }, [entries]);

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
    if (!card) return '';
    if (isRegular) return `Punches ${punchesDone}/6 · Reward ${Math.min(rewardsDone,1)}/1`;
    if (isLucky7) return `Free coffees ${rewardsDone}/7`;
    return '';
  }, [card, isRegular, isLucky7, punchesDone, rewardsDone]);

  const title = isLucky7 ? 'Lucky Number 7²' : 'Croft Common Coffee';

  // When dialog closes, reset any auth modal
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setAuthOpen(false);
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="font-brutalist tracking-wider flex items-center gap-2">
              <CroftLogo size="sm" />
              <span>{title}</span>
              {isLucky7 && (
                <Badge className="ml-2 border border-accent/30 bg-accent/10 text-accent">7×7</Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              {user ? (
                <span className="text-foreground/70">{user.email}</span>
              ) : (
                <span className="text-foreground/70">Sign in to save your punches</span>
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

          {isRegular ? (
            <div className="flex flex-row gap-4">
              <div className="grid grid-cols-3 gap-3 flex-1">
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
              <div className="block w-px bg-foreground/60 self-stretch" aria-hidden />
              <div className="w-28 flex flex-col items-center justify-center">
                {(() => {
                  const idx = 7;
                  const filled = !!filledMap[idx];
                  const img = filledMap[idx]?.url;

                  const disabledRegular = isRegular ? (idx === 7 ? punchesDone < 6 : false) : false;
                  const disabled = loading || creatingNext || (!user) || disabledRegular;

                  return (
                    <div className="flex flex-col items-center gap-1">
                      <LoyaltyBox
                        key={idx}
                        index={idx}
                        filled={filled}
                        disabled={disabled}
                        imageUrl={img}
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
              <div className="flex flex-row gap-4">
                <div className="grid grid-cols-3 gap-3 flex-1">
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
                <div className="block w-px bg-foreground/60 self-stretch" aria-hidden />
                <div className="w-28 flex flex-col items-center justify-center">
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
                          onSelectFile={handleSelect(idx)}
                          variant="lucky"
                        />
                        <div className="text-center text-xs text-foreground/70">Coffee 7</div>
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

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
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
