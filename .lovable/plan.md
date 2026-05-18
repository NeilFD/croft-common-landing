## Problem

On `/whats-on` (and several other Crazy Bear pages) the top nav sits halfway down the hero, overlapping the headline, instead of being pinned to the very top of the section.

## Root cause

`CBTopNav` positions itself with `absolute top-0`. On the affected pages it is rendered inside an inner wrapper like `<div className="relative z-10">`, which becomes its offset parent. That wrapper sits **below** the section's `pt-40 md:pt-48` padding (160–192px), so the nav is pushed down by that padding instead of anchoring to the section's top edge.

Pages where CBTopNav is wrapped in a `relative` inner div (broken):

- `src/pages/crazybear/WhatsOn.tsx`
- `src/pages/crazybear/GiftVouchers.tsx`
- `src/pages/crazybear/BearsDen.tsx`
- `src/components/crazybear/CBStaticPage.tsx` (powers Careers, Contact, Cookies, Curious, FAQHub, Merch, Press, SetPassword content, Terms, Treatments, etc — anything built on CBStaticPage)
- `src/components/property/PropertyLayout.tsx` (`<div className="relative">` wraps the nav)

Pages where CBTopNav is already a direct child of a `relative` section (correct, no change):

- `Members.tsx`, `Stories.tsx`, `JournalPost.tsx`, `StoryDetail.tsx`, `About.tsx`, `HouseRules.tsx`, `Landing.tsx`

## Fix

For each broken file, move `<CBTopNav />` out of the inner relative wrapper so it becomes a direct child of the outer `relative` `<section>` (sibling of `CBHeroBackdrop` and the content wrapper). The content wrapper keeps its `relative z-10` for stacking above the backdrop; the nav already has `z-30` so it stays above everything.

Concretely, change:

```tsx
<section className="relative ... pt-40 md:pt-48 ...">
  <CBHeroBackdrop page={PAGE} />
  <div className="relative z-10">
    <CBTopNav tone="light" />
    ...content
  </div>
</section>
```

to:

```tsx
<section className="relative ... pt-40 md:pt-48 ...">
  <CBHeroBackdrop page={PAGE} />
  <CBTopNav tone="light" />
  <div className="relative z-10">
    ...content
  </div>
</section>
```

Same shape applies to `BearsDen.tsx` (double-nested) and `CBStaticPage.tsx` (which fans out to many static pages, fixing them all in one edit). For `PropertyLayout.tsx`, drop the unnecessary `relative` wrapper around the nav so it anchors to the page hero below.

## Verification

After edits, load `/whats-on`, `/gift-vouchers`, `/bears-den`, a CBStaticPage route (e.g. `/careers`), and a property page; confirm the nav sits flush with the top of the hero on each.

No CMS, data, or behavioural changes — purely DOM restructuring.