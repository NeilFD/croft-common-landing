import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUserHandle, ensureBiometricUnlockDetailed } from "@/lib/biometricAuth";
import { markBioSuccess } from "@/hooks/useRecentBiometric";

interface UseMembershipGate {
  bioOpen: boolean;
  linkOpen: boolean;
  authOpen: boolean;
  allowed: boolean;
  checking: boolean;
  start: () => void;
  reset: () => void;
  handleBioSuccess: () => Promise<void>;
  handleBioFallback: () => void;
  handleLinkSuccess: (email: string) => void;
  handleAuthSuccess: () => void;
}

export function useMembershipGate(): UseMembershipGate {
  const [bioOpen, setBioOpen] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(false);

  const reset = useCallback(() => {
    setBioOpen(false);
    setLinkOpen(false);
    setAuthOpen(false);
    setAllowed(false);
    setChecking(false);
  }, []);

  // Always attempt a silent biometric first; only show the modal if it fails
  const start = useCallback(() => {
    setAllowed(false);
    setChecking(true);
    console.debug('[gate] start: auto biometric (always)');
    (async () => {
      try {
        console.debug('[gate] prompting biometric');
        const res = await ensureBiometricUnlockDetailed('Member');
        if (res.ok) {
          markBioSuccess();
          await handleBioSuccess();
        } else {
          console.debug('[gate] auto biometric failed', res);
          setBioOpen(true);
        }
      } catch (e) {
        console.debug('[gate] auto biometric error', e);
        setBioOpen(true);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  const handleBioSuccess = useCallback(async () => {
    // After a successful fresh biometric, check if this device's passkey is linked to an active subscriber
    const userHandle = getStoredUserHandle();
    if (!userHandle) {
      // No stored handle (unexpected) — prompt to link via email
      setBioOpen(false);
      setLinkOpen(true);
      return;
    }
    setChecking(true);
    console.debug('[gate] check-membership start', { userHandle });
    try {
      const { data, error } = await supabase.functions.invoke('check-membership', {
        body: { userHandle }
      });
      if (error) {
        console.debug('[gate] check-membership error', error);
        // On server error, ask to link
        setBioOpen(false);
        setLinkOpen(true);
        return;
      }
      const d: any = data ?? {};
      const isLinked = Boolean(d.linked ?? d.isLinked ?? d.linkedAndActive ?? d.active);
      console.debug('[gate] check-membership result', { isLinked, data: d });
      if (isLinked) {
        setAllowed(true);
        setBioOpen(false);
        setLinkOpen(false);
      } else {
        setBioOpen(false);
        setLinkOpen(true);
      }
    } catch {
      setBioOpen(false);
      setLinkOpen(true);
    } finally {
      setChecking(false);
    }
  }, []);

  const handleBioFallback = useCallback(() => {
    console.debug('[gate] bio fallback -> authOpen');
    setBioOpen(false);
    setAuthOpen(true);
  }, []);

  const handleLinkSuccess = useCallback((email: string) => {
    console.debug('[gate] link success', { email });
    // Link completed successfully — allow access from now on
    setLinkOpen(false);
    setAllowed(true);

    // Proactively ensure a passkey exists after email link so next gesture uses Face ID
    setTimeout(async () => {
      try {
        const res = await ensureBiometricUnlockDetailed('Member');
        console.debug('[gate] post-link ensureBiometricUnlock', res);
        if (res.ok) markBioSuccess();
      } catch (e) {
        console.debug('[gate] post-link ensureBiometricUnlock error', e);
      }
    }, 0);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    console.debug('[gate] auth success');
    setAuthOpen(false);
    setAllowed(true);

    // Also try to create a passkey after generic auth so next time Face ID works
    setTimeout(async () => {
      try {
        const res = await ensureBiometricUnlockDetailed('Member');
        console.debug('[gate] post-auth ensureBiometricUnlock', res);
        if (res.ok) markBioSuccess();
      } catch (e) {
        console.debug('[gate] post-auth ensureBiometricUnlock error', e);
      }
    }, 0);
  }, []);

  return {
    bioOpen,
    linkOpen,
    authOpen,
    allowed,
    checking,
    start,
    reset,
    handleBioSuccess,
    handleBioFallback,
    handleLinkSuccess,
    handleAuthSuccess,
  };
}
