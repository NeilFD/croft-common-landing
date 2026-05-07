I’ve checked the PWA boot path. The previous fix only stopped one reload trigger. There are still several boot-time service worker behaviours that can keep replacing, claiming, updating, or serving a stale shell, which matches the infinite flash you are seeing from the home-screen app.

Plan to fix it properly:

1. Remove automatic PWA reloads completely
- Delete the `controllerchange` auto-reload behaviour from the PWA initialisation.
- Do not reload the page when a service worker changes.
- Do not force `SKIP_WAITING` during normal app launch.

2. Make service worker registration safe
- Stop forcing `reg.update()` and `SKIP_WAITING` on every launch.
- Keep service worker registration only for the live, installed app context.
- Prevent registration in preview/iframe contexts and clean up existing preview registrations so the editor preview stops being affected.

3. Replace the risky caching strategy
- Stop caching `/` during service worker install.
- For page navigations, always try the network first and only use cached HTML as a last resort.
- Never cache or intercept internal/auth routes like `/~oauth`, auth endpoints, backend functions, or bypass-cache requests.
- Keep notification click handling and nudge messaging intact.

4. Add a one-release cleanup path for already-installed broken PWAs
- Update `/sw.js` so devices that already have the old worker get a clean activation.
- Clear old app caches created by previous versions.
- Avoid client navigation loops during cleanup.
- Let the app load normally after the cleanup rather than forcing repeated reloads.

5. Fix the mobile debug log mismatch
- The console shows `mobile_debug_logs` is being written with an `error_message` field that the current table does not have.
- I’ll align the app and backend logging to the current table shape so PWA/mobile diagnostics work again.

Files I expect to change:
- `src/pwa/deferredPWA.ts`
- `src/pwa/registerPWA.ts`
- `public/sw.js`
- `src/lib/mobileDebug.ts`
- `supabase/functions/mobile-debug-log/index.ts`

Expected result:
- Opening the app from the phone home screen should load once and stay loaded.
- No infinite flashing.
- No repeated service worker reload cycle.
- The live app keeps installability and notification/nudge support.
- Mobile debug logging stops throwing schema-cache errors, so future phone issues are easier to trace.