I checked the live email path. The email domain is verified, the queue is running, and Shane’s records show the app marked the signup, welcome email, and cinema ticket email as sent.

The problem is not the form failing to submit. The system is accepting the send and logging it as sent, but there are two serious reliability gaps that make this unsafe:

1. The app currently treats “accepted by the email sender” as “delivered”. That is not good enough.
2. There are still legacy email paths in the codebase using old sender identities and older sending methods. One current function is still using the decommissioned `crazybeartest.com` domain for the welcome email sender. That must be removed.

Plan:

1. Standardise the remaining Bears Den email sender paths
   - Update the welcome email function so it uses `notify.crazybear.dev` only.
   - Remove the remaining decommissioned `crazybeartest.com` sender values from active email code.
   - Check the relevant Bears Den email functions for any old Croft Common or third-party sender remnants that affect deliverability.

2. Add proper delivery visibility
   - Add clearer email log metadata for Bears Den sends so each signup, welcome, and cinema email can be traced by recipient and purpose.
   - Keep the existing queue, but make the app distinguish between queued, accepted, failed, and blocked states instead of treating all accepted sends as final delivery.

3. Add an admin resend route for member-critical emails
   - Add a safe resend path for signup confirmation, welcome email, and cinema ticket emails.
   - Avoid duplicate spam by checking the latest log before resending.
   - Keep this admin-only where it touches member data.

4. Add a member-facing fallback for signup verification
   - On `/set-password`, keep the resend button but make the state clearer when a code is resent.
   - If the email still does not arrive, provide a non-email recovery path for staff/admin support rather than leaving the member stuck.

5. Deploy and verify
   - Deploy the changed email functions.
   - Send a real test to the affected addresses.
   - Confirm the backend logs show the right sender domain, queue processing, and final status.

Technical notes:

- `auth-email-hook` is already queue-based and uses `notify.crazybear.dev`.
- `process-email-queue` is active and currently has no waiting messages.
- Shane’s email records show `sent` for signup, welcome, and cinema ticket entries.
- `cb-send-welcome` still contains `SENDER_DOMAIN = notify.crazybeartest.com` and `FROM_DOMAIN = crazybeartest.com`, which conflicts with the current sender domain memory and must be fixed.
- Earlier failures in the log include `domain_not_verified` and missing app email parameters. Those appear historic, but the code still contains legacy risk.