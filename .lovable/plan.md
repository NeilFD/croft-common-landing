# Brand 2026 — Phase 2 continuation

Carry on from the foundation already shipped (tokens, scoping, hero carousels, first TOV pass). This pass pushes the property palettes into header/footer chrome and deeper page sections, with strict contrast rules.

## 1. Branded chrome inside property scope

Global shell stays pure B&W. Only within `[data-property="town"]` / `[data-property="country"]` do header + footer pick up brand accents.

**Header (CBHeader / property nav):**

- Thin top accent bar (2px) using property accent token.
- Underline-on-hover for nav links in accent colour.
- Active route gets an accent serif underline (Instrument Serif).
- Logo lockup unchanged (B&W).

**Footer (CBFooter wrapper only — do not touch CBFooter internals beyond a scoped accent layer):**

- Top hairline rule in accent.
- Section headings get a small accent square bullet.
- Social/utility links hover in accent.
- Background stays near-black; copy stays off-white. Accent used only for rules, bullets, hover, and one signature line.

## 2. Contrast rules (hard constraints)

Red Inferno on near-black fails WCAG. Rules:

- **Town Red Inferno**: never as body text on `bg-background` (dark). Allowed on light surfaces, as 2–4px rules, icons, fills, or behind white text.
- On dark backgrounds in Town, use **Gold** or **Warm Off-White** for text accents; reserve Red for shape/line/fill.
- **Country Pesto / Copper**: usable as text on dark, but min size 14px and weight ≥500.
- Add `--accent-on-dark` token per property that resolves to the safe variant (Gold for Town, Copper for Country) so components don't have to branch.

## 3. Section-level accent rollout

- Town pages: CTA buttons (filled accent, white text), divider rules, accordion chevrons, eyebrow labels, price tags, form focus state (no ring — accent underline + bg tint per project rule).
- Country pages: same component set, Pesto/Copper tokens.
- Add `PropertyAccentBar` to top of each major section break.
- Insert one `PullQuoteSerif` per long-form page (Town hero intro, Country Rooms intro, Journal article body).

## 4. TOV pass — round 2

Sweep remaining property pages, room pages, Journal, FAQs, booking confirmation copy. Strip banned words (indulgent, hedonistic, hidden gem, unforgettable, decadent as adjective, luxury escape, vibrant atmosphere, exclusive destination, "fear not", "we got you covered"). Keep "Decadent" only as the structural room tier name until rename decision.

## 5. Imagery

Continue interleaving deck frames already in `src/assets/brand-2026/` into Town/Country secondary sections (Rooms, Eat & Drink, Journal cards). No new sourcing this pass.

## Files touched (technical)

- `src/index.css` — add `--accent-on-dark` per scope, focus styles, hairline utility.
- `src/components/layout/CBHeader.tsx` (or property header wrapper) — scoped accent bar + nav hover.
- `src/components/layout/CBFooter.tsx` — only via a scoped overlay layer; do not restructure markup (footer-cbfooter-only rule).
- `src/components/property/PropertyPage.tsx` — section accent bars, CTA variant.
- `src/pages/pub/PubHome.tsx`, `src/pages/property/*` — apply accent buttons, dividers, pull quotes.
- New: `src/components/brand2026/AccentButton.tsx`, `AccentRule.tsx`.
- TOV edits across `src/data/*` content files and any property page copy still using banned words.

## Out of scope (this pass)

- Global nav/footer outside property scope.
- Karaoke page and `/house-rules` (locked).
- "Decadent" room rename (still awaiting your call).
- New photography sourcing.

## Open question

Do you want the **accent bar at the very top of the header** (above logo) or **as an underline beneath the header** (between header and page)? Both work; first is louder, second is more editorial.  
  
whatever is best.