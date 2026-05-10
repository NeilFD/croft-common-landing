## What "Canonical URL" actually checks

Lighthouse's `canonical` audit looks at the rendered HTML and fails when:

1. There is no `<link rel="canonical">` at all, **or**
2. There are **multiple** `<link rel="canonical">` tags pointing to different URLs ("conflicting canonical URLs").

It is failing on every page because of (2), not (1).

## Root cause

`index.html` ships with a hard-coded canonical:

```html
<link rel="canonical" href="https://www.crazybear.dev/" />
```

That tag is in the static HTML for every route on the site. Then, after React mounts, `CBSeo` (and a few page-level components like `About.tsx`, `CulturePage.tsx`, `EnhancedMetaTags.tsx`) inject a second `<link rel="canonical">` via react-helmet pointing at the actual route, e.g. `https://www.crazybear.dev/country/events/weddings`.

Lighthouse runs after JS executes, sees two canonicals with different `href` values, and reports "Document does not have a valid rel=canonical — Multiple conflicting URLs". Hence every page fails the same check with the same severity.

## Fix

Single-line change in `index.html`: delete the static canonical tag. Every route already injects its own correct canonical through `CBSeo` (or the page-specific Helmet block), so removing the static one leaves exactly one canonical per page, matching the live URL.

### Files to change

- `index.html` — remove line 11 (`<link rel="canonical" href="https://www.crazybear.dev/" />`).

### Verification

After the change:

1. View source on `/` — should still have a canonical (injected by CBSeo on the home page) pointing to `https://www.crazybear.dev/`.
2. View source on `/country/events/weddings` — should have a single canonical pointing to that URL.
3. Re-run the SEO audit from the management dashboard. The Canonical URL check should flip from fail to pass across all pages. Other Lighthouse checks (image-alt, heading-order, etc.) are independent and unaffected.

### Out of scope (intentionally)

- No changes to `CBSeo`, `EnhancedMetaTags`, `About.tsx`, or `CulturePage.tsx`. They already emit the correct per-route canonical; the duplication came entirely from the static tag.
- No edge-function changes. The audit logic is correct; it was reporting a real defect.
