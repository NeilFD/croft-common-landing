import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import { supabase } from '@/integrations/supabase/client';

const USER_HANDLE_KEY = 'biometric_user_handle';
const HAS_CREDENTIALS_KEY = 'has_webauthn_credentials';

function getRpParams() {
  const host = window.location.hostname.replace(/^www\./, '');
  return { rpId: host, origin: window.location.origin };
}

// Track credential existence in localStorage
function markHasCredentials() {
  try { localStorage.setItem(HAS_CREDENTIALS_KEY, 'true'); } catch {}
}

function clearHasCredentials() {
  try { localStorage.removeItem(HAS_CREDENTIALS_KEY); } catch {}
}

function hasStoredCredentials(): boolean {
  try { return localStorage.getItem(HAS_CREDENTIALS_KEY) === 'true'; } catch { return false; }
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
export type BioResult = { 
  ok: boolean; 
  success?: boolean;
  code?: string;
  message?: string;
  errorCode?: string; 
  error?: string; 
  userHandle?: string; 
  requiresLinking?: boolean; 
  hasExistingLink?: boolean; 
  details?: any; 
};

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

// Helper to create Supabase session after WebAuthn success
async function createSupabaseSession(userHandle: string, email?: string): Promise<{ ok: boolean; session?: any; error?: string }> {
  try {
    console.log('[biometricAuth] Creating Supabase session for userHandle:', userHandle);
    
    const { data: result, error: invokeError } = await supabase.functions.invoke('webauthn-create-session', {
      body: { userHandle, email }
    });
    
    if (invokeError) {
      console.error('[biometricAuth] Session creation failed:', invokeError);
      return { ok: false, error: invokeError.message };
    }
    
    if (!result.success) {
      console.error('[biometricAuth] Session creation failed:', result.error);
      return { ok: false, error: result.error };
    }
    
    console.log('[biometricAuth] Session setup completed');
    return { ok: true };
    
  } catch (error) {
    console.error('[biometricAuth] Session creation error:', error);
    return { ok: false, error: String(error) };
  }
}

export async function registerPasskeyDetailed(displayName?: string): Promise<BioResult> {
  try {
    const existing = getStoredUserHandle();
    const { rpId, origin } = getRpParams();

    // For app reinstalls, clear any existing WebAuthn data to force fresh registration
    if (existing) {
      try {
        console.debug('[biometricAuth] Clearing existing WebAuthn data for fresh registration');
        await supabase.functions.invoke('clear-webauthn-data', {
          body: { userHandle: existing }
        });
      } catch (clearError) {
        console.warn('[biometricAuth] Failed to clear existing data, continuing:', clearError);
      }
    }
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

    const { data: verifyData, error: verError } = await supabase.functions.invoke('webauthn-register-verify', {
      body: {
        userHandle: userHandle ?? existing,
        attResp,
        rpId,
        origin
      }
    });

    if (verError) {
      console.error('[biometricAuth] Verification call failed:', verError);
      return { 
        ok: false, 
        errorCode: 'verification_failed', 
        error: verError.message 
      };
    }

    console.log('[biometricAuth] Verification response:', verifyData);

    if (!verifyData.verified) {
      const errorMsg = verifyData.error || 'Verification failed';
      console.error('[biometricAuth] Verification failed:', verifyData);
      return { 
        ok: false, 
        errorCode: 'verification_failed', 
        error: errorMsg,
        details: verifyData.details 
      };
    }

    console.log('[biometricAuth] Registration successful:', verifyData.userHandle);
    setStoredUserHandle(verifyData.userHandle);
    markRecentRegistration();
    markHasCredentials();
    
    // Return success with requiresLinking flag - session creation will be handled by caller
    return { 
      ok: true, 
      userHandle: verifyData.userHandle,
      requiresLinking: verifyData.requiresLinking 
    };
  } catch (err) {
    const mapped = mapWebAuthnError(err);
    console.error('[webauthn] register unexpected error', err);
    return { ok: false, errorCode: mapped.code, error: mapped.message };
  }
}

export async function authenticatePasskeyDetailed(): Promise<BioResult> {
  try {
    const handle = getStoredUserHandle();
    if (!handle) return { ok: false, errorCode: 'no_user_handle', error: 'No saved passkey user found' };

    const { rpId, origin } = getRpParams();
    const preferDiscoverable = isApplePlatform() || isRecentlyRegistered();
    const ua = navigator.userAgent;
    console.debug('[webauthn] auth start', { rpId, preferDiscoverable, ua });

    let authResp: any | null = null;

    if (preferDiscoverable) {
      // 1) Try discoverable first so Safari/iOS can surface the right passkey
      const { data: discData, error: discErr } = await supabase.functions.invoke('webauthn-auth-options', {
        body: { userHandle: handle, rpId, origin, discoverable: true }
      });
      if (discErr) {
        const msg = String((discErr as any)?.message ?? '');
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
          clearHasCredentials();
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
          clearHasCredentials();
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
            clearHasCredentials();
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
    const { data: authData, error: verError } = await supabase.functions.invoke('webauthn-auth-verify', {
      body: { userHandle: handle, authResp, rpId, origin }
    });

    if (verError) {
      return { ok: false, errorCode: 'verification_failed', error: verError.message };
    }

    if (!authData.verified) {
      return { ok: false, errorCode: 'verification_failed', error: 'Authentication verification failed' };
    }

    console.log('[biometricAuth] Authentication successful');
    markRecentRegistration();
    
    // Return success with user handle and linking status
    return { 
      ok: true,
      userHandle: authData.userHandle,
      hasExistingLink: authData.hasExistingLink
    };
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

// Enhanced version that includes session creation
export async function ensureBiometricUnlockDetailed(displayName?: string): Promise<{ 
  ok: boolean; 
  stage: 'authenticate' | 'register' | 'unsupported'; 
  errorCode?: string; 
  error?: string; 
  session?: any; 
  userHandle?: string; 
  requiresLinking?: boolean; 
}> {
  if (!isWebAuthnSupported()) {
    return { ok: false, stage: 'unsupported', errorCode: 'unsupported', error: 'Passkeys not supported in this browser' };
  }
  if (!(await isPlatformAuthenticatorAvailable())) {
    return { ok: false, stage: 'unsupported', errorCode: 'platform_unavailable', error: 'No built‑in authenticator available on this device' };
  }

  // For app reinstalls, always start with fresh registration 
  // This handles cases where the user deleted the app and reinstalled it
  console.log('[biometricAuth] Starting fresh registration flow for app reinstall scenario');
  
  const regResult = await registerPasskeyDetailed(displayName);
  
  if (regResult.ok) {
    console.log('[biometricAuth] Registration successful');
    return { ok: true, stage: 'register', userHandle: regResult.userHandle, requiresLinking: regResult.requiresLinking };
  }
  
  // If registration failed due to existing credentials, try authentication as fallback
  if (regResult.errorCode === 'verification_failed' || regResult.errorCode === 'unknown') {
    console.log('[biometricAuth] Registration failed, trying authentication as fallback');
    const authResult = await authenticatePasskeyDetailed();
    
    if (authResult.ok && authResult.hasExistingLink) {
      console.log('[biometricAuth] Authentication successful with existing link');
      const sessionResult = await createSupabaseSession(authResult.userHandle!);
      if (sessionResult.ok) {
        return { ok: true, stage: 'authenticate', session: sessionResult.session };
      }
      return { ok: true, stage: 'authenticate' };
    } else if (authResult.ok && !authResult.hasExistingLink) {
      console.log('[biometricAuth] Authentication successful but no existing link - need email');
      return { ok: true, stage: 'authenticate', userHandle: authResult.userHandle };
    }
  }
  
  console.log('[biometricAuth] Both registration and authentication failed:', regResult);
  return { ok: false, stage: 'register', errorCode: regResult.errorCode, error: regResult.error };
}

// Add export for the session creation function
export { createSupabaseSession };
