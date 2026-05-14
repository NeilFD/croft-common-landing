# Redirects audit — Crazy Bear

Frances's point 4: any URL that changes needs a 301-equivalent so SEO
authority transfers and external links don't break.

## This round (structural SEO + nav refactor)

**No public URLs changed.** The work was additive: a single global nav
overlay, footer site map, on-page sections that scroll to in-page anchors
(`/#stay`, `/#eat-drink`, etc.), and JSON-LD additions.

| From | To | Status |
|------|----|--------|
| (none) | (none) | No redirects required this round |

## Existing redirects already in router

For reference, the React router already declares these client-side
redirects (`<Route ... element={<Navigate to="..." replace />} />`):

- `/admin/*` → `/management/admin`
- `/admin/member-analytics` → `/management/admin/member-analytics`
- `/admin/member-analytics-legacy` → `/management/admin/member-analytics-legacy`
- `/cms/*` → `/management/cms`
- `/cms/login` → `/management/login`
- `/cms/kitchens` → `/management/cms/kitchens`
- `/cms/faq/:page` → `/management/cms/faq/:page`
- `/cms/visual/:page/*` → `/management/cms/visual/:page`
- `/research` → `/management/research`
- `/common-room` → `/den`
- `/common-room/main` → `/den/main`
- `/common-room/member` → `/den/member`
- `/common-room/member/lunch-run` → `/den/member/lunch-run`
- `/common-room/member/ledger` → `/den/member/ledger`
- `/common-room/member/profile` → `/den/member/profile`
- `/common-room/member/dashboard` → `/den/member/dashboard`
- `/common-room/member/moments` → `/den/member/moments`
- `/CroftCommonDate&Time`, `/CroftCommonDateTime`, `/croftcommondatetime` → `/croft-common-datetime`
- `/country/members`, `/town/members` → `/members`
- `/den/member/gold` → `/den/member/profile`

## Process for future URL changes

1. Before changing any path, add an entry to the table below.
2. Add a `<Route path="/old" element={<Navigate to="/new" replace />} />`
   in `src/App.tsx` so equity transfers and bookmarks survive.
3. Update `public/sitemap.xml` to drop the old path and add the new one.
4. Tell Frances so she can mirror at the DNS / live-site layer.

## Pending changes (none)

| From | To | Reason | Owner | Date |
|------|----|--------|-------|------|
| | | | | |
