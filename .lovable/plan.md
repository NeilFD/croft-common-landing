## Goal

Add an AI copy generator to the CMS visual editor so any text block can be auto-written in the Bears Den tone of voice, with page/section/property context baked in.

## Where it lives

Inside the existing edit popover in `src/components/cms/CMSText.tsx` (the floating panel that opens when an editor clicks a `<CMSText>` element). A small "✨ Generate with AI" button sits under the textarea, alongside Save/Cancel.  
  
I think teh editing popover needs to be a much bigger popver so the text is easily readable

## How context is built (automatic — no user input required)

Every `<CMSText>` already knows:

- `page` (e.g. `country/dogs`, `privacy`, `bears-den`)
- `section` (e.g. `hero`, `about`, `clause-3`)
- `contentKey` (e.g. `title`, `body`, `eyebrow`)
- `fallback` (the current/original copy — great seed for rewrites)

We derive extra context from `src/data/cmsPages.ts` (CMS_PAGES_BY_SLUG) which gives:

- Human page title (e.g. "Dogs")
- Property (`town` | `country` | none) — used to set venue voice
- Section type guess (hero/body/CTA/legal) from `section` + `contentKey`

The edit popover also adds an optional one-line "extra brief" input so editors can nudge the output ("mention the log fire", "skew funny", etc.) — empty is fine.

## Backend

Extend the existing `supabase/functions/marketing-ai-assist/index.ts` (it already loads the Bears Den voice prompt and channel hints from `marketing_settings`) with a new `cms_copy` action:

```
action: "cms_copy"
payload: { page, section, contentKey, pageTitle, property, currentText, brief, kind }
```

`kind` is derived client-side: `title` | `eyebrow` | `intro` | `body` | `cta` | `legal` — drives length/format rules in the prompt (titles ≤ 6 words, eyebrows ALL CAPS short, body 2-3 short paragraphs, CTAs ≤ 4 words, legal = plain factual British English, no flourish).

The prompt uses the existing `voice_prompt` (Bears Den TOV) loaded from the DB, plus a CMS-specific system addition: British English only, no em dashes, no $, never invent prices/facts, never use the term "membership tiers", keep brand voice consistent with property (Town = urban/edgy; Country = countryside/log-fire).

Returns `{ text }`. No DB writes — the editor decides whether to keep it.

## Frontend flow

1. Editor clicks text → popover opens (existing).
2. Optional one-line brief input + ✨ Generate button.
3. Button calls `supabase.functions.invoke('marketing-ai-assist', { body: { action: 'cms_copy', ... } })`.
4. While loading: spinner on button, textarea disabled.
5. On success: replace `editValue` with returned text (editor can tweak, then Save as normal draft — existing publish flow unchanged).
6. A small "Regenerate" link lets them roll again; "Undo" reverts to pre-AI value (stored in a ref).
7. Errors (429 rate limit, 402 credits) surface via the existing toast pattern.

## Files touched

- `supabase/functions/marketing-ai-assist/index.ts` — add `cms_copy` action + kind-aware prompt builder.
- `src/components/cms/CMSText.tsx` — add brief input, Generate/Regenerate/Undo buttons, loading state, invoke call.
- `src/data/cmsPages.ts` — (read only) used for human title + property lookup; add a small helper `getCmsPageContext(slug)` if not already there.

## Not in scope

- No new DB tables, no migrations, no auth changes.
- No bulk "generate for whole page" mode (can be a follow-up).
- No image/asset generation — text only.
- No changes to publish/draft flow — AI output is just pre-filled editor text.

## Why this works

Reuses the existing `marketing-ai-assist` edge function and its DB-loaded Bears Den voice, so any future tone tweaks made in Marketing Settings automatically apply to CMS generation too. Single source of truth for TOV.