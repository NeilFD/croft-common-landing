## Two fixes to `/members`

### 1. Quiet loading state on `MembersGate` (`src/App.tsx` ~line 253)

Replace `if (loading) return null;` with a centred type-only loader on black:

```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase text-white/60">
        One moment.
      </p>
    </div>
  );
}
```

No spinner, no icon. Stops the blank flash while `useCBMember` resolves.

### 2. Hero intro fallback (`src/pages/crazybear/Members.tsx`)

Same `section="hero"` `contentKey="intro"` field, new fallback:

> Free to join. The bear remembers you. Quiet rates, the odd cinema night, a recipe from the kitchens. Town and Country. Both houses, one ear.

CMS key unchanged so any existing override still wins.

### 3. "What you get" → "What's inside" with the real perks

In the `section="get"` block:

- Change the eyebrow `kicker` fallback from `"What you get"` to `"What's inside"`. Same CMS key.
- Replace the 4-item array with 8 items (`perk-1` … `perk-8`), each with a bold lead phrase + descriptor. Render as a two-column grid on `md:` and up, single column on mobile. Keep the `/` slash mark and bottom border per row exactly as today.

Items, in order:

1. `perk-1` Roll the Dice. A pour you didn't ask for.
2. `perk-2` Recipe of the Month. From the kitchens. Yours to cook.
3. `perk-3` Rooms offer. A quiet rate. Town or Country.
4. `perk-4` Pool day bed. When the sun shows up.
5. `perk-5` Secret Cinema. Rare nights, members first.
6. `perk-6` Moments. Your nights at Town and Country, tagged and kept.
7. `perk-7` Takeaway. Members-only ordering. Thai, when you want it.
8. `perk-8` The Ledger. Receipts and spend. Quiet maths.

Each list item stays a single `<CMSText as="p">` with the full string (lead + descriptor) so the field remains one editable cell. The lead phrase is bolded by post-processing the rendered text: split on the first full stop and wrap the lead in a `<span className="font-semibold">` via a small inline render helper inside the map. If splitting around `CMSText` proves awkward, fall back to wrapping the whole `<CMSText>` in a `<p className="[&>span:first-child]:font-semibold">` … but the cleaner default is a tiny `BulletLine` component that calls `useCMSText`-equivalent rendering, or simply renders a `<p>` whose first sentence is bold via a custom split. Choose the cleaner path during build.

Grid layout:

```text
ul: grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0
li: flex gap-5 border-b border-white/15 py-5
```

Container `max-w-3xl` widens to `max-w-5xl` so two columns breathe.

### Out of scope

- No routing, nav, sign-up form changes.
- No swipe-gesture surface changes.
- No Gold tease changes.
- No new CMS infrastructure; `perk-5`…`perk-8` slot into the existing per-key store automatically.

### Files touched

- `src/App.tsx` — `MembersGate` loading branch only.
- `src/pages/crazybear/Members.tsx` — hero intro fallback, `get` section kicker fallback, perks array + grid markup.