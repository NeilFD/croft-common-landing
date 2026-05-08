I checked the actual system before planning the fix.

Findings:
- The sending domain is verified and ready.
- Josh and Sophie are not suppressed or blocked in the database.
- Earlier sends to them were recorded as `sent`, but that only confirms hand-off to the mail system, not inbox placement.
- The latest resend attempts hit rate limiting first, then succeeded at the auth layer.
- There is also a recent unauthorised call into the auth email hook, which needs correcting because sign-up email must not rely on a fragile path.
- The current user journey is too brittle: if the email is delayed, filtered, rate-limited or missed, the user has no proper recovery path on the password screen.

Plan:

1. Repair the email pipeline
   - Re-check the auth email hook configuration against the verified sender domain.
   - Redeploy the auth email hook and queue processor so the live deployed code matches the project files.
   - Re-run the email infrastructure setup if the queue processor or service credentials are out of sync.
   - Confirm the queue drains and that new auth emails are logged from `pending` to `sent`.

2. Fix the signup recovery journey
   - Add a proper “Resend code” action on `/set-password`.
   - Use the entered or pre-filled email address.
   - Add a cooldown so users cannot accidentally trigger rate limits.
   - Show clear states: sending, sent, wait before retrying, or failed.
   - Keep the page on `/set-password` until the user succeeds, then send them back to `/`.

3. Remove confusing code wording
   - Stop mixing “six digit”, “eight digit” and generic code copy.
   - Use consistent wording everywhere: “code from your email”.
   - Update the email template, signup toast and password screen copy so they all match.

4. Make Microsoft inboxes less fragile
   - Keep the From address aligned to the verified sender subdomain.
   - Keep the email plain, short and code-first.
   - Avoid extra marketing-like wording in the auth email that can hurt Microsoft placement.

5. Verify with real signals
   - Trigger fresh codes for Josh and Sophie after the repair.
   - Confirm the new messages move through the email log correctly.
   - Confirm no queue backlog, no suppression, no auth hook errors, and no resend rate-limit loop.

Technical details:
- Frontend work will be in `src/pages/crazybear/SetPassword.tsx` and `src/components/crazybear/CBSubscriptionForm.tsx`.
- Email copy work will be in `supabase/functions/_shared/email-templates/signup.tsx`.
- Backend deployment work will redeploy `auth-email-hook` and `process-email-queue`.
- I will not change the generated Cloud client files.