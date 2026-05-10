## New hero — /town/culture

Replace the current Town Culture hero (`cb-hero-town-new.jpg`) with the moody bar-counter shot you just uploaded (low-angle blue velvet stools, candlelight bokeh, polished bartop reflections). Perfect "Town. After dark." energy.

### Steps

1. Copy the upload to `src/assets/cb-town-culture-hero.jpg`.
2. In `src/components/crazybear/culture/CulturePage.tsx`, swap the `townHero` import to the new asset so the `TOWN.hero` fallback uses it.
3. Register a `town-culture / hero` slot in `src/data/cmsImageRegistry.ts` with this image as the bundled default, so the Assets CMS lists it and admins can replace it later via the standard image picker.

### Result

- Live `/town/culture`: new hero shows immediately, headline + tagline overlay unchanged.
- CMS visual editor: hero remains swappable per usual; no DB rows needed unless someone overrides it.
- Country Culture untouched.
