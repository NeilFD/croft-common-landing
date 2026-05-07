## Crazy Bear Spotify Player

A discreet, always-available music control styled in Crazy Bear language. No visible Spotify branding, no autoplay. Press play and the playlist starts (30 second previews for everyone, since this works without anyone needing to log in to Spotify).

### What you'll see

A small pill in the footer area:

- A spinning vinyl mark (uses our foreground colour) with a play / pause glyph in the centre
- Two lines of text in our own type:
  - `PRESS PLAY` / `NOW PLAYING` in `font-cb-mono` uppercase tracking
  - Playlist / track name in `font-cb-sans`
- No Spotify logo, no green, no embedded widget visible

The Spotify iframe itself is rendered off-screen (`sr-only`, `aria-hidden`) so it controls audio but is never seen.

### Files

1. New: `src/components/crazybear/CBSpotifyPlayer.tsx`
   - Loads Spotify's official IFrame API (`https://open.spotify.com/embed/iframe-api/v1`) once
   - Creates a hidden controller bound to playlist `5jryH9aMgkcQruOslKX7Fc`
   - Exposes a custom button that calls `controller.togglePlay()`
   - Listens to `playback_update` to flip between play / pause icon and the `PRESS PLAY` / `NOW PLAYING` label
   - Fetches the playlist's display title via Spotify's public oEmbed endpoint (no key needed) so the visible name stays in sync if you rename the playlist
   - All colours via design tokens (`text-foreground`, `bg-background`, `border-foreground/15`)

2. Edit: `src/components/crazybear/CBFooter.tsx`
   - Add `<CBSpotifyPlayer />` into the footer (top of the existing footer block) so it's available on every property page

3. Edit: `tailwind.config.ts`
   - Add a slow spin keyframe / animation utility `animate-spin-slow` (6s linear infinite) used by the vinyl icon when playing

### Honest limitations (Spotify rules, not ours)

- Without a logged-in Spotify Premium session in the visitor's browser, Spotify only allows ~30 second previews. The button still works, music still plays, but tracks fade after the preview window. This was the trade-off you picked over forcing every visitor to log in.
- If a visitor is already logged into Spotify Premium in the same browser, the embed will play full tracks for them automatically.

### Out of scope

- No track-by-track artist/title readout (the IFrame API only exposes playback state, not the current track metadata, so we show the playlist name instead of per-track info). If you want live track + artist text, that needs the Web Playback SDK + per-visitor Spotify login, which we agreed to skip.
