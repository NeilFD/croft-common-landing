## Root cause (found)

The site is in an **infinite redirect loop** on `crazybeartest.com`. Every page load reboots the whole React app, re-fetches the heavy Google Fonts CSS, re-parses the JS bundle, etc. On mobile this looks exactly like "won't load / takes ages".

Proof from the live network log on `https://www.crazybeartest.com/?nocache=1`:

- 6+ separate `Document` requests for `crazybeartest.com/?nocache=1` in a single page load
- 6+ duplicate fetches of `index-Dr-8O5TY.js`, `index-BgOVAm_b.css`, `manifest.json`, `~flock.js`, `brand/logo.png`
- `Task Duration: 6.14s`, `Documents: 7`, `JS Heap: 5.2MB` from re-mounting the app repeatedly

The loop is caused by two layers fighting each other:

1. **Cloudflare/edge** rule sends `www.crazybeartest.com` → `crazybeartest.com` (302). Confirmed: `curl -I https://www.crazybeartest.com/` returns `302 Location: https://crazybeartest.com/`.
2. **`index.html` bootstrap script** (lines 117-124) does the opposite: when host is the apex (`crazybeartest.com`), it calls `location.replace('https://www.crazybeartest.com' + path)`.

Result: `www → 302 → apex → JS redirect → www → 302 → apex → ...` until Safari finally gives up or the user does. That is why "two hours ago it was fine" — a recent DNS/edge change flipped the canonical direction and the in-page JS still believes the old direction.

Croft Common (`croftcommontest.com`) is fine because its edge sends apex → www, matching the bootstrap.

## Fix (one tiny change, proper, no workarounds)

Edit the canonicalisation block in `index.html` so it agrees with what the edge is actually doing:

- Croft Common: keep `apex → www` (matches edge).
- Crazy Bear: flip to `www → apex` (matches the new edge rule), or simply skip canonicalisation for the Bear hosts and let Cloudflare do it once at the edge.

Recommended: **skip JS canonicalisation for the Bear hosts entirely.** Cloudflare already does it in a single 302; the JS layer is redundant and the source of the loop. For Croft, leave the existing behaviour unchanged.

## Secondary cleanup (same edit pass, all real wins, no fluff)

While we are in `index.html`:

1. **Drop the unused Google Font families.** The `<link>` currently loads Playfair Display, Inter, Oswald, Work Sans, Archivo, Archivo Black, Space Grotesk and Space Mono — eight families, all weights. Brand only uses **Space Grotesk** + **Archivo Black** (per project memory). Cutting the rest removes ~6 render-blocking woff2 downloads on first paint.
2. **Remove the `localhost`-only `window.open` debug shim** (lines 46-61). Dead in production.
3. **Keep `<link rel="manifest">`** — the live site returns `200` for `/manifest.json`, so no 401 problem on the Bear domain. No change needed.

That is the whole fix. No new service worker, no route changes, no nav/branding changes, no removal of `CBSpotifyPlayer`/`GlobalHandlers` (they were never the cause — the app was just being booted six times in a row).

## Verification after publish

1. `curl -I https://www.crazybeartest.com/` should still 302 to apex (edge), but the apex response should no longer redirect back.
2. Re-run the mobile performance profile — expect a single Document request, single JS bundle, single CSS, FCP back under 2s on 4G.
3. Hard-close Safari, reopen `https://www.crazybeartest.com` — should land on the Crazy Bear hero immediately.

## Files touched

- `index.html` — bootstrap canonicalisation block + Google Fonts `<link>` + remove debug shim.

Nothing else.
