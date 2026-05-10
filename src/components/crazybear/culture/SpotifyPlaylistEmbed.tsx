import { useMemo } from "react";

interface Props {
  /** Spotify share URL or playlist id */
  url: string;
  title?: string;
}

const extractPlaylistId = (raw: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Already an id
  if (/^[a-zA-Z0-9]{16,}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/playlist[/:]([a-zA-Z0-9]+)/);
  return m?.[1] ?? null;
};

const SpotifyPlaylistEmbed = ({ url, title = "Playlist" }: Props) => {
  const id = useMemo(() => extractPlaylistId(url), [url]);
  if (!id) {
    return (
      <div className="aspect-[4/1] w-full grid place-items-center bg-foreground/5 border border-foreground/10 rounded-lg">
        <p className="font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60">
          Add a Spotify playlist URL
        </p>
      </div>
    );
  }
  return (
    <iframe
      title={title}
      src={`https://open.spotify.com/embed/playlist/${id}?utm_source=generator&theme=0`}
      width="100%"
      height="380"
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className="rounded-xl border border-foreground/10"
    />
  );
};

export default SpotifyPlaylistEmbed;
