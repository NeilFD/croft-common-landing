## Route-aware Spotify playlist switching

Make the global `CBSpotifyPlayer` swap playlists based on the current route, smoothly, without tearing down the iframe or interrupting the listener more than necessary.

### Playlist mapping

- Default (everywhere else): `5jryH9aMgkcQruOslKX7Fc` (Crazy Bear Sessions, current default)
- `/country` and any sub-route: `4KCZQ5fOj3UauK3pTWDZo7`
- `/town` and any sub-route: `7jx5ZtdeZmTP4PfSk6oRL1`

### Behaviour

- On route change, resolve the target playlist from the pathname.
- If it differs from the currently loaded playlist, call the Spotify IFrame controller's `loadUri('spotify:playlist:<id>')` to swap content in place. This avoids destroying the iframe (no flash, no hard stop) and continues using the same controller instance.
- If the user was already playing, immediately call `play()` after `loadUri` so the new playlist starts without requiring a click. If they were paused, leave it paused.
- Update the displayed playlist title by re-fetching Spotify's oEmbed for the new playlist URL so the label under the vinyl matches.
- Update the `PLAYLIST_URL` used by the fallback `<a>` link (when the embed fails) to point at the active playlist.
- Keep all existing behaviour: auto-minimise on `/den/member/lunch-run`, hide-on-scroll, vinyl spin while playing, expand/collapse chevron.

### Technical notes (single file change)

File: `src/components/crazybear/CBSpotifyPlayer.tsx`

- Replace the single `PLAYLIST_ID` constant with a `getPlaylistIdForPath(pathname)` helper and a `PLAYLISTS` map: `{ default, country, town }`.
- Derive `activePlaylistId` from `useLocation().pathname` via `useMemo`.
- Keep a `loadedPlaylistIdRef` to know what the controller currently holds. In a `useEffect` keyed on `[activePlaylistId, ready]`:
  - If `controllerRef.current` exists and `loadedPlaylistIdRef.current !== activePlaylistId`, call `controllerRef.current.loadUri(\`spotify:playlist:${activePlaylistId}\`)`, set the ref, and if `isPlaying` was true, call `controllerRef.current.play()` (wrapped in try/catch).
- Move the oEmbed title fetch into an effect keyed on `activePlaylistId` so the label updates on swap.
- Update the failure-mode `<a href>` and `aria-label` to use the active playlist URL/title.
- Initial `createController` keeps using the resolved initial playlist (so first paint matches the route the user lands on).

No other files need editing. No DB or backend changes.
