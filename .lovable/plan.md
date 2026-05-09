# Comments + Reactions for Moments

Add a threaded comment system under each moment, with emoji reactions on individual comments. Sleek, minimal, on-brand (B&W, Space Grotesk / Archivo Black, no rounded chrome).

## Database

Two new tables, RLS enabled, realtime on both.

`**moment_comments**`

- `id`, `moment_id` → `member_moments.id` (cascade), `user_id`, `parent_id` (nullable, self-ref → threading), `body` (text, 1–500 chars), `is_deleted` (bool), `created_at`, `updated_at`
- Indexes: `(moment_id, created_at)`, `(parent_id)`
- RLS:
  - SELECT: any authenticated member
  - INSERT: `auth.uid() = user_id`
  - UPDATE: own row only, body editable for 15 min, otherwise soft-delete via `is_deleted`
  - DELETE: own row only (soft delete preferred via UPDATE)

`**moment_comment_reactions**`

- `id`, `comment_id` → `moment_comments.id` (cascade), `user_id`, `emoji` (text, allow-list: ❤️ 🔥 😂 👏 🐻 ✨), `created_at`
- Unique `(comment_id, user_id, emoji)` so each user toggles one of each
- RLS: SELECT authenticated; INSERT/DELETE own only

Realtime: add both tables to `supabase_realtime` publication.

## Hook

New `useMomentComments(momentId)`:

- Fetches flat list, joins `profiles` for name, aggregates reactions (`{emoji, count, mine}[]`).
- Builds tree client-side (parent → children, sorted oldest-first; replies collapsed by default beyond 2).
- Mutations: `addComment(body, parentId?)`, `editComment`, `deleteComment`, `toggleReaction(commentId, emoji)`.
- Subscribes to realtime INSERT/UPDATE/DELETE on both tables filtered by `moment_id` and refreshes optimistically.

## UI

Comments live inside the existing **detail modal** (`MemberMomentsMosaic` selectedMoment view), below the info bar. Mosaic cards stay image-only; a small comment count chip sits next to the like button on the card overlay.

**Detail modal layout** (already dark, full-bleed):

```text
┌──────────────────────────────────────────┐
│ MOMENT                          [CLOSE]  │
├──────────────────────────────────────────┤
│                                          │
│            full-bleed image              │
│                                          │
├──────────────────────────────────────────┤
│ tagline                       ♥ 3   💬 7 │
│ [tag] [tag]                              │
│ NAME · 09 MAY 2026                       │
├──────────────────────────────────────────┤
│ COMMENTS · 7                             │
│                                          │
│  NAME · 2H                               │
│  Body text here, short, sharp.           │
│  ❤️ 3   🔥 1   + react   reply           │
│    └ NAME · 1H                           │
│      Reply body.                         │
│      + react   reply                     │
│                                          │
│  [ View 4 more replies ]                 │
│                                          │
│ ──────────────────────────────────────── │
│ > Type a comment...              [POST]  │
└──────────────────────────────────────────┘
```

Styling rules:

- Mono micro-labels (`text-[10px] tracking-[0.4em] uppercase`) for meta (NAME · time, COMMENTS count, POST button).
- Body in Space Grotesk, white on black, `text-sm` leading-snug.
- Threads indicated by a 1px white/15 vertical rule on the left of the reply block, indented 16px on mobile / 24px on desktop. Max 2 levels of indent; deeper replies stay at level 2 with `↳ @parent` prefix.
- Reactions: small inline chips, `h-6 px-2 border border-white/20 font-mono text-[10px]`, emoji + count. Mine = solid white bg, black text. Tap toggles. "+ react" opens a tiny inline picker (the 6 allow-listed emoji, no full picker).
- Composer: bottom-fixed inside the scrollable info column, transparent input with bottom border only, white "POST" button (mono, tracked). Reply mode shows a small "Replying to NAME · cancel" pill above the input.
- Edit/delete: own comments show a `…` chevron revealing Edit / Delete (mono links). Soft-deleted comments render as `[ deleted ]` placeholder so threads don't collapse.
- Empty state: `Be first. Say something.`
- Loading: 3 skeleton rows with white/5 bars.
- Char counter `0/500` mono, bottom-right of composer when focused.

Mobile (390px): info bar + comments scroll as one column under the image; image area shrinks (`max-h-[55vh]`) when comments present so the composer is reachable. Composer sticks to the bottom of the modal with `safe-area-inset-bottom` padding.

## Card chip

In the mosaic overlay, next to the heart, add a non-interactive comment count chip (`💬 N`) that simply opens the detail modal on tap (same as tapping the card). Hidden when count is 0.

## Moderation

- Reuse existing `moderate-moment-upload` pattern only for image moderation.
- For comments, do a lightweight client-side guard: trim, max 500, block empty / >5 consecutive newlines / known slur list (small JSON in `src/lib/commentFilter.ts`). Server-side: a Postgres `BEFORE INSERT` trigger trims and rejects empty bodies. No AI text moderation in v1 (keep it fast); flag-for-review can come later.  
  
  
Also add ability to post videos, no more than 30s long, and, the video thumbnail must be playing from launch, the movement looks super cool in a wall environment

## Out of scope (v1)

- Notifications (push / email) when replied to.
- @-mentions, links/markdown, image attachments in comments.
- Admin moderation queue.
- Pagination — load all comments per moment (assume <200; revisit if hot).

## Files touched

- New migration: `moment_comments`, `moment_comment_reactions`, RLS, indexes, realtime publication.
- New hook: `src/hooks/useMomentComments.ts`.
- New components:
  - `src/components/moments/MomentComments.tsx` (list + tree)
  - `src/components/moments/MomentCommentItem.tsx` (single node, recursive)
  - `src/components/moments/MomentCommentComposer.tsx`
  - `src/components/moments/MomentReactionBar.tsx`
- Edit `src/components/MemberMomentsMosaic.tsx`: render `<MomentComments momentId={selectedMoment.id} />` in detail modal; add comment count chip on card overlay.
- Edit `src/hooks/useMemberMoments.ts`: include `comment_count` aggregate in fetch.

## Acceptance

- Member can post, reply, edit (15 min), and soft-delete own comments.
- Reactions toggle live for everyone via realtime.
- Detail modal scrolls cleanly on mobile with composer always reachable.
- Mosaic card shows live comment count next to like count.
- All UI uses existing tokens — no rounded chrome, no coloured borders, no lucide-style noise beyond the already-allowed set.