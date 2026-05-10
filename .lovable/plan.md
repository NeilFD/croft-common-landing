## Two issues to fix

### 1. Publish button stays disabled after editing hero text

**What's happening today**
- Saving "Refined Dining" inserts a draft row into `cms_content` with `published: false`. (Confirmed in console logs — the row is in the database.)
- When you go back to Preview, the page re-fetches and shows the draft — but it looks like the page reverts because the inline editor's local copy is wiped and `useCMSContent` only requests draft rows when `isEditMode` is true. So in Preview mode (edit off) it shows the published row, which is still empty/old, falling back to "Fine Dining".
- The Publish button is wired to `draftCount` from `useDraftContent`. The hook listens for the `draftContentChanged` window event to refetch. The event is dispatched, but the count isn't visibly updating in the header — most likely because `useEditMode()` is being called in `CMSVisual.tsx` outside its own `EditModeProvider`, which produces a stale/no-op context and means `pendingChanges` and refresh logic don't propagate cleanly.

**Fix**
- Move `useEditMode()` inside `EditModeProvider` in `src/pages/CMSVisual.tsx` (extract the publish/header section into a small inner component that sits beneath the provider).
- In `useDraftContent`, also refetch the count immediately after the insert/update returns (don't rely solely on the window event), by exposing `refreshDraftCount` and calling it from `CMSText.handleSave` via a context, OR (simpler) make `useDraftContent` re-run on every `draftContentChanged` event regardless of page filter — it already does, but add a `setDraftCount` optimistic bump so the button enables instantly.
- In `useCMSContent`, when in Preview (not edit mode) inside the visual editor, prefer the latest row (published OR draft) so the editor preview matches what the user just typed. Outside the visual editor (live site at /town/...) keep the current behaviour: published rows only.

Result: as soon as you save, the Publish button lights up, and switching to Preview shows your draft text instead of reverting.

### 2. Pink edit dots only appear on hero text, not on menu items

**Why**
- Menu items (Lamb Scrumpets, Crab Salad, prices, descriptions, section titles like "Small Plates", footer disclaimer) come from static data in `src/data/menus.ts` and are rendered as plain `<span>` / `<p>`. They are not wrapped in `<CMSText>`, so the CMS has nothing to attach a pink dot to.
- Only the four hero strings (eyebrow, title, subtitle, footer) were wired in the proof-of-concept pass.

**Fix**
Make every visible string on a `CBMenuPage` editable through `<CMSText>` when `cmsPage` is set. Specifically in `src/components/crazybear/CBMenuPage.tsx`:

- `Section` headers: title + optional subtitle  
  key pattern: `section.<slug>.title`, `section.<slug>.subtitle`  
- `Section` notes (text-only sections like "by request, see manager")  
  key: `section.<slug>.note`
- Each `Dish`: name, price, optional description, optional variant  
  key pattern: `item.<section-slug>.<item-slug>.name|price|desc|variant`

Slugs are derived from the existing menu data (lowercased, hyphenated) so they stay stable across edits. Fallbacks remain the values in `src/data/menus.ts`, so nothing changes visually until the user edits.

After this, in Edit Mode every dish name, price, description, section header, and the footer all show a pink dot and pop the inline editor on click.

### Scope of this pass
- Black Bear page only (proof end-to-end), same page that's already wired for hero edits.
- Once you confirm it works, the same one-line `cmsPage` prop will be added to BnB, Hom Thai, Cocktails, plus the room and event pages, in a follow-up pass.

### Files touched
- `src/pages/CMSVisual.tsx` (provider scoping)
- `src/hooks/useDraftContent.ts` (optimistic refresh)
- `src/hooks/useCMSContent.ts` (prefer latest in visual editor only)
- `src/components/crazybear/CBMenuPage.tsx` (wrap section + dish text in `CMSText` when `cmsPage` is set)

No database schema changes. No changes to the live site outside the visual editor preview.
