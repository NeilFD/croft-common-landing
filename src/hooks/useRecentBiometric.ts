// Utilities to cache and check recent biometric success
// Uses sessionStorage to keep it per-tab and short-lived
export const RECENT_BIO_TS_KEY = 'recentBioOKAt';

export function markBioSuccess() {
  try {
    sessionStorage.setItem(RECENT_BIO_TS_KEY, Date.now().toString());
  } catch {}
}

export function isBioRecentlyOk(ttlMs: number = 5 * 60 * 1000): boolean {
  try {
    const raw = sessionStorage.getItem(RECENT_BIO_TS_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < ttlMs;
  } catch {
    return false;
  }
}

export function clearRecentBio() {
  try { sessionStorage.removeItem(RECENT_BIO_TS_KEY); } catch {}
}
