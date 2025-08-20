import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getStoredUserHandle } from '@/lib/biometricAuth';
import { markBioLongSuccess, isBioLongExpired } from '@/hooks/useRecentBiometric';
import { ensureBiometricUnlockSerialized } from '@/lib/webauthnOrchestrator';
import { toast } from 'sonner';

interface UseMembershipAuth {
  isMember: boolean;
  loading: boolean;
  bioOpen: boolean;
  linkOpen: boolean;
  showMemberLogin: () => void;
  closeMemberLogin: () => void;
  signOutMember: () => Promise<void>;
  handleBioSuccess: () => Promise<void>;
  handleBioFallback: () => void;
  handleLinkSuccess: (email: string) => void;
  checkMembershipStatus: () => Promise<boolean>;
}

export function useMembershipAuth(): UseMembershipAuth {
  const { user, signOut } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bioOpen, setBioOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);

  // Check if current user is a verified member
  const checkMembershipStatus = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const userHandle = getStoredUserHandle();
      if (!userHandle) return false;

      const { data, error } = await supabase.functions.invoke('check-membership', {
        body: { userHandle }
      });
      
      if (error) return false;
      
      const isLinked = Boolean(data?.linked ?? data?.isLinked ?? data?.linkedAndActive ?? data?.active);
      setIsMember(isLinked);
      return isLinked;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check membership status when component mounts or when user changes
  useEffect(() => {
    checkMembershipStatus();
  }, [user, checkMembershipStatus]);

  const showMemberLogin = useCallback(() => {
    console.log('🔑 showMemberLogin called');
    const userHandle = getStoredUserHandle();
    const bioExpired = isBioLongExpired();
    
    console.log('🔑 userHandle:', userHandle);
    console.log('🔑 bioExpired:', bioExpired);
    console.log('🔑 current bioOpen:', bioOpen);
    console.log('🔑 current linkOpen:', linkOpen);
    
    // Temporarily always show link modal for debugging
    console.log('🔑 Setting linkOpen to true');
    setLinkOpen(true);
  }, [bioOpen, linkOpen]);

  const closeMemberLogin = useCallback(() => {
    setBioOpen(false);
    setLinkOpen(false);
  }, []);

  const handleBioSuccess = useCallback(async () => {
    const userHandle = getStoredUserHandle();
    if (!userHandle) {
      setBioOpen(false);
      setLinkOpen(true);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-membership', {
        body: { userHandle }
      });

      if (error) {
        setBioOpen(false);
        setLinkOpen(true);
        return;
      }

      const isLinked = Boolean(data?.linked ?? data?.isLinked ?? data?.linkedAndActive ?? data?.active);
      if (isLinked) {
        setIsMember(true);
        markBioLongSuccess();
        closeMemberLogin();
        toast.success('Welcome back, Member!');
      } else {
        setBioOpen(false);
        setLinkOpen(true);
      }
    } catch {
      setBioOpen(false);
      setLinkOpen(true);
    } finally {
      setLoading(false);
    }
  }, [closeMemberLogin]);

  const handleBioFallback = useCallback(() => {
    setBioOpen(false);
    setLinkOpen(true);
  }, []);

  const handleLinkSuccess = useCallback(async (email: string) => {
    setIsMember(true);
    markBioLongSuccess();
    closeMemberLogin();
    toast.success('Membership verified! Welcome to Croft Common.');
    
    // Try to create passkey for next time
    setTimeout(async () => {
      try {
        const existing = getStoredUserHandle();
        if (!existing) {
          await ensureBiometricUnlockSerialized('Member');
        }
      } catch (e) {
        console.debug('Post-link passkey creation failed', e);
      }
    }, 1000);
  }, [closeMemberLogin]);

  const signOutMember = useCallback(async () => {
    if (user) {
      await signOut();
    }
    setIsMember(false);
    toast.message('Signed out successfully');
  }, [signOut, user]);

  return {
    isMember,
    loading,
    bioOpen,
    linkOpen,
    showMemberLogin,
    closeMemberLogin,
    signOutMember,
    handleBioSuccess,
    handleBioFallback,
    handleLinkSuccess,
    checkMembershipStatus
  };
}
