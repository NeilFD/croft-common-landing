## Goal

Make the top-nav "Members" link smarter:

- Signed-in CB members: route straight to `/den` (current behaviour).
- Signed-out visitors: show a sales-style intro page that explains the entry-tier Bears Den sign-up (what it is, how it works, what they do, what they get), hints at Bear's Den Gold, and includes the existing `CBSubscriptionForm` so they can join from the page.  
  
  
NEEDS TO MAINTAIN THE TOV WE CURRENTLY HAVE - NOT SALESY, THIS IS JUST A SALES TOOL

## Changes

### 1. New page: `src/pages/crazybear/Members.tsx`

A black, high-contrast Bears Den sales page using existing tokens (Archivo Black headings, Space Grotesk body, `font-cb-mono` eyebrows). Wrapped with `CBTopNav` (tone="light") and `CBFooter`.

Sections:

1. **Hero / Intro**
  - Eyebrow: `THE BEARS DEN / TOWN / COUNTRY`
  - H1: `Join the Bears Den`
  - Short intro paragraph (Bears Den voice, staccato): explains the free entry tier in 2-3 sentences. The bear remembers you. Quiet perks across Town and Country.
2. **How it works** (3 short numbered blocks)
  - `01 Sign up` - name and email, ten seconds.
  - `02 We remember you` - bookings, birthdays, the odd surprise.
  - `03 Walk in` - softer landings at Town and Country.
3. **What you get** (bullet list, minimal)
  - Priority on quiet rooms and last-minute tables.
  - First word on new openings, suppers, supper clubs.
  - Birthday nod from the bear.
  - Members-only moments across both houses.
4. **Gold tease**
  - Eyebrow `Want more?`
  - One-liner: `Bears Den Gold. £69 a month. 25% off everywhere, in-app and in-venue. Referral credits. A gold card.`
  - Quiet text link `Read about Gold` to `/gold` (or wherever Gold lives; verify route during build).
5. **Sign-up form**
  - Render `<CBSubscriptionForm />` directly. It already handles auth signup, profile, and toast.
6. **Already a member?** small line with link to `/den`.

### 2. Routing change: `src/App.tsx`

Replace the static redirect:

```tsx
<Route path="/members" element={<Navigate to="/den" replace />} />
```

with a small gating component:

```tsx
const MembersGate = () => {
  const { isMember, loading } = useCBMember();
  if (loading) return null; // or tiny spinner
  return isMember ? <Navigate to="/den" replace /> : <Members />;
};
```

`Members` is lazy-loaded like other CB pages. `useCBMember` is already the source of truth for CB sign-in state.

Also update the legacy `members` redirects on lines 318 and 336 (currently `<Navigate to="/members" replace />`) - they keep redirecting to `/members`, which is correct (they will hit the new gate).

### 3. CMS hook-up

Per project rule "All new pages need to fit in the CMS management systems". Wrap the user-visible copy (intro paragraph, how-it-works items, what-you-get bullets, Gold tease line, "already a member" line) in `<CMSText>` with stable keys under a `cb.members.*` namespace, mirroring the pattern used on other CB pages (About / Culture). Headings can stay hard-coded if other CB pages do the same; otherwise also CMS-wrap.

### 4. Nav behaviour (no change required)

`CBMemberNavItems` already shows the `Members` link only when signed in, and currently links to `/members`. We want the link visible to signed-out users too so they can reach the sales page.

Update `CBMemberNavItems.tsx`: always render the `Members` link (pointing at `/members`), regardless of `isMember`. Keep the `Sign out` button only when signed in, and keep the `Member Login` button only when signed out. The `/members` route itself decides whether to show the sales page or redirect to `/den`.

## Technical notes

- Reuse existing components only: `CBTopNav`, `CBFooter`, `CBSubscriptionForm`, `CMSText`, `useCBMember`. No new design tokens.
- No backend or schema changes.
- No "membership tiers" wording anywhere - copy refers to "Bears Den" (entry) and "Bears Den Gold" only, per project memory.
- British spellings, no em dashes, no lucide icons, £ only.
- Verify the Gold route path before linking; if no dedicated page exists, link to the section on the existing page that introduces Gold.

## Out of scope

- Visual redesign of `CBSubscriptionForm`.
- Any change to `/den` itself.
- Changes to Gold checkout or pricing.