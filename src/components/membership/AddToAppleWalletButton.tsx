import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;

interface AddToAppleWalletButtonProps {
  /** Whether the member has met the requirements (verified profile photo) */
  enabled?: boolean;
  /** Reason shown to the user when disabled */
  disabledReason?: string;
}

/**
 * "Add to Apple Wallet" button for the Crazy Bear member card.
 * Gated behind a verified profile photo.
 */
export const AddToAppleWalletButton: React.FC<AddToAppleWalletButtonProps> = ({
  enabled = true,
  disabledReason,
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const handleAdd = async () => {
    if (!enabled) {
      toast({
        title: 'Verified photo required',
        description: disabledReason || 'Upload a face-on profile photo to unlock your wallet card.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Please sign in again to add your card.');

      const url = `https://${PROJECT_ID}.supabase.co/functions/v1/create-cb-wallet-pass?token=${encodeURIComponent(accessToken)}`;

      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua);

      if (isIOS) {
        window.location.href = url;
        return;
      }

      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Wallet pass failed (${res.status})`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'crazy-bear-membership.pkpass';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      toast({
        title: 'Pass downloaded',
        description: 'Open the .pkpass file on an iPhone to add it to Apple Wallet.',
      });
    } catch (err: any) {
      toast({
        title: 'Could not add to Apple Wallet',
        description: err?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const isLocked = !enabled;

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAdd}
        disabled={loading || isLocked}
        aria-disabled={isLocked}
        className={
          isLocked
            ? 'group flex items-center justify-center gap-3 w-full bg-white text-black/60 border-2 border-dashed border-black/40 h-12 px-5 font-mono uppercase tracking-[0.3em] text-[11px] cursor-not-allowed'
            : 'group flex items-center justify-center gap-3 w-full bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors h-12 px-5 font-mono uppercase tracking-[0.3em] text-[11px] disabled:opacity-50 disabled:cursor-wait'
        }
        aria-label="Add to Apple Wallet"
      >
        {isLocked ? (
          <Lock className="w-5 h-5" aria-hidden />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M17.564 12.65c-.024-2.412 1.97-3.57 2.06-3.628-1.124-1.643-2.873-1.868-3.495-1.893-1.486-.15-2.901.876-3.654.876-.762 0-1.918-.855-3.155-.832-1.622.024-3.119.943-3.953 2.392-1.687 2.92-.43 7.236 1.21 9.605.806 1.158 1.764 2.456 3.018 2.41 1.213-.05 1.67-.78 3.137-.78 1.466 0 1.875.78 3.156.756 1.303-.024 2.128-1.18 2.926-2.343.92-1.342 1.299-2.642 1.32-2.71-.029-.013-2.535-.972-2.57-3.853zM15.42 5.41c.671-.812 1.121-1.94.998-3.064-.967.04-2.137.644-2.83 1.456-.62.717-1.166 1.866-1.018 2.967 1.077.083 2.176-.546 2.85-1.359z" />
          </svg>
        )}
        <span>{isLocked ? 'Locked' : loading ? 'Preparing...' : 'Add to Apple Wallet'}</span>
      </button>
      <p className="font-mono text-[9px] tracking-[0.3em] uppercase text-black/50 text-center">
        {isLocked
          ? (disabledReason || 'Upload a verified profile photo to unlock')
          : 'Open on iPhone Safari to add to Wallet'}
      </p>
    </div>
  );
};
