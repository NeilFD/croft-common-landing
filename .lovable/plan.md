
# Marketing Calendar

A planning-first marketing command centre living at `/management/marketing/calendar`. Built for the Marketing team to plan, design, review and approve content across social, email and website, with channel-accurate previews and structured approvals. Auto-publishing is intentionally deferred to a later phase.

## Benchmarks studied (what we are stealing the best of)

- Asana / Monday content calendars — campaign roll-ups, swimlanes, custom fields
- Notion Calendar + Linear — keyboard speed, command palette, inline edit
- Planable / Loomly / Later — channel-accurate previews, post composer, comment threads, approval gates
- Airtable Marketing Calendar — saved views and filters
- Figma — multiplayer feel, presence, comment pins

## Information architecture

```
/management/marketing
  ├── /calendar           Month / Week / List / Campaign timeline
  ├── /post/:id           Full post composer + previews + comments
  ├── /campaigns          Campaign roll-ups (multi-post)
  ├── /assets             Media library (images, video, copy snippets, hashtag sets)
  └── /settings           Channels, brand voice, approval rules, holidays
```

CMS hooks added under `/management/cms/marketing` for: channel definitions, hashtag groups, holiday/event presets, approval rules, brand-voice snippets.

## Core feature set

### 1. Calendar surfaces
- Month view (default, 1376px optimised), Week view, List/Agenda view, Campaign Gantt timeline.
- Coloured channel chips per cell; up to 3 visible plus "+N" overflow.
- Drag-and-drop to reschedule, shift-drag to duplicate, alt-drag to copy across channels.
- Click empty day to quick-create. Click chip to open side-drawer; double-click for full editor.
- Sticky top bar with: month switcher, Today, view toggle, filter pills, search, "New post" CTA.

### 2. Post composer (the heart of the tool)
Tabbed drawer/full-screen with:
- Content tab: rich text body, title, CTA, link, hashtags (chip input + saved sets), emoji.
- Media tab: drag-drop images/video, crop per-channel aspect (1:1, 4:5, 9:16, 16:9), alt text.
- Channels tab: multi-select. Each channel can override copy/media (Planable-style "variations").
- Schedule tab: date, time, timezone (Europe/London), recurrence, "best time" suggestion.
- Audience tab: property tag (Town / Country / Group), campaign link, content pillar, locale.
- SEO/meta tab (website channel only): slug, meta title, meta description, OG image.

### 3. Native-style previews (per channel)
Each preview rendered to look like the real surface, side-by-side with the editor:
- Instagram feed + Reel + Story
- TikTok video card
- Facebook feed
- X / Twitter post (with character count and link card)
- LinkedIn post (company page styling)
- Email (subject, preheader, "Bears Den" template wrapper)
- Website (blog card, hero takeover, banner — using actual site tokens)

Live character counts, hashtag count caps, link previews, and warnings (e.g. "Image is below 1080px", "X over 280 chars", "No alt text").

### 4. Approval workflow
Status pipeline: `Draft → In review → Approved → Scheduled → Published` (Published is set manually on the post once it has been pushed live, since v1 is plan-only).
- Anyone with sales or admin role can move Draft → In review.
- Only admin can move to Approved (hard gate, matching your answer).
- Audit log on every transition (who, when, from, to, note).
- "Request approval" button notifies admin via in-app notification + email.

### 5. Collaboration
- Threaded comments per post, with @mentions of management users.
- Comment pins on specific media regions (Figma-style) for image feedback.
- Email + in-app notification on mention, status change, due date.
- Presence indicator showing who is viewing/editing now (Supabase realtime).
- Version history with diff and one-click restore.

### 6. Filters, sort, saved views
- Filter pills: channel, status, property tag, campaign, owner, content pillar, has-media, locale, date range.
- Full-text search across title, body, hashtags, campaign name.
- Saved views per user ("My drafts this week", "Town IG October", "Awaiting my approval").
- URL-encoded filters so views are shareable.

### 7. Campaigns
- Group N posts under a campaign with goal, KPI, budget, start/end, hero asset.
- Campaign timeline (Gantt) and a single "campaign brief" page with all child posts.
- Campaign templates (e.g. "Bottomless brunch launch") that scaffold a typical multi-post sequence.

### 8. Asset library
- Reuse existing storage; new bucket `marketing-assets`.
- Tag assets, search by tag/colour/orientation, see "used in N posts".
- Hashtag sets and copy snippet library, both reusable in composer.

### 9. World-class extras
- Command palette (Cmd+K): jump to date, create post, open campaign, change filter.
- Keyboard shortcuts: N new, / search, J/K navigate days, E edit, R request review.
- Holiday + key-date overlay (UK bank holidays, awareness days, internal events from Spaces).
- Conflict detection: warn when two posts target same channel within 2h, or two campaigns clash.
- AI assist (Lovable AI Gateway, `google/gemini-2.5-flash`): generate captions in Bears Den voice, suggest hashtags, rewrite for each channel, generate alt text. Brand-voice prompt seeded from existing tone-of-voice memory.
- Analytics placeholder card on each post for future API hookup (impressions, engagement) so the data model is ready.
- Export: ICS feed, CSV, and printable monthly PDF for offline review.
- Dark/light parity using existing tokens; high-contrast B&W aesthetic with channel accent colours used sparingly on chips only.

## Permissions

- Read: all management roles.
- Create/edit own drafts: admin, sales.
- Comment: all management roles.
- Approve: admin only.
- Manage settings, channels, approval rules: admin only.
- CMS marketing settings: admin (mirrors existing CMS access rules).

## Visual design

- Follows core memory: high-contrast B&W, Bowlby One headings ("MARKETING CALENDAR"), Space Grotesk body.
- No focus rings on selected calendar cells — selection shown via thick black border + offset shadow.
- Channel chips use brand-accent colours (already defined) as small dots, not full backgrounds, to keep the interface calm.
- Anglicised spellings only, £ only, no em dashes, no AI-generated imagery, no Lucide icons (use existing icon set / SVG sprite).

## Technical plan

### Routes & files
- `src/pages/management/marketing/MarketingCalendar.tsx` (month/week/list/timeline shell)
- `src/pages/management/marketing/PostEditor.tsx` (full composer)
- `src/pages/management/marketing/CampaignsList.tsx`, `CampaignDetail.tsx`
- `src/pages/management/marketing/AssetsLibrary.tsx`
- `src/pages/management/marketing/MarketingSettings.tsx`
- `src/components/marketing/*` (CalendarGrid, PostCell, PostDrawer, ChannelPreview/{Instagram,Tiktok,Facebook,X,Linkedin,Email,Website}.tsx, CommentsPanel, ApprovalBar, FiltersBar, SavedViews, CommandPalette, AssetPicker, HashtagInput, AiAssistButton)
- Add Marketing section to `ManagementSidebar.tsx` with sub-items: Calendar, Campaigns, Assets, Settings.
- Register in `AdminApp.tsx` / management router.
- CMS: new section `src/components/cms/marketing/*` for channels, hashtag sets, holidays, approval rules.

### Data model (new tables, all RLS-protected by `has_management_role`)

- `marketing_channels` (id, key, label, type, accent_color, character_limit, image_aspects[], active)
- `marketing_campaigns` (id, name, slug, goal, kpi, budget, start_date, end_date, hero_asset_id, owner_id, status, created_at, updated_at)
- `marketing_posts` (id, campaign_id, title, body, cta_text, cta_url, scheduled_at, timezone, status, owner_id, property_tag, content_pillar, locale, search_tsv, created_at, updated_at)
- `marketing_post_channels` (id, post_id, channel_key, body_override, media_override jsonb, status_override) — per-channel variations
- `marketing_post_assets` (post_id, asset_id, sort_order, channel_key nullable)
- `marketing_assets` (id, url, kind, width, height, alt_text, tags[], created_by)
- `marketing_hashtag_sets` (id, name, tags[])
- `marketing_comments` (id, post_id, parent_id, author_id, body, mentions uuid[], pin jsonb nullable, created_at)
- `marketing_post_versions` (id, post_id, snapshot jsonb, author_id, created_at)
- `marketing_status_log` (id, post_id, from_status, to_status, author_id, note, created_at)
- `marketing_saved_views` (id, owner_id, name, filters jsonb)
- `marketing_holidays` (id, date, label, country)

Storage: new public bucket `marketing-assets` with admin/sales write, public read.

Supabase Realtime enabled on `marketing_posts`, `marketing_comments`, `marketing_status_log` for live multiplayer.

### Edge functions
- `marketing-ai-assist` — Lovable AI Gateway calls (caption gen, rewrite per channel, alt text).
- `marketing-notify` — sends in-app + email on mention, status change, upcoming due (uses existing `notify.crazybear.dev` infra).
- `marketing-ics-feed` — public, signed ICS feed per saved view.

### CMS integration (mandatory per project rule)
Adds CMS pages under `/management/cms/marketing` for: channels list, hashtag sets, holidays, approval rules, brand-voice snippets, content pillars. All editable by admin.

## Phased delivery

1. Schema, RLS, storage bucket, sidebar entry, empty Marketing area.
2. Month calendar + post drawer + draft/in-review/approved status + filters.
3. Channel previews (IG, TikTok, FB, X, LinkedIn, Email, Website) + per-channel variations.
4. Comments, mentions, version history, audit log, notifications.
5. Campaigns + Gantt + templates + asset library.
6. Command palette, saved views, ICS export, AI assist, holidays overlay.
7. CMS marketing settings pages.

Auto-publishing to channels is explicitly out of scope for v1, by your decision.
