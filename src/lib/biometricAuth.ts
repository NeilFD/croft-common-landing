import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

const USER_HANDLE_KEY = 'biometric_user_handle';

function getRpParams() {
  const host = window.location.hostname.replace(/^www\./, '');
  return { rpId: host, origin: window.location.origin };
}

// Recent registration grace period to bias discoverable auth (per-tab)
const RECENT_REG_TS_KEY = 'recentPasskeyRegisteredAt';
function markRecentRegistration() {
  try { sessionStorage.setItem(RECENT_REG_TS_KEY, Date.now().toString()); } catch {}
}
function isRecentlyRegistered(ttlMs: number = 10 * 60 * 1000): boolean {
  try {
    const raw = sessionStorage.getItem(RECENT_REG_TS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < ttlMs;
  } catch { return false; }
}

function isApplePlatform(): boolean {
  try {
    const ua = navigator.userAgent || '';
    const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua);
    const isIOS = /iPhone|iPad|iPod/.test(ua) || /CPU (iPhone )?OS/.test(ua);
    return isSafari || isIOS;
  } catch { return false; }
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

// ---- Enhanced helpers & detailed flows ----
export type BioResult = { ok: boolean; errorCode?: string; error?: string };

function mapWebAuthnError(err: unknown): { code: string; message: string } {
  const e = err as any;
  const name = e?.name || e?.constructor?.name;
  const message = e?.message || 'Unknown error';
  switch (name) {
    case 'NotAllowedError':
      return { code: 'not_allowed', message };
    case 'SecurityError':
      return { code: 'security', message };
    case 'InvalidStateError':
      return { code: 'invalid_state', message };
    case 'AbortError':
      return { code: 'abort', message };
    case 'TimeoutError':
      return { code: 'timeout', message };
    case 'NotSupportedError':
      return { code: 'unsupported', message };
    default:
      return { code: 'unknown', message };
  }
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && 'PublicKeyCredential' in window;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  try {
    // Some browsers can throw here if in Private mode
    // @ts-ignore - conditional API presence
    if (typeof PublicKeyCredential === 'undefined') return false;
    return await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable?.() ?? false;
  } catch {
    return false;
  }
}

export async function registerPasskeyDetailed(displayName?: string): Promise<BioResult> {
  try {
    const existing = getStoredUserHandle();
    const { rpId, origin } = getRpParams();
    const { data: optRes, error: optErr } = await supabase.functions.invoke('webauthn-register-options', {
      body: { userHandle: existing ?? undefined, displayName, rpId, origin }
    });
    if (optErr) return { ok: false, errorCode: 'server', error: optErr.message };
    const { options, userHandle } = optRes as any;
    if (userHandle && !existing) setStoredUserHandle(userHandle);

    // Defensive: ensure required WebAuthn user fields are valid strings
    if (!options?.user) (options as any).user = {};
    if (!options.user.name || typeof options.user.name !== 'string') {
      (options.user as any).name = `member-${userHandle ?? existing ?? crypto.randomUUID()}`;
    }
    if (!options.user.displayName || typeof options.user.displayName !== 'string') {
      (options.user as any).displayName = displayName ?? 'Member';
    }

    console.debug('[webauthn] register options.user', options.user);

    let attResp: any;
    try {
      attResp = await startRegistration(options);
    } catch (err) {
      const mapped = mapWebAuthnError(err);
      console.debug('[webauthn] register start error', mapped);
      return { ok: false, errorCode: mapped.code, error: mapped.message };
    }

    const { error: verErr } = await supabase.functions.invoke('webauthn-register-verify', {
      body: { userHandle: userHandle ?? existing, attResp, rpId, origin }
    });
    if (verErr) return { ok: false, errorCode: 'server', error: verErr.message };

    // Mark very recent registration to bias discoverable auth on next attempts
    markRecentRegistration();

    return { ok: true };
  } catch (err) {
    const mapped = mapWebAuthnError(err);
    console.error('[webauthn] register unexpected error', err);
    return { ok: false, errorCode: mapped.code, error: mapped.message };
  }
}

export async function authenticatePasskeyDetailed(): Promise<BioResult> {
  try {
    const handle = getStoredUserHandle();
    console.log('[DEBUG] authenticatePasskeyDetailed starting with handle:', handle);
    if (!handle) return { ok: false, errorCode: 'no_user_handle', error: 'No saved passkey user found' };

    const { rpId, origin } = getRpParams();
    const preferDiscoverable = isApplePlatform() || isRecentlyRegistered();
    const ua = navigator.userAgent;
    console.log('[DEBUG] WebAuthn params:', { rpId, origin, preferDiscoverable, ua });
    console.debug('[webauthn] auth start', { rpId, preferDiscoverable, ua });

    let authResp: any | null = null;

    if (preferDiscoverable) {
      // 1) Try discoverable first so Safari/iOS can surface the right passkey
      console.log('[DEBUG] Trying discoverable auth options');
      const { data: discData, error: discErr } = await supabase.functions.invoke('webauthn-auth-options', {
        body: { userHandle: handle, rpId, origin, discoverable: true }
      });
      console.log('[DEBUG] Discoverable auth options result:', { discData, discErr });
      if (discErr) {
        const msg = String((discErr as any)?.message ?? '');
        console.log('[DEBUG] Discoverable options error:', msg);
        console.debug('[webauthn] discoverable options error', msg);
      } else if ((discData as any)?.error === 'no_credentials') {
        return { ok: false, errorCode: 'no_credentials', error: 'No credentials registered' };
      } else {
        const discOptions = (discData as any).options;
        try {
          console.debug('[webauthn] discoverable attempt');
          authResp = await startAuthentication(discOptions);
        } catch (err) {
          const mapped = mapWebAuthnError(err);
          console.debug('[webauthn] discoverable auth error', mapped);
        }
      }

      // 2) If discoverable failed, fall back to allowCredentials list
      if (!authResp) {
        console.log('[DEBUG] Discoverable failed, trying allowCredentials fallback');
        const { data: optRes, error: optErr } = await supabase.functions.invoke('webauthn-auth-options', {
          body: { userHandle: handle, rpId, origin }
        });
        console.log('[DEBUG] AllowCredentials auth options result:', { optRes, optErr });
        if (optErr) {
          const msg = String((optErr as any)?.message ?? '');
          const lower = msg.toLowerCase();
          console.log('[DEBUG] AllowCredentials options error:', msg);
          if (lower.includes('missing userhandle')) {
            return { ok: false, errorCode: 'no_user_handle', error: msg };
          }
          return { ok: false, errorCode: 'auth_options_failed', error: msg };
        }
        if ((optRes as any)?.error === 'no_credentials') {
          return { ok: false, errorCode: 'no_credentials', error: 'No credentials registered' };
        }
        const { options } = optRes as any;
        const allowLen = Array.isArray((options as any)?.allowCredentials) ? (options as any).allowCredentials.length : 0;
        console.debug('[webauthn] fallback allowCredentials length', allowLen);
        try {
          authResp = await startAuthentication(options);
        } catch (err2) {
          const mapped2 = mapWebAuthnError(err2);
          console.debug('[webauthn] fallback (allowCredentials) auth error', mapped2);
          return { ok: false, errorCode: mapped2.code, error: mapped2.message };
        }
      }
    } else {
      // Default path: start with allowCredentials, then fallback to discoverable if needed
      const { data: optRes, error: optErr } = await supabase.functions.invoke('webauthn-auth-options', {
        body: { userHandle: handle, rpId, origin }
      });
      if (optErr) {
        const msg = String((optErr as any)?.message ?? '');
        const lower = msg.toLowerCase();
        if (lower.includes('missing userhandle')) {
          return { ok: false, errorCode: 'no_user_handle', error: msg };
        }
        return { ok: false, errorCode: 'auth_options_failed', error: msg };
      }
      if ((optRes as any)?.error === 'no_credentials') {
        return { ok: false, errorCode: 'no_credentials', error: 'No credentials registered' };
      }

      const { options } = optRes as any;
      const allowPresent = Array.isArray((options as any)?.allowCredentials) && (options as any).allowCredentials.length > 0;

      try {
        authResp = await startAuthentication(options);
      } catch (err) {
        const mapped = mapWebAuthnError(err);
        const msgLower = String(mapped.message || '').toLowerCase();
        const couldBeNoMatch = ['no passkey', 'no credential', 'no eligible', 'no matching', 'not found', 'no available'].some(s => msgLower.includes(s));
        const shouldRetryDiscoverable = couldBeNoMatch || (allowPresent && mapped.code === 'not_allowed');
        console.debug('[webauthn] auth start error', { mapped, allowPresent, shouldRetryDiscoverable });

        if (shouldRetryDiscoverable) {
          const { data: optRes2, error: optErr2 } = await supabase.functions.invoke('webauthn-auth-options', {
            body: { userHandle: handle, rpId, origin, discoverable: true }
          });
          if (optErr2) {
            return { ok: false, errorCode: 'auth_options_failed', error: String(optErr2.message) };
          }
          if ((optRes2 as any)?.error === 'no_credentials') {
            return { ok: false, errorCode: 'no_credentials', error: 'No credentials registered' };
          }
          try {
            authResp = await startAuthentication((optRes2 as any).options);
          } catch (err2) {
            const mapped2 = mapWebAuthnError(err2);
            console.debug('[webauthn] auth fallback (discoverable) error', mapped2);
            return { ok: false, errorCode: mapped2.code, error: mapped2.message };
          }
        } else {
          return { ok: false, errorCode: mapped.code, error: mapped.message };
        }
      }
    }

    // Verify if we obtained an assertion
    const { error: verErr } = await supabase.functions.invoke('webauthn-auth-verify', {
      body: { userHandle: handle, authResp, rpId, origin }
    });
    if (verErr) return { ok: false, errorCode: 'server', error: verErr.message };

    return { ok: true };
  } catch (err) {
    const mapped = mapWebAuthnError(err);
    console.error('[webauthn] auth unexpected error', err);
    return { ok: false, errorCode: mapped.code, error: mapped.message };
  }
}

export async function ensureBiometricUnlock(displayName?: string): Promise<boolean> {
  try {
    const auth = await authenticatePasskeyDetailed();
    if (auth.ok) return true;
    if (
      auth.errorCode === 'no_user_handle' ||
      auth.errorCode === 'no_credentials' ||
      auth.errorCode === 'auth_options_failed' ||
      auth.errorCode === 'not_allowed'
    ) {
      const reg = await registerPasskeyDetailed(displayName);
      return reg.ok;
    }
    return false;
  } catch (e) {
    console.error('ensureBiometricUnlock error', e);
    return false;
  }
}

export async function ensureBiometricUnlockDetailed(displayName?: string): Promise<{ ok: boolean; stage: 'authenticate' | 'register' | 'unsupported'; errorCode?: string; error?: string }> {
  if (!isWebAuthnSupported()) {
    return { ok: false, stage: 'unsupported', errorCode: 'unsupported', error: 'Passkeys not supported in this browser' };
  }
  if (!(await isPlatformAuthenticatorAvailable())) {
    return { ok: false, stage: 'unsupported', errorCode: 'platform_unavailable', error: 'No built‑in authenticator available on this device' };
  }

  const auth = await authenticatePasskeyDetailed();
  if (auth.ok) return { ok: true, stage: 'authenticate' };

  if (auth.errorCode === 'no_user_handle' || auth.errorCode === 'no_credentials' || auth.errorCode === 'auth_options_failed' || auth.errorCode === 'not_allowed') {
    const reg = await registerPasskeyDetailed(displayName);
    if (reg.ok) return { ok: true, stage: 'register' };
    return { ok: false, stage: 'register', errorCode: reg.errorCode, error: reg.error };
  }

  return { ok: false, stage: 'authenticate', errorCode: auth.errorCode, error: auth.error };
}
