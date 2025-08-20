import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getStoredUserHandle } from '@/lib/biometricAuth';
import { markBioLongSuccess, isBioLongExpired } from '@/hooks/useRecentBiometric';
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
  handleLinkSuccess: (email: string, firstName?: string) => void;
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

  // Handle verification token from URL (when users click email link)
  useEffect(() => {
    const handleVerificationToken = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('membershipToken');
      
      if (token) {
        try {
          const { data, error } = await supabase.functions.invoke('verify-membership-link', {
            body: { token }
          });
          
          if (!error && data?.success) {
            setIsMember(true);
            markBioLongSuccess();
            
            // Personalized welcome message
            const firstName = data?.first_name || data?.profile?.first_name || 'Member';
            toast.success(`Welcome to Croft Common, ${firstName}!`);
            
            // Clean up URL
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('membershipToken');
            window.history.replaceState({}, '', newUrl.toString());
            
            // Try to create passkey for future use
            setTimeout(async () => {
              try {
                const existing = getStoredUserHandle();
                if (!existing) {
                  await ensureBiometricUnlockSerialized('Member');
                }
              } catch (e) {
                console.debug('Post-verification passkey creation failed', e);
              }
            }, 2000);
          }
        } catch (err) {
          console.error('Token verification failed:', err);
          toast.error('Verification link expired or invalid');
        }
      }
    };

    handleVerificationToken();
  }, []);

  const showMemberLogin = useCallback(() => {
    console.log('🔑 showMemberLogin called');
    const userHandle = getStoredUserHandle();
    const bioExpired = isBioLongExpired();
    
    console.log('🔑 userHandle:', userHandle);
    console.log('🔑 bioExpired:', bioExpired);
    
    // If we have a stored user handle and biometric isn't expired, try biometric first
    if (userHandle && !bioExpired) {
      console.log('🔑 Opening biometric modal');
      setBioOpen(true);
    } else {
      console.log('🔑 Opening link modal');
      setLinkOpen(true);
    }
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
        
        // Get user's first name for personalized greeting
        const firstName = data?.first_name || data?.profile?.first_name || 'Member';
        toast.success(`Welcome back, ${firstName}!`);
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

  const handleLinkSuccess = useCallback(async (email: string, firstName?: string) => {
    setIsMember(true);
    markBioLongSuccess();
    closeMemberLogin();
    
    // Personalized welcome message
    const name = firstName || 'Member';
    toast.success(`Welcome to Croft Common, ${name}!`);
    
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