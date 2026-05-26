import { useCallback, useEffect, useState } from "react";

/**
 * Loads the Mews distributor script once per page and exposes an `open()`
 * helper for the official full-screen Mews overlay.
 *
 * Mews docs: https://help.mews.com/s/article/setup-the-booking-engine
 * The direct distributor URL cannot be framed because Mews sends
 * frame-ancestors 'self'. The supported route is the script overlay.
 */

const SCRIPT_SRC = "https://app.mews.com/distributor/distributor.min.js";
const SCRIPT_ID = "cb-mews-distributor";

declare global {
  interface Window {
    Mews?: {
      Distributor?: (options: {
        configurationIds: string[];
        openElements?: string;
        currency?: string;
        language?: string;
        theme?: { primaryColor?: string };
      }, callback?: (app: MewsDistributorApp) => void) => void;
    };
  }
}

type Status = "idle" | "loading" | "ready" | "error";
type MewsDistributorApp = { open: () => void; close?: () => void };

let scriptStatus: Status = "idle";
const listeners = new Set<(status: Status) => void>();

const setStatus = (next: Status) => {
  scriptStatus = next;
  listeners.forEach((cb) => cb(next));
};

const loadScript = () => {
  if (typeof window === "undefined") return;
  if (scriptStatus === "ready" || scriptStatus === "loading") return;
  if (window.Mews?.Distributor) {
    setStatus("ready");
    return;
  }

  setStatus("loading");
  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  const script = existing ?? document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = SCRIPT_SRC;
  script.onload = () => setStatus("ready");
  script.onerror = () => {
    console.warn("[Mews] distributor script failed to load");
    setStatus("error");
  };
  if (!existing) document.head.appendChild(script);
};

const apps = new Map<string, MewsDistributorApp>();
const initialising = new Set<string>();
const appListeners = new Map<string, Set<(app: MewsDistributorApp) => void>>();

const notifyAppReady = (key: string, app: MewsDistributorApp) => {
  appListeners.get(key)?.forEach((cb) => cb(app));
};

const initialiseDistributor = (configurationId: string, openElementId: string) => {
  const key = `${configurationId}:${openElementId}`;
  if (apps.has(key) || initialising.has(key)) return;

  const Distributor = window.Mews?.Distributor;
  if (!Distributor) return;

  initialising.add(key);
  try {
    Distributor(
      {
        configurationIds: [configurationId],
        openElements: `#${openElementId}`,
        currency: "GBP",
        language: "en-GB",
        theme: { primaryColor: "#000000" },
      },
      (app) => {
        apps.set(key, app);
        initialising.delete(key);
        notifyAppReady(key, app);
      },
    );
  } catch (err) {
    initialising.delete(key);
    console.warn("[Mews] failed to initialise distributor", err);
  }
};

export const useMewsDistributor = (configurationId: string, openElementId: string) => {
  const [status, setLocalStatus] = useState<Status>(scriptStatus);
  const key = `${configurationId}:${openElementId}`;
  const [app, setApp] = useState<MewsDistributorApp | null>(() => apps.get(key) ?? null);

  useEffect(() => {
    listeners.add(setLocalStatus);
    loadScript();
    return () => {
      listeners.delete(setLocalStatus);
    };
  }, []);

  useEffect(() => {
    const existing = apps.get(key);
    if (existing) {
      setApp(existing);
      return;
    }

    const set = appListeners.get(key) ?? new Set<(next: MewsDistributorApp) => void>();
    set.add(setApp);
    appListeners.set(key, set);

    if (status === "ready") initialiseDistributor(configurationId, openElementId);

    return () => {
      set.delete(setApp);
      if (set.size === 0) appListeners.delete(key);
    };
  }, [configurationId, key, openElementId, status]);

  const open = useCallback(() => {
    if (typeof window === "undefined") return false;
    const current = app ?? apps.get(key);
    if (current) {
      current.open();
      return true;
    }

    loadScript();
    if (scriptStatus === "ready") initialiseDistributor(configurationId, openElementId);
    return false;
  }, [app, configurationId, key, openElementId]);

  return { status: app ? "ready" : status, open, isReady: Boolean(app) };
};
