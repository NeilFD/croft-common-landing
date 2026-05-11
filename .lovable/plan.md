Here is what happened, specifically for Secret Cinema:

- The Secret Cinema ticket emails were generated and queued.
- Shane’s ticket email was logged as sent at 11:25:39 to `swturnhill@gmail.com`.
- Your ticket email was logged as sent at 12:06:35 to `neil.fincham-dukes@crazybear.co.uk`.
- The queue is now empty, so the app did not leave either message stuck.
- Neither address is on the app suppression list.
- The sender domain `notify.crazybear.dev` is verified.

The failure is that the app is only proving “accepted for sending”, not “delivered to inbox”. That is not good enough for tickets.

Plan:

1. Fix Secret Cinema delivery certainty
   - Change the Secret Cinema ticket flow so the ticket state is not treated as complete just because the email was accepted by the sender.
   - Store clearer metadata for every ticket email: booking, release, ticket numbers, recipient, sender domain, and send purpose.
   - Label the status in admin as “sent to mail provider”, not “delivered”, unless there is a real delivery event.

2. Add an admin resend for Secret Cinema tickets
   - Add a safe resend action in the admin cinema area for a single booking.
   - Resend only that booking’s ticket email.
   - Use a new idempotency key per manual resend so the resend is not skipped by the existing “already sent” check.
   - Log the resend separately so staff can see exactly when it was retried.

3. Add a non-email ticket fallback
   - Add an admin copy/open ticket link for each Secret Cinema booking.
   - Staff can send the ticket link manually if inbox delivery fails.
   - This avoids leaving guests stuck when email providers silently bin accepted mail.

4. Clean up legacy dead-letter noise
   - The current dead-letter rows are old welcome emails from the retired sender domain, not today’s Secret Cinema tickets.
   - Keep the data for audit, but stop it confusing the email dashboard by making the dashboard show template, status, and latest attempt clearly.

5. Verify after implementation
   - Resend one real Secret Cinema ticket to Shane and one to you.
   - Confirm the new log rows show the correct sender domain and manual resend metadata.
   - Confirm the admin fallback link is available even if email delivery fails again.

Technical details:

- Main function involved: `send-cinema-ticket-email`.
- Main data involved: `cinema_bookings`, `cinema_releases`, and `email_send_log`.
- Existing problem: the current idempotency key makes a second send to the same recipient, date, and ticket numbers get skipped once the first attempt is marked sent.
- Fix: add a deliberate manual resend path that creates a new tracked send attempt without duplicating the booking.