# Switch email sender to crazybear.app

You bought **crazybear.app** through Lovable. We'll use it purely as the email sender domain (the site stays where it is). New sender becomes **notify@crazybear.app**, replacing the misbehaving `notify.crazybear.dev` that Gmail seems to be silently dropping.

## Why this fixes the deliverability problem

`.dev` domains have a mixed reputation with corporate spam filters (Microsoft 365 in particular has been aggressive about them). A fresh `.app` subdomain, registered through Lovable and verified via Lovable's nameservers, gives us a clean sender reputation and proper SPF/DKIM/MX records out of the box.

## Steps

### 1. Add notify.crazybear.app as an email domain
You'll click a button to open the email setup dialog and add `crazybear.app` with subdomain `notify`. Because the domain was bought through Lovable, DNS verification is automatic — no manual record-copying.

### 2. Wait for verification (usually 5 to 30 mins)
Lovable provisions the subdomain on its nameservers. Status moves from `awaiting_dns` to `active`.

### 3. Swap the sender domain in the email functions
Two edge functions reference `notify.crazybear.dev` today:
- `send-transactional-email` (karaoke + booking confirmations, venue sheets)
- `auth-email-hook` (signup / password reset / magic links)

I'll update the `SENDER_DOMAIN` / `FROM_DOMAIN` constants in both, then redeploy. Templates, branding, queue, suppression list, unsubscribe handling — all untouched.

### 4. Test
Run a karaoke test booking. Confirm:
- Guest confirmation arrives at `neilfdukes@gmail.com`
- Venue sheet arrives at `neilfdukes@gmail.com`
- `email_send_log` shows `sent` from the new domain

### 5. Leave .dev domain alone (for now)
We won't disable or delete `notify.crazybear.dev` yet. It stays as a fallback until `.app` proves stable across a few test sends. Once confirmed, we can clean it up.

### 6. Update project memory
Core memory currently says the email sender is `notify.crazybear.dev`. I'll update it to `notify.crazybear.app`.

## What I need from you first

Click the button below to add `crazybear.app` as an email domain (subdomain: `notify`). After that completes, I'll handle steps 3 to 6 automatically.

<presentation-actions>
<presentation-open-email-setup>Add crazybear.app as email domain</presentation-open-email-setup>
</presentation-actions>
