# Migrate crazybear.dev → crazybear.app

The QR scan failure proves the issue: wallet passes encode `https://www.crazybear.dev/den/verify?m=...`, that host no longer resolves, so the scan dies. The same root cause is hiding inside auth emails, SEO canonicals, sitemaps, JSON-LD, edge functions and a couple of legacy `crazybeartest.com` shims. This plan replaces all of them.

## 1. Single source of truth

Right now the canonical site URL is duplicated as string literals in ~10 files. Introduce one constant and import it everywhere.

- `src/lib/siteUrl.ts` → `export const SITE_URL = "https://www.crazybear.app"; export const SITE_HOST = "crazybear.app";`
- Edge-function equivalent in `supabase/functions/_shared/site.ts` (Deno can't import from `src/`).

Then refactor the hardcoded literals below to use these constants so this never drifts again.

## 2. Frontend (client) changes


| File                                               | What changes                                                                                                                                                  |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `index.html`                                       | OG/Twitter `og:image`, `og:url`, `twitter:image` → `crazybear.app`. Remove/replace the `crazybeartest.com` redirect shim block entirely (it's dead code now). |
| `src/components/seo/CBSeo.tsx`                     | `SITE` constant → `https://www.crazybear.app` (drives every canonical + JSON-LD on the site).                                                                 |
| `src/components/crazybear/culture/CulturePage.tsx` | Two hardcoded canonicals → `crazybear.app`.                                                                                                                   |
| `src/components/crazybear/CBMemberLoginModal.tsx`  | `redirectTo` for magic link → `https://www.crazybear.app/set-password`.                                                                                       |
| `src/components/crazybear/CBSubscriptionForm.tsx`  | `emailRedirectTo` → `https://www.crazybear.app/set-password`.                                                                                                 |
| `src/components/marketing/ChannelPreview.tsx`      | Display label `notify.crazybear.dev` → `notify.crazybear.app` (cosmetic, but matches the new sender).                                                         |
| `src/pages/Privacy.tsx`                            | Body copy "data controller for crazybear.dev" and fallback email `privacy@crazybear.dev` → `.app`.                                                            |
| `src/pages/crazybear/Terms.tsx`                    | Body copy reference → `.app`.                                                                                                                                 |
| `src/pages/crazybear/Contact.tsx`                  | `town@` / `country@crazybear.dev` mailtos and fallbacks → `.app`.                                                                                             |
| `src/pages/crazybear/Careers.tsx`                  | `careers@crazybear.dev` mailto + fallback → `.app`.                                                                                                           |
| `src/pages/crazybear/Press.tsx`                    | `press@crazybear.dev` mailto + fallback → `.app`.                                                                                                             |


Note on enquiry pages: `neil.fincham-dukes@crazybear.co.uk` and `jen.needham@crazybear.co.uk` are real corporate addresses on a different domain — leave untouched.

## 3. SEO / crawler assets

- `public/sitemap.xml` — every `<loc>` (≈55 URLs) → `https://www.crazybear.app/...`.
- `public/robots.txt` — `Sitemap:` line → `crazybear.app/sitemap.xml`.
- `scripts/prerender.ts` and `scripts/verify-prerender.ts` — `SITE`/`BASE` default → `crazybear.app`.
- `docs/redirects.md` — log the host change so Frances can mirror at DNS.

## 4. Edge functions (the bit causing today's QR failure)


| Function                    | Change                                                                                                                                                     |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `create-cb-wallet-pass`     | Logo fetch URLs, `WEBSITE`/`CONTACT` back fields, **and the QR `message` URL `https://www.crazybear.app/den/verify?m=...**` → `.app`. This fixes the scan. |
| `create-cinema-wallet-pass` | Same logo + website fields → `.app`.                                                                                                                       |
| `receipt-ocr`               | `REF_LOGO_URL` → `.app`.                                                                                                                                   |
| `seo-audit`                 | `SITE_BASE` → `.app`.                                                                                                                                      |
| `seo-copywriter`            | `SITE_BASE` → `.app`.                                                                                                                                      |
| `auth-email-hook`           | `RECOVERY_REDIRECT_URL` → `https://www.crazybear.app/set-password`. Sender domain decision below.                                                          |


After editing, all changed edge functions need redeploying (Lovable handles automatically on save, but flagging for awareness).

## 5. Auth redirect URLs (Lovable Cloud)

Supabase auth only sends users to URLs in its allow-list. We must add to the Auth config:

- Site URL: `https://www.crazybear.app`
- Additional redirect URLs: `https://www.crazybear.app/**`, `https://crazybear.app/**`

Old `crazybear.dev` entries can be removed once DNS is fully decommissioned. (I'll call `supabase--configure_auth` for this in build mode.)

## 6. Reissue existing wallet passes

Apple Wallet passes are baked at issue time — the existing live passes in members' wallets still contain the dead `crazybear.dev` QR. Two options, in priority order:

1. **Pass push update** — if the wallet passes were issued with a web service URL, we can push an update that replaces the QR `message`. Need to check `create-cb-wallet-pass` for `webServiceURL` in the pass.json; if present, write a small one-off function to bump `serial` and notify Apple Push Notification service.
2. **Reissue on next open** — easier: add a server-side check so when a member views their card we re-mint the `.pkpass` with the new QR; old passes get superseded next time the user taps "Add to Apple Wallet".

I'll inspect `create-cb-wallet-pass` for `webServiceURL` and pick the right option in build mode.

## 7. Decommission `crazybeartest.com` shim

`index.html` has a JS block redirecting `crazybeartest.com` → set-password. That host is dead too (per memory: "notify.crazybeartest.com is decommissioned"). Delete the whole shim — it can only cause confusion.

## 8. Things deliberately NOT changed

- `crazybear.co.uk` corporate emails (real, separate domain).
- `instagram.com/crazybearhotels`, `tiktok.com/@crazybeargroup` — social handles.
- File/folder names like `src/pages/crazybear/`, component names `CBxxx` — internal naming, unaffected.
- Project memory references to `notify.crazybear.dev` as "current sender" — I'll update memory after the email-domain decision in step 9.

## 9. One clarification needed before build

**Email sender domain.** `notify.crazybear.dev` is used by `auth-email-hook`, `cb-send-welcome`, `marketing-review-notify`, `send-cinema-ticket-email` as the actual Resend sender. Switching this requires:

- adding `notify.crazybear.app` (or `crazybear.app`) as a verified domain in Lovable Cloud → Emails
- adding SPF/DKIM/DMARC DNS records at the registrar
- waiting for DNS verification before sending

If you want me to keep sending from `notify.crazybear.dev` for now (DNS for that subdomain may still resolve even if the apex site doesn't), I'll only touch the *link/redirect/canonical* URLs and leave the sender alone until you've added the new email domain. Otherwise I'll trigger the email-domain setup dialog as part of build.

I'll ask this as a question before starting build.

## Technical summary (for reference)

- 1 new shared constant file (frontend) + 1 (edge functions).
- ~15 frontend files edited (URLs, mailtos, copy).
- 2 public files (sitemap.xml, robots.txt) regenerated.
- 6 edge functions edited + redeployed.
- 1 `supabase--configure_auth` call to update Site URL + redirect allow-list.
- 1 wallet-pass reissue path (option 1 or 2 above) so existing members' QRs start working.
- `index.html` `crazybeartest.com` shim deleted.
- Project memory (`mem://infrastructure/email`) updated to reflect the new sender domain once chosen.