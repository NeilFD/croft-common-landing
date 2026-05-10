## Goal

Make the FAQs that already render at the bottom of every CMS-wired page (`/town`, `/country`, `/town/rooms`, BnB, Hom Thai, Cocktails, etc.) fully editable from the visual editor, exactly like body copy:

- Pink-dot edit indicator on each question and answer
- Inline edit > save as draft > Publish
- Add a new FAQ at the bottom of any list
- Remove an existing FAQ
- Reorder by drag-and-drop (consistent with the carousel reordering we just shipped)
- A matching "FAQs" panel in the CMS sidebar for bulk management per page

The current state: FAQs come from a static file (`src/data/cbFaqs.ts`) and render via `CBFAQ`. A `cms_faq_content` table exists but is empty and not wired to the live site. We'll close that loop.

## How it will work for the user

1. Open any page in the visual editor.
2. Scroll to the FAQ section. Every question and every answer shows a pink dot exactly like the hero copy. Click to edit, blur to save as draft.
3. Below the last FAQ in CMS mode, an "Add question" button appends a new draft FAQ.
4. Each FAQ in CMS mode shows a small drag handle and a delete (bin) button.
5. Hit the global Publish button (top right). Text drafts, image drafts and FAQ drafts all publish together.
6. Live site continues to read published rows only; if a page has no rows it falls back to the bundled `cbFaqs.ts` defaults so nothing ever goes blank.

## Technical plan

### 1. Database (migration)

Extend `cms_faq_content` to mirror the draft model used by `cms_images`:

- Add `is_draft boolean default false`
- Add `updated_at timestamptz default now()` with the existing `update_updated_at_column` trigger
- Add admin RLS for INSERT / UPDATE / DELETE (currently only public SELECT exists). Reuse `is_admin(auth.uid())` like the other CMS tables.
- Index on `(page, published, is_draft, sort_order)`

No data seeding. The static `cbFaqs.ts` stays as the fallback so unedited pages keep working.

### 2. New hook: `useCMSFaqs(page, { mode })`

- `mode = "live"` (default): returns published rows only; if none, returns the entries from `cbFaqs[page]` so the live site is never empty.
- `mode = "cms"`: returns `drafts ∪ published` merged the same way as `useCMSAssets` (drafts win), plus an `isDraft` flag per item so the editor can style differently.
- Exposes mutation helpers: `addFaq`, `updateFaq(id, patch)`, `removeFaq(id)`, `reorder(orderedIds)`, `discardDrafts()`, `publish()`.
- Publish behaviour matches images: delete published rows for the page, flip drafts to `published=true, is_draft=false`.

### 3. Refactor `CBFAQ`

- Accept either the existing `faqs` prop (for non-CMS callers / fallback) or a `cmsPage` prop.
- When `cmsPage` is set, internally call `useCMSFaqs(cmsPage)` and ignore the `faqs` prop.
- Wrap each question and answer in `CMSText` with stable keys: `faq.<id>.question` and `faq.<id>.answer`. (Saved through the same `cms_content` channel? No — better: save the question/answer fields directly on the `cms_faq_content` row to keep one source of truth. `CMSText` becomes a thin inline-edit primitive that takes `value` + `onSave` so it can target either store.)
- In CMS mode only, render: drag handle on the left of each `AccordionItem`, a delete button on the right, and an "Add question" button below the accordion.
- Drag-and-drop uses the same native HTML5 pattern as the AssetsManager.

### 4. Wire into existing pages

- `src/components/property/PropertyPage.tsx` and `src/pages/property/index.tsx`: where they currently do `<CBFAQ faqs={faqEntry.faqs} title={faqEntry.title} />`, switch to `<CBFAQ cmsPage={cmsPage} fallbackFaqs={faqEntry.faqs} title={faqEntry.title} />` so the live site falls back to bundled defaults until a page has its own rows.
- Same swap on the standalone pages that render `CBFAQ` directly: `Index.tsx`, `Beer.tsx`, `Cafe.tsx`, `Kitchens.tsx`, `Hall.tsx`, `Cocktails.tsx`.

### 5. Publish flow integration

- `useDraftContent` (the hook backing the global Publish button) already tracks text and image drafts. Add a third channel: query `cms_faq_content` for rows where `is_draft = true`, group by page, and on Publish run the same flip-and-delete as images. Surface FAQ drafts in the same "X drafts pending" badge.

### 6. Sidebar "FAQs" panel

- Replace the unused `FAQManager.tsx` content with a new panel that uses `useCMSFaqs(page, { mode: "cms" })`.
- Page selector (same component as the Assets panel), then a list of FAQs with inline edit, drag-to-reorder, delete, add, discard drafts, publish.

### 7. Out of scope

- No changes to `CBStructuredData` JSON-LD beyond reading from the same merged FAQ list on the server-rendered/initial paint path.
- No AI generation.
- No new icons outside the set already used in the editor.

## File touch list

- `supabase/migrations/<new>.sql` — schema + RLS
- `src/hooks/useCMSFaqs.ts` — new
- `src/components/seo/CBFAQ.tsx` — add `cmsPage` mode, drag/add/delete UI
- `src/components/cms/CMSText.tsx` — small extension so it can save to an arbitrary store (or a new `CMSInlineText` sibling, decided during implementation)
- `src/hooks/useDraftContent.ts` — count + publish FAQ drafts
- `src/components/cms/FAQManager.tsx` — rebuild on top of `useCMSFaqs`
- `src/components/cms/CMSDashboard.tsx` — surface the FAQs panel in the sidebar
- `src/components/property/PropertyPage.tsx`, `src/pages/property/index.tsx`, `src/pages/{Index,Beer,Cafe,Kitchens,Hall,Cocktails}.tsx` — pass `cmsPage` + `fallbackFaqs` to `CBFAQ`
