## Goal

Lock down the 5 critical Supabase findings without breaking any existing feature. All current behaviour (moments showing names, CMS pages loading, space management, mailchimp sync, admin tables) keeps working.

## Approach

The codebase already uses two implicit "admin" signals:
1. Email domain in `public.allowed_domains` (used by `member-analytics`, `advanced-analytics`, etc. to gate admin tools).
2. Service role key (used by every edge function that mutates CMS, subscribers, properties, etc.).

I'll formalise (1) with a `SECURITY DEFINER` function `public.is_admin(uid)` and use it in RLS. Service-role calls bypass RLS so all edge functions keep working untouched.

For `profiles`, the app needs other members' first/last names (moments feed, comments, pong leaderboard). I'll keep that working via a sanitised view that excludes phone, birthday, email.

---

## 1. `profiles` — stop public PII exposure

- New view `public.profiles_public` with `security_invoker=on` exposing only `user_id, first_name, last_name, avatar_url`.
- Replace SELECT policy on `profiles` so only the owner (or an admin) can read the full row.
- Update three client hooks to query `profiles_public` instead of `profiles` for cross-user lookups:
  - `src/hooks/useMemberMoments.ts` (lines 86-89, plus the `profiles!inner(...)` join at 117-124 — refetch likers via separate `profiles_public` query and stitch in JS, same pattern as the comments hook).
  - `src/hooks/useMomentComments.ts` (line 142-145).
  - `src/hooks/usePongHighScores.ts` (line 47-51).
  - `src/admin/components/DeliveriesTable.tsx` (line 63-66) — admin tool, but switching to the view keeps it consistent and still returns the names it needs.
- `useFullProfile.ts` keeps using `profiles` directly — it only ever reads/writes `auth.uid()`'s own row, which the new policy still allows.

## 2. `member_profiles_extended` and `moment_likes` — restrict public read

- Change SELECT policy on both from `{public}` to `{authenticated}` (`USING (true)` on authenticated role). The app only ever reads them from signed-in member screens.

## 3. `subscribers` — stop authenticated mass export

- Drop the "viewable by authenticated users" policy.
- Add: owner can SELECT their own row by email match (`auth.email() = email`).
- Add: admins (via `is_admin()`) can SELECT all rows — keeps `DeliveriesTable` admin UI working.
- All edge functions use service role, unaffected.

## 4. `allowed_domains` — enable RLS

- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
- Add a SELECT policy for admins only (most reads are done by service-role edge functions which bypass RLS, and by the `SECURITY DEFINER` function `is_email_domain_allowed` which also bypasses).
- No public/anon access at all.

## 5. CMS / venue / property / spaces / bedrooms — admin-only writes

For each of `cms_content, cms_global_content, cms_images, fb_venues, spaces, properties, bedrooms`:
- Keep the existing public/anon SELECT policy (the site is public-facing).
- Replace the broad `ALL to authenticated USING (true)` policy with three policies (INSERT / UPDATE / DELETE) that all check `public.is_admin(auth.uid())`.
- Result: only signed-in users with an `@allowed_domains` email can mutate CMS/venue data. All current admin/CMS UIs are accessed by exactly those users today.

## 6. Helper function

```sql
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.allowed_domains d
      on split_part(u.email, '@', 2) = d.domain
    where u.id = uid
  )
$$;
```

This mirrors the email-domain check already used by admin edge functions.

---

## What changes for users

- **Members**: no visible change. Names still appear on moments, comments, leaderboard. Their own profile screen still works.
- **Admins / staff (allowed-domain emails)**: no change. CMS editing, space management, deliveries table, subscriber views all continue to work.
- **Anonymous visitors**: still see public CMS pages, venue listings, properties; can no longer scrape phone numbers / birthdays / subscriber lists / member like history.

## Files touched

- New migration (one file) implementing all SQL above.
- `src/hooks/useMemberMoments.ts`
- `src/hooks/useMomentComments.ts`
- `src/hooks/usePongHighScores.ts`
- `src/admin/components/DeliveriesTable.tsx`

No edge functions need changes (they use service role).
