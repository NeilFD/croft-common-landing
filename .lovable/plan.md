## Why the editor and the Checks panel disagree

They aren't actually contradicting each other — they're showing two different points in time:

- **Edit Page SEO** counts what's in the form right now (your latest copy, including AI drafts).
- **Latest Test Results / Checks** is a frozen snapshot from the last audit run.

For `/town/drink`, the last audit ran at 13:56:53 against the built-in fallback strings (`"Drink | Crazy Bear Town"` = 23 chars, `"Bars at Crazy Bear Town. Mirrored rooms..."` = 64 chars), which is exactly what the WARN messages quote. The new copy you've drafted/saved hasn't been re-tested yet, so the Checks panel still shows the old counts.

Both sides already use the same thresholds (title 30–60, description 70–160) and read from the same `seo_pages` row, so the underlying logic is correctly linked. The fix is making sure a fresh audit always runs after a save.

## The fix: auto re-test on Save

When the editor's Save succeeds, immediately trigger a `seo-audit` run for that route, then refresh the Checks panel. The user gets one button, no stale data.

### Changes

**`src/pages/management/seo/SeoPageEditor.tsx`**
1. After the existing `save` mutation's `onSuccess`, chain into the existing `runAudit` mutation (or invoke `seo-audit` directly) for the current route — do not require a second click.
2. Show a single combined progress state on the Save button: `Saving…` → `Re-testing…` → `Saved`.
3. Invalidate both the page query and the latest-audit query so the Google preview, char hints, and Checks panel all reconcile in one render.
4. Add a small "Tested HH:MM:SS" line above the Checks card with a manual "Re-test" link (already wired) for cases where someone wants to retest without editing.

**`src/pages/management/seo/SeoDashboard.tsx`** (small follow-on)
- After the bulk AI review's "Save all" flow, fan-out the same auto re-test per saved route (sequentially, with the existing 8s pause), so bulk-saved pages don't sit on stale checks either.

### Out of scope

- No edge-function changes — `seo-audit/index.ts` already reads the saved row and uses the same 30/60/70/160 thresholds as the editor, so the linkage is correct.
- No DB schema changes.
- No change to the fallback dictionary.

### Verification

1. Open `/management/seo/page?route=/town/drink`, change the title, hit Save.
2. Confirm the button shows `Saving…` then `Re-testing…`, and within a few seconds the Checks panel updates to the new char counts and PASS/WARN states matching the editor's hints.
3. Confirm the "Last tested" stamp on the dashboard table updates for that row.
4. Run "AI complete every page" → review → Save all, and confirm each saved row's Checks panel reflects the new copy without manual re-tests.
