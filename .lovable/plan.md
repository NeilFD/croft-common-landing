## Goal

Upgrade the admin pages for **Events** (`/whats-on`), **Journal** (blog), and **Stories from the Bear** from bare text/URL forms into a proper content studio: rich editor, drag-and-drop image uploads, full SEO control, and AI assist for blog drafting (length-controlled, British English, no em dashes).  
  
This capability needs to be in the CMS systems, page for these pages please!!!!!!!!

The public pages already exist; this is about giving editors the tools to produce world-class content and surfacing every new field on the live site.

## What editors will get

For each of the three content types:

- Clean two-column editor: content on the left, sidebar on the right (Status, Site, Schedule, SEO, Hero image).
- Hero image **upload** (drag-and-drop or click), with replace and remove. No more pasting URLs.
- Inline image uploads inside body content (paste, drop, or toolbar button).
- Rich-text editor: H2/H3, bold, italic, lists, quotes, links, inline images. Markdown shortcuts.
- **Subtitle** field on events (currently missing) and short **excerpt** on all three.
- **SEO panel**: SEO title, meta description (with character counters), social share image (defaults to hero), canonical override.
- Draft / Publish toggle plus scheduled publish date.
- Live preview link that opens the public route.

Events also keep: start/end datetimes, Town/Country/Both, optional external ticket URL.

Journal also gets: author, tags, reading-time estimate (auto-calculated, editable).

Stories also gets: gallery (additional images shown in detail view).

## AI assist (Journal only, per request)

A "Write with AI" panel in the Journal editor:

- Inputs: working title, angle/notes, **target length** (choose either word count or "minutes to read"), tone (default: Bear's Den voice — short, staccato, confident).
- Output is inserted as a **draft into the editor** — editor still chooses what to keep. Never auto-publishes.
- Hard rules enforced in the system prompt and post-processed server-side:
  - British English spellings only (organise, colour, theatre, etc.).
  - No em dashes or double hyphens anywhere in the output. Server strips any that slip through and replaces with a comma or full stop.
  - No emoji.
  - Honour the requested length within ±10%.
- Powered by Lovable AI gateway (default `google/gemini-2.5-flash`, upgrade button for `openai/gpt-5` on long pieces). No API key needed.
- Same panel exposes "Rewrite selection", "Tighten", "Expand to N words", "Suggest SEO title + meta".

## Public-page wiring

- `/whats-on` cards: show subtitle + use new SEO image if no poster set.
- `/journal` and `/journal/:slug`: render hero, excerpt, body as rich HTML, reading time, tags, per-route `<title>`/meta/OG from SEO fields via existing `CBSeo`.
- `/bears-den` stories rail and `/stories/:slug`: render hero, gallery, body, SEO meta.

No layout overhaul, just feeding the existing components the fuller data.

## Technical notes

**Schema additions** (one migration, additive only — existing data unaffected):

- `cb_events`: `subtitle text`, `excerpt text`, `seo_title text`, `seo_description text`, `og_image_url text`.
- `cb_journal_posts`: `subtitle text`, `seo_title text`, `seo_description text`, `og_image_url text`, `reading_minutes int`.
- `cb_stories`: `subtitle text`, `gallery_urls text[] not null default '{}'`, `seo_title text`, `seo_description text`, `og_image_url text`.

**Storage**: new public bucket `cb-content` for hero/poster/inline/gallery images. Read = public. Write = `has_management_role(admin|super_admin)`. Same policy shape as existing admin tables.

**Rich editor**: TipTap (`@tiptap/react`, starter-kit, image, link, placeholder). Stored as sanitised HTML in the existing `body` column. Markdown-style shortcuts (`##`, `**`, `>`) for fast typing.

**AI edge function**: new `cb-journal-ai-write`. Accepts `{ mode: 'draft' | 'rewrite' | 'tighten' | 'expand' | 'seo', input, targetWords?, targetMinutes?, tone? }`. Calls Lovable AI gateway with a strict system prompt; post-processes output to scrub em dashes / Americanisms before returning. JWT-verified, admin-only.

**Shared admin components** (new, under `src/admin/components/content/`):

- `ContentEditor.tsx` — two-column shell.
- `RichTextEditor.tsx` — TipTap wrapper with image upload.
- `ImageDropzone.tsx` — drag/drop to `cb-content` bucket.
- `SeoFields.tsx` — title/description/OG with counters.
- `AiAssistPanel.tsx` — Journal-only.

`EventsPage.tsx`, `JournalPage.tsx`, `StoriesPage.tsx` are rewritten to use these but keep their list/delete affordances.

## Out of scope (call out, don't build)

- Page-builder style block system on the public pages (the existing layouts are kept).
- Versioning/revision history for posts.
- Translations.

These can be follow-ups if wanted.

## Open questions

1. **Reading-time AI** — happy with auto-estimate (200 wpm) shown editable, or want the AI to set it?
2. **AI scope** — should AI assist also be enabled for Events and Stories (description/synopsis only), or strictly Journal as written?
3. **Social image generation** — when no OG image is uploaded, fall back to the hero; would you also want a "generate social card" button later?

I'll proceed with: auto reading-time (editable), Journal-only AI, hero-as-OG fallback — unless you say otherwise.