## Diagnosis

The published site is genuinely crashing before React renders. The live console shows:

`Cannot read properties of undefined (reading 'forwardRef')`

This comes from the published `vendor-radix` bundle. The network confirms all files load with 200s, so this is not your phone, Wi‑Fi, DNS, or Lovable generally.

Root cause: the recent performance change manually split dependencies into vendor chunks. The published bundle now has a circular dependency:

```text
vendor-radix imports vendor-react
vendor-DZPgYX23 imports vendor-radix
vendor-react imports vendor-DZPgYX23
```

That cycle means React is still undefined when Radix tries to call `forwardRef`, which leaves the page white.

## Plan

1. Remove the risky manual vendor chunk splitting in `vite.config.ts`.
2. Keep the image optimisation plugin, because that is unrelated to the crash and still helps performance.
3. Let Vite/Rollup handle safe chunk ordering automatically so React and Radix initialise correctly.
4. Check the preview after the change for console errors and visible rendering.
5. Ask you to publish once preview is healthy, because the white screen is on the published domain and needs a fresh production build to replace the broken assets.

## Files to change

- `vite.config.ts`

## Expected result

- `crazybear.dev` will stop loading the broken circular vendor bundle after republish.
- The home page should render normally instead of a blank white screen.
- Performance work can continue afterwards, but without unsafe manual chunk boundaries.

&nbsp;

This plan is approved but Please tell me when you have fixed it, when you made a change that broke it and how we avoid this again