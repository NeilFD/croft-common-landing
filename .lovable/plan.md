## Receipt Upload — Anti-Fraud & Bear-Logo Verification

### Goals
- A receipt without a visible Crazy Bear logo is rejected. No data saved, no streak credit.
- Date and time must be present and parseable.
- The same image, the same receipt, or a photo of a screen can never count twice.

---

### What is wrong today

1. The OCR edge function (`supabase/functions/receipt-ocr/index.ts`) extracts `receipt_number`, `receipt_time`, `covers`, `venue_location`, `receipt_image_url` and writes them to `member_receipts` — but the live table only has `image_url`, `merchant_name`, `total_amount`, `currency`, `receipt_date`, `items`, `category`. Every save currently fails or silently drops fields. The duplicate check queries columns that do not exist.
2. There is no logo verification, no image hashing, no screen-of-screen detection, and no per-user lock.
3. Streak processing runs even when the receipt is junk.

---

### Plan

#### 1. Database — bring `member_receipts` up to spec

Migration to add the columns the system needs and a clean dedupe surface:

- `receipt_number text`
- `receipt_time time`
- `venue_location text`
- `covers integer`
- `raw_ocr_data jsonb`
- `processing_status text default 'completed'`
- `image_sha256 text` — SHA-256 of the uploaded image bytes
- `perceptual_hash text` — pHash for near-duplicate photos of the same receipt
- `bear_logo_detected boolean not null default false`
- `bear_logo_confidence numeric`
- `screen_capture_score numeric` — 0 (real paper) → 1 (definitely a screen)
- `rejection_reason text` (nullable, only on rejected logs)

Indexes / constraints:
- Unique partial index on `(image_sha256)` where not null — same file can never be uploaded twice by anyone.
- Unique partial index on `(receipt_number, receipt_date, receipt_time)` where `receipt_number is not null` — same till receipt cannot be re-used.
- Index on `(user_id, receipt_date)`.

New table `receipt_rejections` for the "hard reject + log" half of the trail (image url, user, reason, ai flags, created_at) so we can see repeat offenders without polluting `member_receipts`. RLS: user can read own; service role full access.

#### 2. Edge function — `receipt-ocr` rewrite (strict pipeline)

Pipeline, in order. Any failure short-circuits with a clear reason and writes a row to `receipt_rejections`.

```text
upload image
   ↓
hash image (sha256 + pHash)
   ↓
[A] image_sha256 already in member_receipts?  → reject "Already uploaded"
   ↓
[B] AI vision pass — strict JSON output:
       bear_logo_detected (bool)
       bear_logo_confidence (0..1)
       screen_capture_score (0..1)
       date, time, total, currency, merchant, receipt_number, items
   ↓
[C] bear_logo_detected == false OR confidence < 0.75
       → reject "No Crazy Bear logo found on receipt"
   ↓
[D] screen_capture_score > 0.6
       → reject "Looks like a photo of a screen, not a paper receipt"
   ↓
[E] date missing OR time missing OR date in future
       → reject "Receipt must show a valid date and time"
   ↓
[F] (receipt_number, date, time) already exists
       → reject "This receipt has already been uploaded"
   ↓
[G] Per-user rate limit: max 5 receipts/day, 30 sec cooldown
       → reject "Too many uploads, slow down"
   ↓
save member_receipts (with hashes + flags)
   ↓
insert ledger row
   ↓
trigger streak processing
```

Notes:
- Use Lovable AI Gateway with `google/gemini-2.5-pro` for the vision pass (strong multimodal, gives reliable structured output and logo detection). System prompt explicitly defines the bear mark and asks for a single JSON object via the AI SDK `Output` API.
- pHash: small Deno implementation (8x8 DCT); no extra deps required.
- All rejections return HTTP 422 with `{ reason, code }` so the client renders one clear, friendly message.
- Streak processing only runs if save succeeds.

#### 3. Reference image for the model

Add `src/assets/crazy-bear-mark.png` (already in repo) as a base64 reference attached to the vision prompt: "this is the Crazy Bear mark — only mark `bear_logo_detected: true` if you see this exact logo printed on the receipt".

#### 4. Frontend — `ReceiptUploadModal`

- Show a hard error state when the function returns 422, with the human reason from the server.
- Remove the "save anyway" path — there is no override.
- Step 2 ("Extract") becomes the single gate: if the AI rejects, the user lands back on step 1 with the reason explained.
- Add small note under the upload box: "We check for the Crazy Bear logo, the date and time. Photos of screens won't count."

#### 5. Hook cleanup

`useMemberData.ts` → `useMemberLedger` already aligned to current schema in the previous fix. After the migration, swap the field-mapping shim so `venue_location` reads from the real column instead of `merchant_name`.

#### 6. What this protects against

| Attack | Blocked by |
|---|---|
| Re-uploading the same photo | image_sha256 unique index |
| Light edit / re-crop of same receipt | pHash near-match check |
| Photo of a screen showing a real receipt | screen_capture_score gate |
| Generic / non-Crazy-Bear receipt | bear logo gate |
| Same till receipt by a different member | (receipt_number, date, time) unique index |
| Bulk uploads to farm streak | per-user daily cap + cooldown |
| Future-dated or missing date/time | step E gate |

---

### Out of scope (flag only, not in this plan)
- Admin moderation queue UI (rejections are logged but not yet shown anywhere).
- Backfilling hashes for any historical receipts.
- Geo / IP checks.

### Files touched
- `supabase/migrations/<new>.sql` — schema additions, indexes, `receipt_rejections` table + RLS
- `supabase/functions/receipt-ocr/index.ts` — full rewrite around the strict pipeline
- `supabase/functions/_shared/image-hash.ts` (new) — sha256 + pHash helpers
- `src/components/ReceiptUploadModal.tsx` — error surfacing, copy update
- `src/hooks/useMemberData.ts` — switch venue_location source after migration
