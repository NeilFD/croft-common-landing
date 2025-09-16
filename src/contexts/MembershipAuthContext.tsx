import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMembershipGate } from '@/hooks/useMembershipGate';
import { isBioLongExpired, markBioLongSuccess } from '@/hooks/useRecentBiometric';

interface MembershipAuthState {
  isAuthenticated: boolean;
  isMembershipLinked: boolean;
  membershipExpiry: number | null;
  userHandle: string | null;
  loading: boolean;
}

interface MembershipAuthActions {
  login: () => void;
  logout: () => void;
  refreshMembershipStatus: () => void;
  isFullyAuthenticated: () => boolean;
}

interface MembershipAuthContextValue extends MembershipAuthState, MembershipAuthActions {}

const MembershipAuthContext = createContext<MembershipAuthContextValue | undefined>(undefined);

const MEMBERSHIP_LINK_KEY = 'membershipLinked';
const MEMBERSHIP_EXPIRY_KEY = 'membershipExpiry';
const USER_HANDLE_KEY = 'userHandle';
const MEMBERSHIP_TTL = 180 * 24 * 60 * 60 * 1000; // 180 days in milliseconds

export const MembershipAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const membershipGate = useMembershipGate();
  
  const [membershipState, setMembershipState] = useState<MembershipAuthState>({
    isAuthenticated: false,
    isMembershipLinked: false,
    membershipExpiry: null,
    userHandle: null,
    loading: true,
  });

  // Check stored membership status
  const checkStoredMembershipStatus = useCallback(() => {
    try {
      const linkedStr = localStorage.getItem(MEMBERSHIP_LINK_KEY);
      const expiryStr = localStorage.getItem(MEMBERSHIP_EXPIRY_KEY);
      const userHandle = localStorage.getItem(USER_HANDLE_KEY);
      
      if (!linkedStr || !expiryStr) {
        return { isLinked: false, expiry: null, userHandle: null };
      }
      
      const expiry = parseInt(expiryStr, 10);
      const isExpired = Date.now() > expiry;
      
      if (isExpired) {
        // Clean up expired data
        localStorage.removeItem(MEMBERSHIP_LINK_KEY);
        localStorage.removeItem(MEMBERSHIP_EXPIRY_KEY);
        localStorage.removeItem(USER_HANDLE_KEY);
        return { isLinked: false, expiry: null, userHandle: null };
      }
      
      return { 
        isLinked: linkedStr === 'true', 
        expiry, 
        userHandle 
      };
    } catch {
      return { isLinked: false, expiry: null, userHandle: null };
    }
  }, []);

  // Update membership state when auth changes
  useEffect(() => {
    const { isLinked, expiry, userHandle } = checkStoredMembershipStatus();
    
    setMembershipState({
      isAuthenticated: !!user,
      isMembershipLinked: !!user && isLinked,
      membershipExpiry: expiry,
      userHandle,
      loading: authLoading,
    });
  }, [user, authLoading, checkStoredMembershipStatus]);

  // Handle successful membership linking
  useEffect(() => {
    if (membershipGate.allowed && user) {
      const expiry = Date.now() + MEMBERSHIP_TTL;
      
      try {
        localStorage.setItem(MEMBERSHIP_LINK_KEY, 'true');
        localStorage.setItem(MEMBERSHIP_EXPIRY_KEY, expiry.toString());
        
        // Store user handle if available
        const storedHandle = localStorage.getItem(USER_HANDLE_KEY);
        if (storedHandle) {
          localStorage.setItem(USER_HANDLE_KEY, storedHandle);
        }
        
        // Mark long-term biometric success
        markBioLongSuccess();
        
        setMembershipState(prev => ({
          ...prev,
          isMembershipLinked: true,
          membershipExpiry: expiry,
        }));
      } catch (error) {
        console.warn('Failed to store membership status:', error);
      }
    }
  }, [membershipGate.allowed, user]);

  const login = useCallback(() => {
    membershipGate.start();
  }, [membershipGate]);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(MEMBERSHIP_LINK_KEY);
      localStorage.removeItem(MEMBERSHIP_EXPIRY_KEY);
      localStorage.removeItem(USER_HANDLE_KEY);
    } catch (error) {
      console.warn('Failed to clear membership data:', error);
    }
    
    membershipGate.reset();
    setMembershipState(prev => ({
      ...prev,
      isMembershipLinked: false,
      membershipExpiry: null,
      userHandle: null,
    }));
  }, [membershipGate]);

  const refreshMembershipStatus = useCallback(() => {
    const { isLinked, expiry, userHandle } = checkStoredMembershipStatus();
    setMembershipState(prev => ({
      ...prev,
      isMembershipLinked: !!user && isLinked,
      membershipExpiry: expiry,
      userHandle,
    }));
  }, [user, checkStoredMembershipStatus]);

  const isFullyAuthenticated = useCallback(() => {
    return !!(user && membershipState.isMembershipLinked && !isBioLongExpired());
  }, [user, membershipState.isMembershipLinked]);

  const contextValue: MembershipAuthContextValue = {
    ...membershipState,
    login,
    logout,
    refreshMembershipStatus,
    isFullyAuthenticated,
  };

  return (
    <MembershipAuthContext.Provider value={contextValue}>
      {children}
    </MembershipAuthContext.Provider>
  );
};

export const useMembershipAuth = () => {
  const context = useContext(MembershipAuthContext);
  if (context === undefined) {
    throw new Error('useMembershipAuth must be used within a MembershipAuthProvider');
  }
  return context;
};