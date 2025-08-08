
import React, { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import LoyaltyBox from './LoyaltyBox';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { toast } from '@/hooks/use-toast';
import { AuthModal } from '@/components/AuthModal';

interface LoyaltyCardModalProps {
  open: boolean;
  onClose: () => void;
}

const LoyaltyCardModal: React.FC<LoyaltyCardModalProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);

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

  const title = isLucky7 ? 'Lucky Number 7' : 'Croft Common Loyalty';

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
            <DialogTitle className="font-brutalist tracking-wider">{title}</DialogTitle>
            <DialogDescription>
              {user ? (
                <span className="text-foreground/70">{user.email}</span>
              ) : (
                <span className="text-foreground/70">Sign in to save your punches</span>
              )}
              {card && <div className="mt-2 text-sm text-foreground">{subtitle}</div>}
            </DialogDescription>
          </DialogHeader>

          {!user && (
            <div className="mb-4">
              <Button onClick={() => setAuthOpen(true)}>Sign in to start</Button>
            </div>
          )}

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {/* Boxes 1..7 */}
            {Array.from({ length: 7 }, (_, i) => i + 1).map((idx) => {
              const filled = !!filledMap[idx];
              const img = filledMap[idx]?.url;

              // Regular: 1..6 are punches, 7 is reward (locked until 6 punches)
              const disabledRegular =
                isRegular
                  ? (idx === 7 ? punchesDone < 6 : false)
                  : false;

              // Lucky7: all are rewards, never disabled
              const disabled = loading || creatingNext || (!user) || disabledRegular;

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

          {creatingNext && (
            <div className="text-sm text-foreground/70 mt-3">Creating your next card…</div>
          )}

          <div className="mt-4 text-xs text-foreground/60">
            • Boxes 1–6: snap your coffee recipe. • Box 7: upload receipt for your free coffee. • Images are stored securely to your account.
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
