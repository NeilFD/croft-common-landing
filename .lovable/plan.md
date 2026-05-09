I found the actual failure pattern.

This is not Stacie typing too slowly. The flow itself is fragile.

What is going on:

- The current signup creates a hidden random password, sends a confirmation email, then asks the user to manually type the email code into `/set-password`.
- The email template shows a **CONFIRM EMAIL** button, but the app page asks for a **code**. That is already confusing.
- The set-password page ignores the confirmation link flow and always tries to verify a typed code using `type: 'email'`.
- Recent logs show auth verification returning `otp_expired`, and one fresh email send failed while the sender domain was still being finalised: `domain_not_verified`. The domain is verified now, but that failed attempt produced a dead email.
- There is also stale-session noise: `User from sub claim in JWT does not exist`, caused by a deleted user still having an old browser session. That should be handled cleanly instead of poisoning the experience.

Plan to make it slick and reliable:

1. **Stop making the user manually copy codes for signup**
   - Change the signup email to clearly say the button is the primary action.
   - The user clicks the email button and lands on `/set-password` already verified.
   - Only show manual code entry as a fallback, not the main path.

2. **Make `/set-password` understand every valid auth link format**
   - Handle `code`, `token_hash`, hash tokens, and existing sessions properly.
   - If a valid signup link is present, exchange or verify it immediately.
   - Then show only password and confirm password.
   - If no link/session is valid, show email plus resend, with a clear expired-link state.

3. **Fix stale/deleted session handling**
   - When the app sees `User from sub claim in JWT does not exist`, force a clean sign-out and clear the broken local session.
   - This prevents old deleted test accounts from breaking new attempts.

4. **Improve resend behaviour**
   - Resend should use the same production redirect.
   - Copy should say “Send a fresh link”, not “Resend code”, unless manual code fallback is active.
   - Expired/invalid states should offer one obvious recovery action.

5. **Polish the signup states**
   - After signup, send the user to a proper “Check your email” state.
   - No mixed message between “code” and “link”.
   - Keep Bears Den tone: short, confident, minimal.

6. **Redeploy the auth email hook after template changes**
   - Email template changes will be deployed so the live signup emails match the corrected flow.