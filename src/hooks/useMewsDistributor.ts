import { useCallback, useEffect, useState } from "react";

/**
 * Loads the Mews distributor script once per page and exposes an `open()`
 * helper that mounts the booking widget for a given configuration id.
 *
 * Mews docs: https://help.mews.com/s/article/setup-the-booking-engine
 * The script registers a global `Mews.Distributor` that takes an array of
 * configuration ids and renders an in-page booking widget.
 */

const SCRIPT_SRC = "https://app.mews.com/distributor/distributor.min.js";
const SCRIPT_ID = "cb-mews-distributor";

declare global {
  interface Window {
    Mews?: {
      Distributor?: (options: {
        configurationIds: string[];
        openElementId?: string;
      }) => { open: () => void };
    };
  }
}

type Status = "idle" | "loading" | "ready" | "error";

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

export const useMewsDistributor = () => {
  const [status, setLocalStatus] = useState<Status>(scriptStatus);

  useEffect(() => {
    listeners.add(setLocalStatus);
    loadScript();
    return () => {
      listeners.delete(setLocalStatus);
    };
  }, []);

  const open = useCallback(
    (configurationId: string, openElementId: string) => {
      if (typeof window === "undefined") return false;
      const Distributor = window.Mews?.Distributor;
      if (!Distributor) return false;
      try {
        const instance = Distributor({
          configurationIds: [configurationId],
          openElementId,
        });
        instance.open();
        return true;
      } catch (err) {
        console.warn("[Mews] failed to open distributor", err);
        return false;
      }
    },
    [],
  );

  return { status, open };
};
