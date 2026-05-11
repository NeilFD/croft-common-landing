I found the likely root cause.

Your new booking was created today at 12:48 for `neilfdukes@gmail.com`, but there is no new cinema ticket email log for that booking.

The reason is not spam. It is our own duplicate-send guard.

The current email identity is built from:

```text
email + screening date + ticket numbers
```

Because you cleared the cinema reservations, the ticket numbers reset to `#1, #2`. You already had an old successful send logged for:

```text
neilfdukes@gmail.com + 2026-05-28 + #1,#2
```

So the backend treated today’s new booking as “already sent” and skipped the email entirely. The guest saw a booking confirmation, but no new email was queued.

## Plan

1. **Fix the duplicate-send logic properly**
  - Stop using ticket numbers as the permanent email identity.
  - Use the actual booking ID as the primary email identity.
  - Keep the duplicate guard, but make it booking-specific so clearing/recreating reservations cannot block a new email.
2. **Send full booking context from the booking modal**
  - Pass the booking ID and release ID into the cinema ticket email request.
  - This makes every email traceable to the exact reservation.
3. **Fix the customer resend button**
  - The in-modal “resend email” action currently uses the same duplicate path, so it can also be skipped.
  - Change it to a deliberate resend action with a fresh tracked send attempt.
4. **Improve failure handling**
  - If the email request is skipped, failed, or not queued, the guest must not see a vague success state.
  - Show a clear fallback: copy/open the wallet ticket link immediately.
5. **Backfill/repair today’s affected booking path**
  - After the code fix, resend the ticket for the new `neilfdukes@gmail.com` booking using the booking-specific identity.
  - Confirm the backend log shows a fresh `pending` then `sent` row for that exact booking.
6. **Add a regression guard**
  - Test the exact failure case: delete/recreate bookings for the same email and same screening, where ticket numbers reset to `#1,#2`.
  - Confirm the new booking still queues a new ticket email.

## Technical changes

- Update the cinema ticket backend function so automatic sends use:

```text
cinema-ticket-booking-{bookingId}
```

instead of:

```text
cinema-ticket-{email}-{screeningDate}-{ticketNumbers}
```

- Update the booking modal to include `bookingId` and `releaseId` in both first-send and resend calls.
- Update the database booking function response if needed so the frontend receives the booking ID immediately.
- Keep manual/admin resends as separate attempts, with fresh identifiers and metadata.
- Deploy the updated backend function after the code change.  
  
  
  
Why is there a duplication when i deleted teh email ages ago?