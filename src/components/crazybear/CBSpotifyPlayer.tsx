import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { useHideOnScrollDown } from "@/hooks/useHideOnScrollDown";

const AUTO_MINIMISE_ROUTES = ["/den/member/lunch-run"];

const PLAYLIST_ID = "5jryH9aMgkcQruOslKX7Fc";
const PLAYLIST_URL = `https://open.spotify.com/playlist/${PLAYLIST_ID}`;
const EMBED_SRC = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`;

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (IFrameAPI: unknown) => void;
    SpotifyIframeApi?: any;
  }
}

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
  </svg>
);

const VinylIcon = ({ spinning }: { spinning: boolean }) => (
  <svg
    viewBox="0 0 48 48"
    className={`h-9 w-9 ${spinning ? "animate-spin-slow" : ""}`}
    aria-hidden="true"
  >
    <circle cx="24" cy="24" r="22" fill="currentColor" />
    <circle cx="24" cy="24" r="16" fill="none" stroke="hsl(var(--background))" strokeWidth="0.5" opacity="0.35" />
    <circle cx="24" cy="24" r="11" fill="none" stroke="hsl(var(--background))" strokeWidth="0.5" opacity="0.35" />
    <circle cx="24" cy="24" r="6" fill="hsl(var(--background))" />
    <circle cx="24" cy="24" r="1.6" fill="currentColor" />
  </svg>
);

const CBSpotifyPlayer = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<any>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState<string>("Crazy Bear Sessions");

  useEffect(() => {
    let cancelled = false;
    fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(PLAYLIST_URL)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.title) setPlaylistTitle(data.title);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let timeoutId: number | undefined;

    const init = () => {
      const IFrameAPI = window.SpotifyIframeApi;
      if (!IFrameAPI || !containerRef.current) return;
      const element = containerRef.current.querySelector("[data-spotify-embed]");
      if (!element) return;
      try {
        IFrameAPI.createController(
          element,
          {
            uri: `spotify:playlist:${PLAYLIST_ID}`,
            width: "100%",
            height: "80",
          },
          (EmbedController: any) => {
            controllerRef.current = EmbedController;
            setReady(true);
            setFailed(false);
            EmbedController.addListener("playback_update", (e: any) => {
              if (e?.data) setIsPlaying(!e.data.isPaused);
            });
            EmbedController.addListener("ready", () => setReady(true));
          }
        );
      } catch (err) {
        console.error("Spotify embed init failed", err);
        setFailed(true);
      }
    };

    if (window.SpotifyIframeApi) {
      init();
    } else {
      window.onSpotifyIframeApiReady = (IFrameAPI: unknown) => {
        window.SpotifyIframeApi = IFrameAPI;
        init();
      };
      const existing = document.querySelector(
        'script[src="https://open.spotify.com/embed/iframe-api/v1"]'
      );
      if (!existing) {
        const s = document.createElement("script");
        s.src = "https://open.spotify.com/embed/iframe-api/v1";
        s.async = true;
        s.onerror = () => {
          console.warn("Spotify iframe API failed to load");
          setFailed(true);
        };
        document.body.appendChild(s);
      }
    }

    // Fallback: if the controller never becomes ready (script blocked,
    // tracking-protection on Windows browsers, etc.), surface a direct link.
    timeoutId = window.setTimeout(() => {
      if (!controllerRef.current) setFailed(true);
    }, 6000);

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      try {
        controllerRef.current?.destroy?.();
      } catch {
        /* noop */
      }
    };
  }, []);

  const toggle = () => {
    try {
      controllerRef.current?.togglePlay?.();
    } catch (err) {
      console.error("Spotify togglePlay failed", err);
      setFailed(true);
    }
  };

  const hidden = useHideOnScrollDown();

  return (
    <div
      className={`fixed bottom-6 right-3 md:right-6 z-50 transition-transform duration-300 ease-out motion-reduce:transition-none ${
        hidden ? 'translate-x-[140%] motion-reduce:translate-x-0' : 'translate-x-0'
      }`}
      aria-hidden={hidden}
    >
      <div className="group inline-flex items-center gap-3 rounded-full border border-white/15 bg-black/85 pl-2 pr-4 py-2 text-white shadow-2xl backdrop-blur-md">
        {failed ? (
          <a
            href={PLAYLIST_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open Crazy Bear Sessions on Spotify"
            className="flex items-center gap-3"
          >
            <span className="relative flex items-center justify-center text-white">
              <VinylIcon spinning={false} />
              <span className="absolute inset-0 flex items-center justify-center text-black">
                <PlayIcon />
              </span>
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="font-cb-mono text-[9px] tracking-[0.3em] uppercase opacity-70">
                Open in Spotify
              </span>
              <span className="font-cb-sans text-sm tracking-wide max-w-[180px] truncate">
                {playlistTitle}
              </span>
            </span>
          </a>
        ) : (
          <button
            type="button"
            onClick={toggle}
            disabled={!ready}
            aria-label={isPlaying ? "Pause Crazy Bear Sessions" : "Play Crazy Bear Sessions"}
            className="flex items-center gap-3 transition-opacity disabled:opacity-50"
          >
            <span className="relative flex items-center justify-center text-white">
              <VinylIcon spinning={isPlaying} />
              <span className="absolute inset-0 flex items-center justify-center text-black">
                {isPlaying ? <PauseIcon /> : <PlayIcon />}
              </span>
            </span>
            <span className="hidden sm:flex flex-col items-start leading-tight">
              <span className="font-cb-mono text-[9px] tracking-[0.3em] uppercase opacity-70">
                {ready ? (isPlaying ? "Now Playing" : "Press Play") : "Loading"}
              </span>
              <span className="font-cb-sans text-sm tracking-wide max-w-[180px] truncate">
                {playlistTitle}
              </span>
            </span>
          </button>
        )}
        <div
          ref={containerRef}
          aria-hidden="true"
          style={{
            position: "absolute",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <div data-spotify-embed />
        </div>
        <noscript>
          <iframe
            title="Crazy Bear Sessions"
            src={EMBED_SRC}
            width="0"
            height="0"
            style={{ position: "absolute", left: "-9999px" }}
          />
        </noscript>
      </div>
    </div>
  );
};

export default CBSpotifyPlayer;
