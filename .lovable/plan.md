## Goal

Bring back the member sign-up that exists on Croft Common pages (footer subscription + "Common Room" secret gesture entry) and translate the entire experience into Crazy Bear language and styling. Wire it into the Town and Country property pages so it appears at the bottom of every Crazy Bear page.

The underlying mechanic stays the same (this is the bit that worked perfectly): collect name + email + consent, optional personalisation (phone, birthday, interests), invoke the existing `subscribe-newsletter` edge function, and offer a hidden secret gesture entry to a members area. Only the wrapper, copy and visual styling change.

## What gets built

### 1. New Crazy Bear footer component
`src/components/crazybear/CBFooter.tsx`

A self-contained footer using the CB tokens already in place (`font-display`, `font-cb-sans`, `font-cb-mono`, black/white palette, thin uppercase tracking, hairline borders). No Croft brutalist type, no pink accents, no Common Good total, no Management Login.

Sections, top to bottom:
- Subscription block (uses new `CBSubscriptionForm`, see below)
- Three-column info block: Crazy Bear wordmark + tagline / Town (Beaconsfield address, phone, email) / Country (Stadhampton address, phone, email)
- Hairline divider
- Bottom row: copyright left, "Link Membership" text link right (opens existing `MembershipLinkModal`)
- A small, almost-hidden mark at the very bottom that acts as the secret-gesture target (see section 3)

### 2. New Crazy Bear subscription form
`src/components/crazybear/CBSubscriptionForm.tsx`

Same fields, validation, edge-function call (`supabase.functions.invoke('subscribe-newsletter', ...)`) and toast logic as `SubscriptionForm.tsx`. Differences:
- No `CMSText` wrappers (CB pages aren't CMS-managed); plain copy.
- CB visual language: black background, white hairline inputs, uppercase mono labels, full-width black/white pill button.
- New copy throughout, e.g.

  - Heading: `THE BEAR'S CIRCLE`
  - Sub: `Quiet rooms. Loud nights. The odd surprise. Sign up and the bear remembers you.`
  - Personalise toggle: `TELL THE BEAR MORE` / `LESS`
  - Submit: `JOIN THE CIRCLE`
  - Loading: `SIGNING YOU IN...`
  - Disclaimer: `Members hear first. Town and Country. No noise in between.`
  - Consent: `I'm happy for The Crazy Bear to email me. See the privacy policy.`

  All copy uses British spellings, no em dashes.

### 3. Secret gesture entry to a Crazy Bear members area
Reuse the existing `GestureOverlay`, `useMembershipGate`, `BiometricUnlockModal`, `MembershipLinkModal`, `AuthModal` machinery unchanged (it's the bit the user said worked perfectly). Wire it into the CB footer:

- The footer renders a `<GestureOverlay>` scoped to a `containerRef` on the footer wrapper, plus the existing modal stack.
- A small bear mark in the footer doubles as a visual hint for those who know.
- On successful gesture + auth, navigate to `/bears-den` (new route, see section 4).

This keeps the "secret, members-only entry" feel intact and uses code that already passes biometric / auth flows.

### 4. New members landing page (Crazy Bear styled)
`src/pages/crazybear/BearsDen.tsx`, route `/bears-den`.

Minimal first pass that mirrors `CommonRoomMain` in spirit but in CB language: black hero, large `BEAR'S DEN` wordmark, short welcome line, and placeholder tiles for what will live there later (Diary, Tables, Rooms, Cellar). No CMS. This gives the secret gesture somewhere meaningful to land. Future content can be filled in later.

### 5. Mount the new footer on Town and Country
Update `src/components/property/PropertyLayout.tsx` to render `CBFooter` in place of the current minimal footer. The Landing page (`/`) keeps its full-bleed entry chooser and does not get the footer (correct behaviour, matches the user's "bottom of the pages" wording).

### 6. Routing
Add `/bears-den` to `src/App.tsx` alongside the existing CB routes. Public route, gated only by the secret gesture + biometric / auth flow already in place.

## What is intentionally NOT carried over

- Common Good total, Uncommon Standards button, Management Login link, "Stokes Croft, Bristol / Pure Hospitality" copy, brutalist Croft typography, pink accent colour. None of these belong to Crazy Bear.
- CMS-driven copy: CB pages aren't in the CMS today. All strings live in the component. Adding CB to the CMS is a separate, larger piece of work.

## Files touched

Create
- `src/components/crazybear/CBFooter.tsx`
- `src/components/crazybear/CBSubscriptionForm.tsx`
- `src/pages/crazybear/BearsDen.tsx`

Edit
- `src/components/property/PropertyLayout.tsx` (swap footer)
- `src/App.tsx` (add `/bears-den` route)

No database changes, no new edge functions, no new secrets. The `subscribe-newsletter`, biometric and membership-link functions already deployed continue to do the work.

## Open question (one quick check before I build)

Confirm the members destination name. I've used `BEAR'S DEN` / `/bears-den` as the Crazy Bear equivalent of `THE COMMON ROOM`. If you'd prefer `THE SETT`, `THE DEN`, `THE LAIR`, or something else, tell me now and I'll use that name and route instead.
