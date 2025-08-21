import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getStoredUserHandle } from "@/lib/biometricAuth";
import { markBioSuccess, markBioLongSuccess, isBioLongExpired } from "@/hooks/useRecentBiometric";
import { ensureBiometricUnlockSerialized } from "@/lib/webauthnOrchestrator";
import { toast } from "sonner";


interface UseMembershipGate {
  bioOpen: boolean;
  linkOpen: boolean;
  authOpen: boolean;
  authEmail: string | null;
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
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(false);
  const inFlightRef = useRef(false);
  const lastStartTsRef = useRef(0);


  const reset = useCallback(() => {
    setBioOpen(false);
    setLinkOpen(false);
    setAuthOpen(false);
    setAuthEmail(null);
    setAllowed(false);
    setChecking(false);
  }, []);

  // Start gate: prefer silent server check using stored passkey handle. No TTL bypass.
  const start = useCallback(() => {
    const now = Date.now();
    if (inFlightRef.current) {
      console.debug('[gate] start skipped: in-flight');
      return;
    }
    if (now - lastStartTsRef.current < 400) {
      console.debug('[gate] start skipped: debounced');
      return;
    }
    inFlightRef.current = true;
    lastStartTsRef.current = now;

    setAllowed(false);
    setChecking(true);

    (async () => {
      try {
        const userHandle = getStoredUserHandle();
        if (userHandle) {
          console.debug('[gate] silent membership check with stored handle');
          if (isBioLongExpired()) {
            console.debug('[gate] device trust expired -> prompt relink');
            setLinkOpen(true);
            setBioOpen(false);
            toast.message('For your security, please relink your membership to this device.', { description: 'Face ID / Passkey access has expired (180 days). Relink to continue.' });
            return;
          }
          const { data, error } = await supabase.functions.invoke('check-membership', {
            body: { userHandle }
          });
          if (error) {
            console.debug('[gate] silent check error', error);
            setLinkOpen(true);
            setBioOpen(false);
            return;
          }
          const d: any = data ?? {};
          const isLinked = Boolean(d.linked ?? d.isLinked ?? d.linkedAndActive ?? d.active);
          console.debug('[gate] silent check result', { isLinked, data: d });
          if (isLinked) {
            // Face ID verified membership, now require Email OTP for authentication
            setBioOpen(false);
            setAuthEmail(d.email);
            setAuthOpen(true);
            return;
          } else {
            setLinkOpen(true);
            setBioOpen(false);
            return;
          }
        } else {
          console.debug('[gate] no stored handle -> prompt biometric to create passkey');
          setBioOpen(true);
          setLinkOpen(false);
          return;
        }
      } catch (e) {
        console.debug('[gate] start error', e);
        // On unexpected errors, fall back to link
        setLinkOpen(true);
        setBioOpen(false);
      } finally {
        setChecking(false);
        inFlightRef.current = false;
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
        // Face ID verified membership, now require Email OTP for authentication
        setBioOpen(false);
        setAuthEmail(d.email);
        setAuthOpen(true);
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
    markBioLongSuccess();

    // Proactively ensure a passkey exists after email link so next gesture uses Face ID,
    // but only if we don't already have a stored userHandle to avoid duplicate prompts.
    setTimeout(async () => {
      try {
        const existing = getStoredUserHandle();
        if (existing) {
          console.debug('[gate] post-link: passkey already present, skipping prompt');
          return;
        }
        const res = await ensureBiometricUnlockSerialized('Member');
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
    markBioLongSuccess();

    // Also try to create a passkey after generic auth so next time Face ID works,
    // but only if we don't already have a stored userHandle to avoid duplicate prompts.
    setTimeout(async () => {
      try {
        const existing = getStoredUserHandle();
        if (existing) {
          console.debug('[gate] post-auth: passkey already present, skipping prompt');
          return;
        }
        const res = await ensureBiometricUnlockSerialized('Member');
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
    authEmail,
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
