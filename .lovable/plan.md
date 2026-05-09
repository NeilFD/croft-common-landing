We should stop mixing a button link and a manual code. That is why this feels broken.

Plan:

1. **Replace the signup email with a code-first email**
  - Show a clear 8 digit verification code in the email body.
  - Remove the big confirmation button and the long fallback link from the main experience.
  - Keep the copy short and Bears Den: direct, confident, no clutter.
  - Make the subject and preview text match the new flow.
2. **Rebuild `/set-password` as one clean flow**
  - Screen 1: email prefilled, 8 digit code input, password, confirm password.
  - The code input will allow exactly 8 digits.
  - No confusing hidden stages, no “tap the email button instead”, no link-first language.
  - If the link or code is invalid or expired, show one action: send a fresh code.
3. **Change signup submission behaviour**
  - After the user signs up, send them straight to `/set-password?email=...`.
  - The toast and page copy will say to enter the 8 digit code from the email.
  - Keep the existing signup data collection intact: name, email, phone, birthday, interests, consent.
4. **Harden auth handling**
  - Keep stale deleted-user session cleanup.
  - Use the correct verification type for signup codes.
  - Keep password validation simple and clear: minimum 8 characters, passwords must match.
  - Keep resend throttling so users can request a fresh code without spamming.
5. **Deploy the updated auth email hook**
  - The email changes only go live once the backend email function is redeployed.

Technical notes:

- The current email only shows a button and a long verification URL, not the OTP code. That is the immediate reason the email feels unusable for a code-based page.
- I’ll make the UI expect 8 digits consistently: input length, validation, disabled state, and copy.
- I’ll remove the current mixed button/link/manual-code path and make signup one route, one action, one code.  
  
  
Ensure that the email matches teh process