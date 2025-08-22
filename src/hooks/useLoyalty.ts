
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

export type LoyaltyCardType = 'regular' | 'lucky7';

export interface LoyaltyCard {
  id: string;
  user_id: string;
  card_type: LoyaltyCardType;
  punches_required: number;
  rewards_required: number;
  punches_count: number;
  rewards_count: number;
  is_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyEntry {
  id: string;
  card_id: string;
  index: number; // 1..7
  kind: 'punch' | 'reward';
  image_url: string; // storage path
  created_at: string;
}

type SignedEntry = LoyaltyEntry & { signedUrl?: string };

const BUCKET = 'loyalty';

async function getSignedUrl(path: string): Promise<string | undefined> {
  if (!path) return undefined;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
  if (error) {
    console.error('Signed URL error:', error);
    return undefined;
  }
  return data?.signedUrl;
}

export function useLoyalty(user: User | null) {
  const [loading, setLoading] = useState(false);
  const [card, setCard] = useState<LoyaltyCard | null>(null);
  const [entries, setEntries] = useState<SignedEntry[]>([]);
  const [creatingNext, setCreatingNext] = useState(false);

  const punchesDone = useMemo(
    () => entries.filter((e) => e.kind === 'punch').length,
    [entries]
  );
  const rewardsDone = useMemo(
    () => entries.filter((e) => e.kind === 'reward').length,
    [entries]
  );

  const isRegular = card?.card_type === 'regular';
  const isLucky7 = card?.card_type === 'lucky7';

  const refreshEntries = useCallback(async (cardId: string) => {
    const { data, error } = await supabase
      .from('loyalty_entries')
      .select('*')
      .eq('card_id', cardId)
      .order('index', { ascending: true });

    if (error) {
      console.error('Failed to fetch entries:', error);
      toast({ title: 'Error', description: 'Failed to load loyalty entries', variant: 'destructive' });
      return;
    }

    const withUrls: SignedEntry[] = await Promise.all(
      (data ?? []).map(async (e: any) => {
        const signedUrl = await getSignedUrl(e.image_url as string);
        const kind = (e.kind as 'punch' | 'reward');
        return {
          id: e.id as string,
          card_id: e.card_id as string,
          index: e.index as number,
          kind,
          image_url: e.image_url as string,
          created_at: e.created_at as string,
          signedUrl,
        } as SignedEntry;
      })
    );
    setEntries(withUrls);
  }, []);

  const fetchOrCreateActiveCard = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // 1) Try to fetch an incomplete card
      const { data: existing, error: fetchErr } = await supabase
        .from('loyalty_cards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_complete', false)
        .order('created_at', { ascending: true })
        .limit(1);

      if (fetchErr) {
        console.error('Fetch card error:', fetchErr);
      }

      let active = existing?.[0] as LoyaltyCard | undefined;

      // 2) If none, try to create a regular card (policy requires active subscriber)
      if (!active) {
        const { data: created, error: insertErr } = await supabase
          .from('loyalty_cards')
          .insert({
            user_id: user.id,
            card_type: 'regular',
            punches_required: 6,
            rewards_required: 1,
          })
          .select('*')
          .single();

        if (insertErr) {
          console.warn('Unable to create new loyalty card (likely not subscribed):', insertErr);
          toast({
            title: 'Loyalty not available',
            description: 'You must be an active newsletter subscriber to start a loyalty card.',
            variant: 'destructive',
          });
          setCard(null);
          setEntries([]);
          setLoading(false);
          return;
        }
        active = created as LoyaltyCard;
      }

      setCard(active);
      await refreshEntries(active.id);
    } finally {
      setLoading(false);
    }
  }, [user, refreshEntries]);

  const finalizeAndCreateNextIfNeeded = useCallback(async (current: LoyaltyCard) => {
    if (!user) return;

    // Recompute completion conditions from entries to be safe
    const { data: allEntries, error: entriesErr } = await supabase
      .from('loyalty_entries')
      .select('id, kind')
      .eq('card_id', current.id);

    if (entriesErr) {
      console.error('Entries audit error:', entriesErr);
      return;
    }

    const p = (allEntries ?? []).filter((e) => e.kind === 'punch').length;
    const r = (allEntries ?? []).filter((e) => e.kind === 'reward').length;

    let complete = false;
    if (current.card_type === 'regular') {
      complete = p >= (current.punches_required || 6) && r >= 1;
    } else if (current.card_type === 'lucky7') {
      complete = r >= 7;
    }

    if (!complete) {
      return;
    }

    // Mark current card complete and update counters
    const { error: updateErr } = await supabase
      .from('loyalty_cards')
      .update({
        is_complete: true,
        punches_count: p,
        rewards_count: r,
      })
      .eq('id', current.id);

    if (updateErr) {
      console.error('Failed to mark card complete:', updateErr);
      return;
    }

    // Decide next card type
    setCreatingNext(true);
    try {
      let nextType: LoyaltyCardType = 'regular';

      if (current.card_type === 'regular') {
        // Count completed regular cards for this user
        const { count: regCompletedCount, error: countErr } = await supabase
          .from('loyalty_cards')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('card_type', 'regular')
          .eq('is_complete', true);

        // If just finished the 6th regular, next is Lucky #7
        if (((regCompletedCount ?? 0) % 6) === 0) {
          nextType = 'lucky7';
        }
      } else if (current.card_type === 'lucky7') {
        // After Lucky #7, go back to regular
        nextType = 'regular';
      }

      const { data: newCard, error: newErr } = await supabase
        .from('loyalty_cards')
        .insert({
          user_id: user.id,
          card_type: nextType,
          punches_required: nextType === 'regular' ? 6 : 0,
          rewards_required: nextType === 'regular' ? 1 : 7,
        })
        .select('*')
        .single();

      if (newErr) {
        console.error('Failed to create next card:', newErr);
        toast({ title: 'Next card not created', description: 'Please reopen the loyalty card.', variant: 'destructive' });
        return;
      }

      setCard(newCard as LoyaltyCard);
      await refreshEntries((newCard as LoyaltyCard).id);
      toast({ title: 'Card completed!', description: 'A new loyalty card has been started.' });
    } finally {
      setCreatingNext(false);
    }
  }, [user, refreshEntries]);

  const addEntry = useCallback(
    async (index: number, kind: 'punch' | 'reward', file: File) => {
      if (!user || !card) return;

      // Guard: for regular card, only allow reward on index 7 and after 6 punches
      if (card.card_type === 'regular') {
        if (kind === 'reward' && index !== 7) {
          toast({ title: 'Reward is the 7th box', description: 'Please use box 7 for the free coffee receipt.' });
          return;
        }
        if (kind === 'reward' && punchesDone < 6) {
          toast({ title: 'Not unlocked yet', description: 'Complete all six punches to unlock the free coffee.' });
          return;
        }
        if (kind === 'punch' && (index < 1 || index > 6)) {
          toast({ title: 'Invalid box', description: 'Punches are boxes 1 to 6.' });
          return;
        }
      }

      // Guard: for lucky7, all 1..7 are rewards
      if (card.card_type === 'lucky7' && kind !== 'reward') {
        toast({ title: 'Lucky #7 card', description: 'All boxes are rewards on this card.' });
        return;
      }

      const path = `${user.id}/${card.id}/${index}-${Date.now()}.${(file.type.split('/')[1] || 'jpg')}`;
      const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

      if (uploadErr) {
        console.error('Upload error:', uploadErr);
        toast({ title: 'Upload failed', description: 'Could not upload image', variant: 'destructive' });
        return;
      }

      const { error: insertErr } = await supabase.from('loyalty_entries').insert({
        card_id: card.id,
        index,
        kind,
        image_url: path,
      });

      if (insertErr) {
        console.error('Insert entry error:', insertErr);
        toast({ title: 'Could not save', description: 'Please try again', variant: 'destructive' });
        return;
      }

      // Refresh UI
      await refreshEntries(card.id);

      // Optionally update live counts on the card
      const { error: updateErr } = await supabase
        .from('loyalty_cards')
        .update({
          punches_count: kind === 'punch' ? (card.punches_count + 1) : card.punches_count,
          rewards_count: kind === 'reward' ? (card.rewards_count + 1) : card.rewards_count,
        })
        .eq('id', card.id);

      if (updateErr) {
        console.warn('Non-fatal: card count update failed', updateErr);
      }

      // Finalize if complete and create next
      await finalizeAndCreateNextIfNeeded(card);
    },
    [user, card, punchesDone, finalizeAndCreateNextIfNeeded, refreshEntries]
  );

  useEffect(() => {
    if (user) {
      fetchOrCreateActiveCard();
    } else {
      setCard(null);
      setEntries([]);
    }
  }, [user, fetchOrCreateActiveCard]);

  const deleteEntry = useCallback(
    async (entryId: string, index: number) => {
      if (!user || !card) return;

      try {
        // Get the entry details before deletion
        const entryToDelete = entries.find(e => e.id === entryId);
        if (!entryToDelete) {
          toast({ title: 'Error', description: 'Entry not found', variant: 'destructive' });
          return;
        }

        // Delete from storage first
        const { error: storageError } = await supabase.storage
          .from(BUCKET)
          .remove([entryToDelete.image_url]);

        if (storageError) {
          console.warn('Storage deletion failed:', storageError);
          // Continue with database deletion even if storage fails
        }

        // Delete from database
        const { error: dbError } = await supabase
          .from('loyalty_entries')
          .delete()
          .eq('id', entryId);

        if (dbError) {
          console.error('Database deletion failed:', dbError);
          toast({ title: 'Error', description: 'Failed to delete entry', variant: 'destructive' });
          return;
        }

        // Update card counts
        const newPunchesCount = entryToDelete.kind === 'punch' ? Math.max(0, card.punches_count - 1) : card.punches_count;
        const newRewardsCount = entryToDelete.kind === 'reward' ? Math.max(0, card.rewards_count - 1) : card.rewards_count;

        const { error: updateError } = await supabase
          .from('loyalty_cards')
          .update({
            punches_count: newPunchesCount,
            rewards_count: newRewardsCount,
            is_complete: false // Card becomes incomplete when entry is deleted
          })
          .eq('id', card.id);

        if (updateError) {
          console.warn('Card count update failed:', updateError);
        }

        // Refresh entries to update UI
        await refreshEntries(card.id);
        
        toast({ title: 'Photo deleted', description: 'Your photo has been removed from the loyalty card.' });
      } catch (error) {
        console.error('Delete entry error:', error);
        toast({ title: 'Error', description: 'Failed to delete photo', variant: 'destructive' });
      }
    },
    [user, card, entries, refreshEntries]
  );

  return {
    loading,
    card,
    entries,
    punchesDone,
    rewardsDone,
    isRegular,
    isLucky7,
    creatingNext,
    refresh: fetchOrCreateActiveCard,
    addEntry,
    deleteEntry,
  };
}
