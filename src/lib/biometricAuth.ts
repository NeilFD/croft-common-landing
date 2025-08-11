import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

const USER_HANDLE_KEY = 'biometric_user_handle';

function getRpParams() {
  return { rpId: window.location.hostname, origin: window.location.origin };
}

export function getStoredUserHandle(): string | null {
  return localStorage.getItem(USER_HANDLE_KEY);
}

export function setStoredUserHandle(handle: string) {
  localStorage.setItem(USER_HANDLE_KEY, handle);
}

export async function registerPasskey(displayName?: string): Promise<{ ok: boolean; error?: string }> {
  const existing = getStoredUserHandle();
  const { rpId, origin } = getRpParams();
  const { data: optRes, error: optErr } = await supabase.functions.invoke('webauthn-register-options', {
    body: { userHandle: existing ?? undefined, displayName, rpId, origin }
  });
  if (optErr) return { ok: false, error: optErr.message };
  const { options, userHandle } = optRes as any;
  if (userHandle && !existing) setStoredUserHandle(userHandle);
  const attResp = await startRegistration(options);
  const { error: verErr } = await supabase.functions.invoke('webauthn-register-verify', {
    body: { userHandle: userHandle ?? existing, attResp, rpId, origin }
  });
  if (verErr) return { ok: false, error: verErr.message };
  return { ok: true };
}

export async function authenticatePasskey(): Promise<{ ok: boolean; error?: string }> {
  const handle = getStoredUserHandle();
  if (!handle) return { ok: false, error: 'no_user_handle' };
  const { rpId, origin } = getRpParams();
  const { data: optRes, error: optErr } = await supabase.functions.invoke('webauthn-auth-options', {
    body: { userHandle: handle, rpId, origin }
  });
  if (optErr) return { ok: false, error: optErr.message };
  if ((optRes as any)?.error === 'no_credentials') return { ok: false, error: 'no_credentials' };
  const { options } = optRes as any;
  const authResp = await startAuthentication(options);
  const { error: verErr } = await supabase.functions.invoke('webauthn-auth-verify', {
    body: { userHandle: handle, authResp, rpId, origin }
  });
  if (verErr) return { ok: false, error: verErr.message };
  return { ok: true };
}

export async function ensureBiometricUnlock(displayName?: string): Promise<boolean> {
  try {
    const auth = await authenticatePasskey();
    if (auth.ok) return true;
    if (auth.error === 'no_user_handle' || auth.error === 'no_credentials') {
      const reg = await registerPasskey(displayName);
      return reg.ok;
    }
    return false;
  } catch (e) {
    console.error('ensureBiometricUnlock error', e);
    return false;
  }
}
