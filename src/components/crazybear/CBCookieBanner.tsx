import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCookieConsent } from "@/hooks/useCookieConsent";

/**
 * Lightweight cookie consent banner.
 * - Hidden when a choice has been recorded in localStorage.
 * - Reappears when the Cookies policy page calls `openCookiePreferences`.
 * - Solid black background (no transparency), B&W, Bears Den voice.
 */
const CBCookieBanner = () => {
  const { status, accept, reject } = useCookieConsent();
  const [mounted, setMounted] = useState(false);

  // Delay the first paint slightly so we don't flash above other UI on hard
  // refreshes, and so it doesn't fight the Spotify player or floating CTAs.
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 400);
    return () => window.clearTimeout(t);
  }, []);

  if (!mounted || status !== null) return null;

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:left-4 sm:right-auto sm:max-w-md sm:px-0"
    >
      <div className="bg-black text-white border border-white/20 shadow-xl">
        <div className="px-5 pt-5 pb-2">
          <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-70">
            Cookies
          </p>
          <p className="mt-3 font-cb-sans text-sm leading-relaxed opacity-90">
            We use essential cookies to make the site work, and optional ones
            for analytics and embeds (Spotify, video, social). Your call.
          </p>
          <Link
            to="/cookies"
            className="mt-3 inline-block font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-70 hover:opacity-100 underline-offset-4 hover:underline"
          >
            Read the policy
          </Link>
        </div>
        <div className="flex border-t border-white/15">
          <button
            type="button"
            onClick={reject}
            className="flex-1 px-5 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-80 hover:opacity-100 border-r border-white/15 hover:bg-white/5 transition-colors"
          >
            Reject non-essential
          </button>
          <button
            type="button"
            onClick={accept}
            className="flex-1 px-5 py-4 font-cb-mono text-[10px] tracking-[0.4em] uppercase bg-white text-black hover:bg-white/90 transition-colors"
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
};

export default CBCookieBanner;
