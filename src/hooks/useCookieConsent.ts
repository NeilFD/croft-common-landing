import { useEffect, useState } from "react";

export type CookieConsentStatus = "accepted" | "rejected" | null;

const KEY = "cb-cookie-consent";

const read = (): CookieConsentStatus => {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(KEY);
    return v === "accepted" || v === "rejected" ? v : null;
  } catch {
    return null;
  }
};

const write = (v: CookieConsentStatus) => {
  if (typeof window === "undefined") return;
  try {
    if (v === null) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, v);
    window.dispatchEvent(new CustomEvent("cb:cookie-consent", { detail: v }));
  } catch {
    /* noop */
  }
};

export const useCookieConsent = () => {
  const [status, setStatus] = useState<CookieConsentStatus>(() => read());

  useEffect(() => {
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<CookieConsentStatus>).detail;
      setStatus(detail ?? read());
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setStatus(read());
    };
    window.addEventListener("cb:cookie-consent", onChange as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cb:cookie-consent", onChange as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return {
    status,
    accept: () => write("accepted"),
    reject: () => write("rejected"),
    reset: () => write(null),
  };
};

/** Trigger the banner to reappear (used by the Cookies policy page). */
export const openCookiePreferences = () => write(null);
