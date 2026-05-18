## Audit: which routes are Crazy Bear vs Croft Common?

I checked the 5 routes you flagged plus their components.


| Route              | Component                                                                                                      | Verdict                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------- |
| `/cafe`            | `src/pages/Cafe.tsx` → `CafeHeroCarousel` + legacy `Navigation` + Croft `Footer` shim                          | **Croft Common legacy** |
| `/beer`            | `src/pages/Beer.tsx` → `BeerHeroCarousel` + legacy `Navigation`                                                | **Croft Common legacy** |
| `/kitchens`        | `src/pages/Kitchens.tsx` → `KitchensHeroCarousel` (Croft watermark, "KITCHENS" overlay in Croft style)         | **Croft Common legacy** |
| `/onekitchen-menu` | `src/pages/OneKitchenMenu.tsx` — title literally reads `OneKitchen Menu - Croft`, canonical `/onekitchen-menu` | **Croft Common legacy** |
| `/cocktails`       | `src/pages/Cocktails.tsx` → `CocktailHeroCarousel` + legacy `Navigation`                                       | **Croft Common legacy** |


For reference, the truly Crazy Bear "Standalone" pages registered in `cmsPages.ts` are things like `/`, `/about`, `/house-rules`, `/members`, `/bears-den`, `/curious`, `/community`, `/hall`, `/event-enquiry`, `/book`, `/privacy`, plus everything under `/country/*`, `/town/*`, `/journal`, `/whats-on`, `/stories`, `/gift-vouchers`, `/treatments`, `/merch`, `/gallery`, `/faq`, `/press`, `/contact`, `/careers`, `/terms`, `/cookies`.

`Hall` is **kept** — it's a Crazy Bear page (Hall is part of the Crazy Bear venue offer) and you did not list it.  
  
No Hall needs to go too

## What to change

1. **Remove the 5 pages from the CMS registry** (`src/data/cmsPages.ts`)
  - Delete the `cafe`, `beer`, `kitchens`, `onekitchen-menu`, `cocktails` entries from `CMS_PAGES`.
  - Drop their lazy imports (`Cafe`, `Beer`, `Kitchens`, `OneKitchenMenu`, `Cocktails`).
  - Effect: they vanish from the CMS sidebar, Overview, Visual Editor and Assets picker, and from the SEO Monitor.
2. **Remove the 5 public routes from `src/App.tsx**` (lines 451-455)
  - Drop the `<Route>` lines for `/cafe`, `/cocktails`, `/beer`, `/kitchens`, `/onekitchen-menu`.
  - Drop the matching imports at the top of the file.
  - Anyone hitting those URLs falls through to the 404 page.
3. **Keep the page files on disk** (`src/pages/Cafe.tsx`, `Beer.tsx`, `Kitchens.tsx`, `OneKitchenMenu.tsx`, `Cocktails.tsx`) for now. They're not imported anywhere else once App.tsx is cleaned up, so they're dead code — but leaving them means we can resurrect or port any copy/imagery into Crazy Bear equivalents later. We can delete them in a follow-up sweep once you confirm nothing's worth salvaging.
4. **Build-time registry check** (`scripts/check-cms-registry.ts`) compares App.tsx routes against `CMS_PAGES`. Since we're removing the routes *and* the registry entries together, the check stays green. No changes needed there.

## Out of scope

- Not touching `Hall`, `Cocktails` references inside Country/Town property pages (none of those import the legacy `Cocktails` page — `Town > Drink > Cocktails` is a separate property page).
- Not deleting the old page source files (leaving for a later cleanup pass).
- No CMS content/database rows are deleted — if you ever re-add the routes, any historic `cms_content` rows under those slugs are still there.