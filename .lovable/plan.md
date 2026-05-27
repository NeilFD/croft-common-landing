## What's actually happening

The sends ARE going out — `email_send_log` shows both Laurent's guest email (`laurent.lemortellec@crazybear.co.uk`) and the venue copy (`neil.fincham-dukes@crazybear.co.uk`) marked `sent` at 14:01 UTC today. There are no suppressions, no bounces, no errors. The booking flow and queue dispatcher are working end-to-end.

So we have two separate things going on:

### 1. `neilfdukes@gmail.com` was never on the list

The venue notification is sent to whatever is in Settings → Venue email. That's currently `neil.fincham-dukes@crazybear.co.uk`. The gmail address has never been targeted, so of course no email arrived there. You've asked me to swap it.

### 2. The crazybear.co.uk inboxes aren't receiving (not even spam)

Marked `sent` by our system means the email API accepted the message — it doesn't guarantee inbox delivery. Likely causes:

- Microsoft 365 / Google Workspace at crazybear.co.uk silently quarantining mail from `notify.crazybear.dev` (a new sender) before it ever hits the user's spam folder. This is admin-level filtering, not user-level.
- DMARC alignment between `crazybear.dev` (sender) and `crazybear.co.uk` (recipient) — different root domains, no special trust.

## Plan

### A. Repoint the venue email (immediate)

Update `karaoke_settings.venue_email` from `neil.fincham-dukes@crazybear.co.uk` to `neilfdukes@gmail.com` so all future venue notifications go to your gmail.

I'll do this as a data update via the insert tool — no schema change, no code change required. The existing wiring already reads `venue_email` from settings live.

### B. Confirm gmail delivery

Once changed, trigger one test booking (or I can fire a test send through the edge function). Gmail typically delivers within seconds and you'll either see it in Inbox or Spam — much easier to diagnose than a corporate Microsoft tenant.

### C. Investigate crazybear.co.uk non-delivery (separate workstream)

This is the more important one for the guest copy — Laurent didn't receive his confirmation either. Even though Laurent's address happens to be `crazybear.co.uk`, real guests will be on gmail / outlook / hotmail / yahoo, so we need to confirm deliverability is actually OK there. Suggested checks:

1. Send a test confirmation to a personal gmail + outlook + hotmail address from the live booking flow. If those land, the issue is purely the crazybear.co.uk inbound filters (their IT team's problem, not ours).
2. If they DON'T land, we have a real sender reputation / DMARC issue on `notify.crazybear.dev` and we'd need to look at SPF/DKIM alignment and warm-up — that's a bigger piece of work.  
  
no teh .co.uk address has never worked???? has .app been set up, does .dev still work???

### D. Optional follow-up: multi-recipient venue email

If you later want the venue notification to go to multiple people (gmail + work + ops), I can extend `venue_email` to accept a comma-separated list and update the sender to fan it out. Not doing this now — you chose "replace", not "both".

## Technical details

- Single SQL update: `UPDATE karaoke_settings SET venue_email = 'neilfdukes@gmail.com' WHERE id = 1`.
- No edge function redeploy needed — `getVenueEmail()` in `src/lib/karaoke/api.ts` reads the value live from the DB on every send.
- No template change, no UI change.