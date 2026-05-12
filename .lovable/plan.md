## Goal
Replace the single hero image on `/` with `Crazy-Bear-Hero.mp4`, looping silently, optimised for fast load.

## 1. Encode the video (done in sandbox via ffmpeg)

Source: 1920x1080, 30fps, 17.07s, H.264 4.84 Mbps, AAC stereo, 9.9 MB.

Produce four files into `public/video/`:

| File | Purpose | Target |
|---|---|---|
| `crazy-bear-hero.mp4` | Desktop, Safari/iOS fallback | H.264 High, CRF 26, preset slow, no audio, +faststart, ~2.5 MB |
| `crazy-bear-hero.webm` | Chrome/Firefox/Edge primary | VP9, CRF 33, no audio, ~1.8 MB |
| `crazy-bear-hero-720.mp4` | Mobile (<=768px) | 1280x720, CRF 28, no audio, +faststart, ~1.2 MB |
| `crazy-bear-hero-poster.jpg` | LCP paint + `poster` | First frame, q82, ~80 KB |

All files stripped of audio (hero must be muted to autoplay) and fast-start flagged so playback begins before download completes.

## 2. New component: `HeroVideo`

Create `src/components/HeroVideo.tsx`:
- `<video autoplay muted loop playsinline preload="metadata" poster="...">` with `<source>` tags for WebM, mobile MP4 (via `media="(max-width: 768px)"`), and desktop MP4 fallback.
- Full-bleed, `object-cover`, identical positioning to current hero image.
- Reuses existing overlay children: `MenuButton`, `CroftLogo`, `ArrowBox`, `BookFloatingButton`.
- `prefers-reduced-motion: reduce` -> render the poster image only, no video element.

## 3. Swap on `/`

`src/components/HeroSection.tsx`: render `<HeroVideo />` instead of `<HeroCarousel />`. `HeroCarousel` stays in the codebase (used elsewhere).

## 4. CMS integration (per project rule: every new page/asset must be CMS-editable)

Add a new CMS visual slot so the hero video can be swapped without code:
- Page: `index`, slot: `main_hero_video`
- Fields: `webm_url`, `mp4_url`, `mp4_mobile_url`, `poster_url`
- `HeroVideo` reads from this slot via the existing CMS hook, falling back to the bundled files in `public/video/`.
- Surface the slot in the CMS Visual editor (same pattern as current `main_hero` images).

## 5. Verification
- Render the encoded files, confirm sizes and that they are seekable / faststart.
- Load `/` in preview, confirm autoplay + loop + no audio + poster paints first.
- Check network tab: only one of webm/mp4 is fetched per browser, mobile variant served at narrow viewport.

## Technical notes
- ffmpeg commands used:
  - MP4: `ffmpeg -i in.mp4 -an -c:v libx264 -preset slow -crf 26 -pix_fmt yuv420p -movflags +faststart out.mp4`
  - WebM: `ffmpeg -i in.mp4 -an -c:v libvpx-vp9 -crf 33 -b:v 0 -row-mt 1 out.webm`
  - 720: `ffmpeg -i in.mp4 -an -vf scale=1280:720 -c:v libx264 -preset slow -crf 28 -movflags +faststart out-720.mp4`
  - Poster: `ffmpeg -i in.mp4 -frames:v 1 -q:v 3 poster.jpg`
- No new npm dependencies.
- No backend/DB changes beyond the CMS slot record (handled by existing CMS visual table).
