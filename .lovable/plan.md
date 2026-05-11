## Goal

Swap the site-wide display font from **Archivo Black** to **Bricolage Grotesque**. Single token change - no churn across the 87 files using `font-display`.

## Changes

1. **`tailwind.config.ts`** - replace the `display` font stack with Bricolage Grotesque (Archivo kept as fallback during font load).

2. **`index.html`** - drop `Archivo+Black` from both Google Fonts URLs (preload `<link>` and `<noscript>` fallback). Bricolage is already loaded.

3. **`src/pages/Landing.tsx`** - revert the inline `style={{ fontFamily: ... }}` and `font-extrabold` test override on the H1 back to plain `className="font-display ..."` so it picks up the new token like everything else.

4. **`src/index.css`** - add a default `font-weight: 700` (or 800 if it reads better) on `.font-display` since Bricolage at default 400 is lighter than Archivo Black. Decide on the final weight after eyeballing the landing hero and a couple of section headings.

5. **`mem://style/visual-identity`** + **`mem://index.md` Core line** - update typography note from "Archivo Black headings" to "Bricolage Grotesque headings".

## QA after

Spot-check landing H1, About hero, a Culture page heading, footer eyebrows. Adjust the default `.font-display` weight in `index.css` if anything reads too light.