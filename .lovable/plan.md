## Goal

Make the **header (PropertyNavShell)** and **footer (CBFooter)** fully tinted to the scope colour while the user is inside `/town` or `/country`:

- `/town` → header + footer background = **Red Inferno `#4E0000`**
- `/country` → header + footer background = **Abyssal Teal `#063F47`**

Global shell, `/`, `/karaoke`, `/house-rules`, Crazy Bear pages stay pure black/white.

## Approach (CSS-only, no component rewrites)

Both components currently hardcode `bg-black text-white`. CBFooter is shared by every page, so we cannot just change the className. Instead, override via property-scope CSS in `src/index.css` — same pattern as the existing 3px accent strip.

### Token updates

- `--cb-town-accent` → `0 100% 15%` (#4E0000, exact)
- `--cb-town-accent-soft` → `0 100% 11%` (deeper companion for hover)
- `--cb-country-accent` → `189 85% 15%` (#063F47, exact, replaces Pesto)
- `--cb-country-accent-soft` → `189 85% 11%`

### New scope rules

```css
/* Header */
[data-property="town"] nav.sticky.bg-black,
[data-property="country"] nav.sticky.bg-black {
  background: hsl(var(--cb-accent)) !important;
  border-bottom-color: hsl(0 0% 100% / 0.15) !important;
}
/* Mobile menu drawer + dropdown panels inside the header */
[data-property] nav .bg-black { background: hsl(var(--cb-accent)) !important; }
[data-property] .fixed.inset-0.bg-black { background: hsl(var(--cb-accent)) !important; }

/* Footer */
[data-property] footer.bg-black {
  background: hsl(var(--cb-accent)) !important;
}
```

The existing 3px top accent strip becomes redundant against a fully-tinted header — remove it (or keep as a white hairline for separation; I'll keep it as a thin white 1px line above the nav for crispness).

Hover states inside the header that currently flip to `bg-white text-black` stay as-is — white-on-red and white-on-teal read fine and give a nice inverted hit state.

### Footer link hover

Currently footer link hover uses `--cb-accent-on-dark` (Gold for Town, Copper for Country). On a Red Inferno background, gold still reads. On Abyssal Teal, copper still reads. Leaving both.

### Hairlines

Current rule sets footer top border to 3px in `--cb-accent`. With the whole footer now in that colour, switch the top border to `hsl(0 0% 100% / 0.2)` 1px so it separates cleanly from the page content above (which may be on white).

## Files touched

- `src/index.css` — 4 token value updates + ~6 new scope overrides + tweak existing footer border rule. No component edits.
- `mem://design/brand-2026` + `mem://index.md` Core line — record Country accent = Abyssal Teal `#063F47`, Town accent = Red Inferno `#4E0000`, and that header+footer take the full accent fill inside `[data-property]` scopes.

## Things I'm explicitly NOT touching

- CBFooter.tsx / PropertyNavShell.tsx markup
- Global shell, landing, karaoke, house-rules, Crazy Bear pages
- Body type, hero imagery, button copy, gold/copper secondary accents

## Risk note

CBFooter is rendered on many pages. The override is gated by `[data-property]`, so it only activates inside Town/Country subtrees — no bleed elsewhere. I'll spot-check `/town`, `/country`, `/`, `/karaoke`, and a Crazy Bear page after applying.