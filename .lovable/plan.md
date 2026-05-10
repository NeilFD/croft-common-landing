I’ll do this as a proper management-area reset, not a wording patch.

## Scope

Keep and update:
- Spaces
- Feedback
- Admin
- CMS
- Settings
- AI Assistant if it supports the kept areas

Hide/remove from navigation and dashboard:
- Chat
- Common Knowledge
- Research

## Plan

1. **Clean the management entry screen**
   - Remove the Chat, Common Knowledge, and Research tiles from `/management`.
   - Keep only Crazy Bear-relevant modules: Spaces, Feedback, Admin, CMS, Settings, and any useful AI assistant entry if still relevant.
   - Tighten labels/descriptions so they read as Crazy Bear operations, not old generic/Croft Common management.

2. **Clean the management sidebar**
   - Remove Chat, Common Knowledge, and Research from the sidebar and collapsed rail.
   - Remove old links to `/management/chat`, `/management/common-knowledge`, and `/management/research` from visible navigation.
   - Keep Spaces, CMS, Admin, Feedback, Settings, and role-appropriate access.

3. **Stop exposing hidden routes from management**
   - Keep the old routes technically safe if needed, but redirect hidden management areas back to `/management` so people cannot use direct URLs from the panel.
   - Specifically handle `/management/chat`, `/management/common-knowledge/*`, and `/management/research`.

4. **Rebuild CMS navigation around Crazy Bear pages**
   - Replace old Croft Common CMS pages with Crazy Bear structure:
     - Country: overview, pub, pub food, pub drink, hospitality, rooms, room types, room gallery, parties, events, weddings, birthdays, business
     - Town: overview, food, Black Bear, B&B, Hom Thai, drink, cocktails, rooms, room types, room gallery, pool
     - Bears Den/member pages where they are actually active
   - Remove old CMS entries like Cafe, Beer, Kitchens, Hall, Community, Common Room, Calendar, Croft Common DateTime, and old Croft-only pages from the CMS UI.

5. **Wire CMS preview/editor to Crazy Bear routes**
   - Update CMS visual editor route mapping so `/management/cms/visual/...` previews the real Crazy Bear pages rather than old Croft Common pages.
   - Ensure “view live” opens the correct Crazy Bear path, for example `/country/pub/food` or `/town/drink/cocktails`.
   - Update CMS overview cards to point to `/management/cms/...`, not legacy `/cms/...` paths.

6. **Sweep retained management copy**
   - Replace remaining visible “Croft Common”, “Common Room”, and old CMS wording inside the kept management/CMS screens.
   - Keep wording short and direct in the Bears Den/Crazy Bear voice.

7. **Check the result**
   - Verify `/management` no longer shows hidden areas.
   - Verify `/management/cms` only shows Crazy Bear page options.
   - Verify CMS visual preview paths open the intended Crazy Bear pages.
   - Run a targeted text search to catch remaining Croft Common references in kept management and CMS files.