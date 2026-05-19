## /town/karaoke — Disco Enclave

A standalone visual world for karaoke, modelled on the `/pub` enclave but loud, glitzy and red. Single bold scrolling page with a mock booking flow built in. No backend yet — slot picker is a UI prototype that submits to a console + toast.

### Design language

- **Mood**: La Bodega Negra meets Studio 54. Velvet red, lacquered black, hot chrome, neon glow. Decadent, irreverent, after-hours.
- **Palette tokens** (scoped to `.karaoke-theme`):
  - `--kar-black` near-black `12 8% 6%`
  - `--kar-noir` lacquer `0 0% 9%`
  - `--kar-blood` Studio 54 red `354 78% 42%`
  - `--kar-neon` hot neon red `352 95% 56%`
  - `--kar-chrome` mirror silver `220 8% 82%`
  - `--kar-gold` brass accent `42 65% 58%`
  - `--kar-cream` off-white `36 28% 92%`
- **Type**: keep Bowlby One for slab headlines, Space Grotesk for body. Add a single condensed display accent (Bebas Neue) for marquee/ticker rows. Italic script reserved for one neon-sign moment.
- **Motion**:
  - Disco-ball loop in hero (slow rotating SVG mirror-ball + drifting light specks behind the type).
  - Marquee ticker bar ("TONIGHT • TONIGHT • TONIGHT") scrolling under the hero.
  - Neon flicker on the "BOOK YOUR SLOT" CTA (subtle, not seizure-y).
  - Section reveals on scroll (fade + slight rise), parallax on the chandelier and bar shelves photos.
  - Slot tiles have a press-down + glow on hover.
- **Header/footer**: scoped overrides — black header with red logo + cream menu text; black footer with cream text. Pub-style scoped, no global change.

### Page structure (single scroll)

1. **Hero** — full-bleed dancers/mirror-ball photo, rotating SVG disco-ball overlay, huge `KARAOKE` slab headline, kicker "Crazy Bear Town // After Dark", manifesto line, primary CTA → scrolls to booking. Step-in cue at bottom.
2. **Marquee ticker** — thin red band, condensed type scrolling: "Two-hour slots · Noon till eight · Bring your worst · No encores refused".
3. **The Room** — split: chandelier photo left, copy right. Three short stat blocks (capacity, slot length, song count).
4. **Neon manifesto** — neon-peep image as backdrop with a single short Bears Den line in cream + a red neon-styled sub-line. Pure mood.
5. **Back bar** — bar-shelves photo split with a tight drinks shortlist (4–6 signatures, price chips in gold).
6. **Book your slot** (the centrepiece) — described below.
7. **House rules** — 4 short staccato rules, numbered, on lacquer black.
8. **Closing** — full-bleed return to the disco photo, repeat CTA, end.

### Booking flow (mock)

A two-step picker rendered inline in the page (no separate route).

- **Step 1 — pick a day**: horizontal row of 7 day chips (today + 6). Active = filled red, others = chrome outline.
- **Step 2 — pick a slot**: 4 tiles for `12–2pm`, `2–4pm`, `4–6pm`, `6–8pm`. Each tile shows status badge: AVAILABLE / LAST FEW / GONE. Status is deterministic from day-index so it looks alive but is stable.
- **Step 3 — details**: name, email, party size (2–12), one optional message line. Submit button = neon "RESERVE THE BOOTH".
- **Submit**: client-side validation, console.log the payload, show a full-card success state ("Booth held. We'll be in touch.") with a "Book another" reset. No backend, no DB writes — explicitly mock per request.

### File plan

New:

- `src/styles/karaoke.css` — palette tokens, scoped header/footer overrides, marquee + flicker keyframes, disco-ball spin.
- `src/components/karaoke/KaraokeLayout.tsx` — wraps `.karaoke-theme`, mounts CSS, renders `Outlet` (future-proof for sub-pages).
- `src/components/karaoke/KaraokeHero.tsx` — hero + rotating SVG mirror-ball + headline.
- `src/components/karaoke/MarqueeTicker.tsx` — infinite scroll band.
- `src/components/karaoke/DiscoBall.tsx` — pure SVG/CSS mirror-ball used in hero and as decoration.
- `src/components/karaoke/RoomSection.tsx`, `NeonManifesto.tsx`, `BackBar.tsx`, `HouseRules.tsx`, `ClosingCTA.tsx`.
- `src/components/karaoke/BookingPanel.tsx` — the 3-step mock booking flow (local state, no network).
- `src/pages/karaoke/KaraokeHome.tsx` — composes the sections above.

Edited:

- `src/App.tsx` — change the `/town/karaoke` route to render the new `KaraokeLayout` + `KaraokeHome` (replacing the current `TownKaraoke` page). The old `TownKaraoke` export stays in `pages/property/index.tsx` untouched but no longer routed.
- `src/data/cmsPages.ts` — point the `town/karaoke` entry at the new page component so CMS editing still works.

Assets already on disk:

- `src/assets/karaoke/disco-1.jpg` (hero)
- `src/assets/karaoke/chandelier.jpg` (room)
- `src/assets/karaoke/neon-peep.jpg` (neon manifesto)
- `src/assets/karaoke/bar-shelves.jpg` (back bar)

### Copy direction (Bears Den voice)

Short. Staccato. Confident.

- Hero kicker: `CRAZY BEAR TOWN // AFTER DARK`
- Hero title: `KARAOKE`
- Hero manifesto: `Two hours. One booth. No shame.`
- Ticker: `TONIGHT · TONIGHT · TONIGHT · BRING YOUR WORST · NO ENCORES REFUSED`
- Room headline: `THE BOOTH`
- Neon line: `Sing like nobody's recording.`
- Booking headline: `BOOK YOUR SLOT`
- Submit success: `Booth held. We'll be in touch.`
- House rules: 4 lines, e.g. `01 Two hours, no more, no less.` / `02 Bring a crowd or bring nobody.` / `03 Drinks in. Phones down.` / `04 The bear has the last song.`  
  
  
Also, ensur ethat when navigated to, [https://open.spotify.com/track/33LC84JgLvK2KuW43MfaNq?si=b4a8b4cbf9c14dd1](https://open.spotify.com/track/33LC84JgLvK2KuW43MfaNq?si=b4a8b4cbf9c14dd1) this is teh playlist song playing for /karaoke  


### CMS

The page registers under the existing `town/karaoke` CMS slug. Hero photo, hero copy, ticker text, and house-rules lines are wired through `useCMSAssets` / `CMSText` so the page slots into the existing management system the same way the `/pub` enclave does. No new admin UI.

### Out of scope (call out)

- Real availability / database / payment — explicitly mocked.
- No new sub-routes (e.g. `/town/karaoke/songbook`) in this pass; layout is sub-page-ready if added later.
- The global Crazy Bear `CBTopNav` / `CBFooter` are not modified; the enclave only re-skins them locally via scoped CSS.