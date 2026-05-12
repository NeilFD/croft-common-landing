## What it currently is

The "Crazy Bear Country" hero title uses Tailwind's `font-serif` class, which in `tailwind.config.ts` is mapped to **Playfair Display** (Georgia fallback). That's the elegant serif you're seeing on /country, /country/parties, etc.

It is used in 5 places, all property pages:

- `src/components/property/PropertyPage.tsx` (the big H1 hero title)
- `src/components/property/CBGallery.tsx` (gallery section title)
- `src/components/property/PropertyNavShell.tsx` (nav wordmark + mobile menu title)

So yes, it appears consistently across both Town and Country property pages.

## Proposed change

Repoint the `serif` font family to Bungee so every existing `font-serif` usage flips to Bungee with no per-component edits.

In `tailwind.config.ts`:

```ts
'serif': ['"Bungee"', 'Georgia', 'serif'],
```

Bungee is already loaded from Google Fonts (added in the previous step), so no extra `<link>` work is needed.

## Heads-up before I build

Bungee is an all-caps, blocky, sign-painter style. Switching `font-serif` to Bungee will hit:

1. The huge "Crazy Bear Country" / "Crazy Bear Town" hero H1 (the one in your screenshot)
2. Gallery section titles
3. The "Crazy Bear Country" wordmark next to the bear logo in the top nav
4. The mobile menu page-name display

That's a big visual shift, especially the nav wordmark, which currently reads as a refined serif. It will become chunky block caps everywhere serif is used.

If you want it on hero titles only and not the nav wordmark, I can instead replace `font-serif` with `font-display` (which is already Bungee) on just the H1s and leave the nav wordmark alone. Tell me which you prefer and I'll build it.

## Files to edit (option A — repoint serif globally)

- `tailwind.config.ts` — change the `serif` family to Bungee
- No other code changes; no new font loads
