import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUserHandle } from "@/lib/biometricAuth";

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

  const start = useCallback(() => {
    setAllowed(false);
    console.debug('[gate] start -> bioOpen');
    setBioOpen(true);
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
  }, []);

  const handleAuthSuccess = useCallback(() => {
    console.debug('[gate] auth success');
    setAuthOpen(false);
    setAllowed(true);
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
