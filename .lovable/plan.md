## Status today

- `scripts/check-cms-registry.ts` passes: 82 entries, 75 routes. Every public route in `src/App.tsx` is either in `CMS_PAGES` or excluded. (The "stale" warnings are a known false positive: nested property routes like `/country/pub` are declared as relative `<Route path="pub">` under `/country`, so the regex doesn't match — they are wired up correctly.)
- All Town / Country property pages already pass `cmsPage="…"` to `PropertyPage`, so hero + body + FAQs are editable.
- Country event pages I added (`/country/dogs`, `/country/pub-quiz`, `/country/cinema-nights`, `/country/outdoor-feasts`) also pass `cmsPage`, so hero text is editable.
- The new root-level pages I added (Privacy, Terms, Cookies, Press, Contact, Careers, Treatments, Merch, Gallery, FAQ, Journal) are in the **registry** but their body copy is **hardcoded** — currently you can't edit the text through the visual editor.

So: registry-complete, but several pages need their copy wired to `CMSText` before they are truly editable.

## What to change

### 1. Upgrade `CBStaticPage` to be CMS-aware

Add an optional `cmsPage` prop. When set, render hero `eyebrow`, `title`, `intro` through `<CMSText page={cmsPage} section="hero" contentKey="…" fallback={…} />` — same pattern `PropertyPage` already uses. No change for pages that don't pass `cmsPage`.

### 2. Make body copy editable on every static page

Replace hardcoded headings and paragraphs with `<CMSText>` blocks keyed by stable `section` / `contentKey`. One pass per page, fallbacks set to today's copy so nothing visibly changes until an editor saves new content.

Pages to convert (all under `src/pages/crazybear/`):

| Route          | cmsPage slug    | Notes |
|----------------|-----------------|-------|
| `/privacy`     | `privacy`       | 9 sections of policy text |
| `/terms`       | `terms`         | 10 numbered clauses |
| `/cookies`     | `cookies`       | Policy + cookie table intro |
| `/press`       | `press`         | Intro + contact block |
| `/contact`     | `contact`       | Two property contact cards |
| `/careers`     | `careers`       | Intro + roles list |
| `/treatments`  | `treatments`    | Stadhampton + Beaconsfield blocks |
| `/merch`       | `merch`         | Intro + item descriptions |
| `/gallery`     | `gallery`       | Intro + social CTA |
| `/faq`         | `faq`           | Hero only (FAQ items stay in `cbFaqs` / FAQ CMS) |
| `/journal`     | `journal`       | Hero only (posts via `cb_journal_posts` admin) |
| `/journal/:slug` | n/a           | Content comes from DB post |
| `/whats-on`    | `whats-on`      | Hero + intro |
| `/gift-vouchers` | `gift-vouchers` | Hero + product blurbs |
| `/bears-den`   | `bears-den`     | Hero + benefit list |
| `/curious`     | `curious`       | Hero + intro |

Pages intentionally **not** wired (excluded from editable copy):

- `/set-password` — auth flow
- `/stories`, `/stories/:slug` — already DB-driven
- `/den/*` member pages — app UI, not marketing copy
- `/management/*`, `/admin/*` — internal
- Redirects and `/manage-event/:token`, `/check-in`, `/calendar`, `/unsubscribe`, `/branding`, `/push-setup`, `/croft-common-datetime`, `/book`, `/event-enquiry` — transactional / form / utility pages

### 3. Verify

- Run `bun run scripts/check-cms-registry.ts` — should still pass.
- Open each converted page in the visual editor (`/cms/visual?page=<slug>`) and confirm hero + body text appear as editable blocks.
- Spot-check that fallbacks render identically on the live page when no `cms_content` row exists.

## Technical details

- `cms_content` table already supports arbitrary `(page, section, content_key)` triples — no DB migration needed.
- `CMSText` already handles both edit-mode editing and live-site published reads. We're only adding new keys.
- Convention: one `section` per logical block on a page (`hero`, `intro`, `clause-1`, `clause-2`, … or `card-stadhampton`, `card-beaconsfield`), `contentKey` for the field (`title`, `body`, `eyebrow`).
- Keep all existing copy verbatim as the `fallback`, so behaviour is unchanged until someone edits.

## Out of scope

- No new DB tables, edge functions, or auth changes.
- No changes to property pages — they're already wired.
- Not refactoring `scripts/check-cms-registry.ts` to resolve nested-route false positives (cosmetic warning only).
- Not adding new admin tooling for the Journal / FAQs — those CMS surfaces already exist.
