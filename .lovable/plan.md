# Enable removing carousel images on default-backed slots

## Problem

In `/management/cms/images` → Town Home → carousel, the slot is showing **"Using bundled defaults"**. Bundled defaults come from `cmsImageRegistry` (code), not the database, so the per-tile delete button and reorder buttons are hidden (`AssetsManager.tsx` lines 321-353 gate on `!isDefault`).

Today, to remove one slide you'd have to upload 11 replacements first. No good.

## Fix

Add a one-click **"Customise slides"** action on any slot that is currently rendering bundled defaults. It seeds the DB with the bundled defaults as draft rows, after which all existing controls (delete, reorder, alt text, publish) work normally.

### Changes

**`src/components/cms/AssetsManager.tsx`**

1. Add a `seedDefaultsAsDrafts(slot)` helper that inserts one `cms_images` row per `slot.defaults` entry with `is_draft: true`, `published: false`, preserving order via `sort_order`.
2. In the `SlotEditor` header, when `showingDefaults` is true and `slot.kind !== "hero"` (carousel/gallery), render a **"Customise slides"** button next to Add. Clicking it seeds drafts then refreshes — the grid immediately shows the same 11 images but now with delete + reorder controls.
3. Also surface a per-tile **Remove** button on default tiles: clicking it first seeds defaults as drafts, then deletes the chosen draft row in one flow (so the user can just hit the bin on slide #7 without thinking about seeding).
4. After seeding, the existing **Publish** button (already visible when drafts exist) commits the new shorter list live. No new publish plumbing needed.

### Out of scope

- No DB migration — `cms_images` already supports everything.
- No changes to the public `/town` carousel renderer — it already prefers DB rows over bundled defaults.
- Hero slots (single image) untouched — `Replace` already covers that case.

### User flow on /town carousel

1. Open CMS → Assets → Town Home.
2. Click the bin on any slide (or "Customise slides" first) → drafts get seeded, that slide is removed.
3. Optionally reorder / delete more.
4. Click **Publish** on the slot → live `/town` carousel updates.
