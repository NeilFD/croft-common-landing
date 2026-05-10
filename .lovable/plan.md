I found the actual mess:

- `/management/login` currently redirects to `/set-password` whenever the host is `crazybear.dev`. That is why clicking management goes straight to the Bears Den password page.
- The live database currently has Neil and Anna as confirmed users, but neither has a management role attached, so neither can pass management access.
- The current management user creation code is also inconsistent: it uses a `manager` role, but the database role system expects `admin`, `sales`, `ops`, `finance`, or `readonly`.

Plan:

1. **Separate Bears Den from Management properly**
   - Remove the `crazybear.dev` redirect from `/management/login`.
   - Leave `/set-password` only for Bears Den member/password-code flow.
   - Make `/management/login` always show the management login form.

2. **Lock management to approved `@crazybear.co.uk` users only**
   - Use a dedicated backend allowlist for management access.
   - Allowed users must have a `@crazybear.co.uk` email.
   - Seed Neil as the first admin: `neil.fincham-dukes@crazybear.co.uk`.
   - Users outside the allowlist, or outside the domain, get no access even if they have an account.

3. **Fix the role system cleanly**
   - Keep roles in the separate `user_roles` table, not profiles.
   - Make the role lookup return a role only when the user is both allowlisted and on `@crazybear.co.uk`.
   - Add Neil’s `admin` role.

4. **Simplify login and reset behaviour**
   - Management login: email + password only.
   - Forgot password sends users back to `/management/login` for management reset handling, not `/set-password`.
   - The management page must never redirect to Bears Den.

5. **Fix management user creation**
   - Restrict creation to admins only.
   - Only allow `@crazybear.co.uk` emails.
   - Use valid roles only: admin, sales, ops, finance, readonly.
   - Remove the broken `manager` role path.

6. **Verify**
   - Confirm `/management/login` stays on management.
   - Confirm Neil resolves as admin.
   - Confirm non-allowlisted users cannot access management.
   - Confirm password reset no longer lands on `/set-password` for management.