import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getStoredUserHandle } from '@/lib/biometricAuth';
import { markBioLongSuccess } from '@/hooks/useRecentBiometric';
import { ensureBiometricUnlockSerialized } from '@/lib/webauthnOrchestrator';
import { toast } from 'sonner';

interface MembershipAuthContextType {
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

const MembershipAuthContext = createContext<MembershipAuthContextType | undefined>(undefined);

export function MembershipAuthProvider({ children }: { children: ReactNode }) {
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

  const showMemberLogin = useCallback(() => {
    console.log('🔑 showMemberLogin called - CONTEXT VERSION');
    console.log('🔑 Setting linkOpen to true immediately');
    setLinkOpen(true);
  }, []);

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

  const value = {
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

  return (
    <MembershipAuthContext.Provider value={value}>
      {children}
    </MembershipAuthContext.Provider>
  );
}

export function useMembershipAuth() {
  const context = useContext(MembershipAuthContext);
  if (context === undefined) {
    throw new Error('useMembershipAuth must be used within a MembershipAuthProvider');
  }
  return context;
}