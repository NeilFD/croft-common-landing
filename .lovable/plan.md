## Goal

Add full SEO meta and structured data to the top-level pages that currently have minimal or no tags, so Google, social shares, and AI crawlers see Crazy Bear properly. The Town and Country sub-pages already have full SEO via `PropertyPage` — this fills the remaining gaps.

## What I'll do

### 1. Upgrade the home page (`/`) — biggest win

Currently has only a `<title>` and `<meta description>`. No canonical, no Open Graph image, no Twitter card, no Organization schema.

Replace the bare `<Helmet>` block in `src/pages/Landing.tsx` with `<CBSeo>` and attach:
- **Organization** schema (name, logo, URL, description, two location pointers)
- **HotelGroup** style schema linking both Town and Country properties
- **Website + SearchAction** schema (lets Google show a site search box)

Result: when someone shares crazybear.dev on WhatsApp/Slack/iMessage, they'll see a proper card with the Crazy Bear logo, title, and description. Google gets a clean Organization profile.

### 2. Upgrade About (`/about`)

Currently has title, description, canonical — missing OG, Twitter, JSON-LD.

Replace `<Helmet>` with `<CBSeo>` and attach:
- **AboutPage** schema
- Reuse Organization schema

### 3. Upgrade Bear's Den (`/bears-den`)

Replace `<Helmet>` with `<CBSeo>` and attach:
- **Product** schema for Bear's Den Gold (£69/month subscription, 25% benefit) — this is huge: it can show up as a rich result with price.
- **Service** schema describing the membership

### 4. Add new schema helpers to `CBStructuredData.ts`

Three new helpers:
- `websiteSchema()` — site-wide WebSite + SearchAction
- `aboutPageSchema()` — for the About page
- `goldProductSchema()` — for Bear's Den Gold (Product + Offer with £69/month)

### 5. Verify and validate

After implementation:
- Confirm tags render in the live preview by viewing page source
- List the structured data added so you can paste URLs into Google's Rich Results Test (https://search.google.com/test/rich-results) once published

## Future-proofing for the .co.uk move

`CBSeo.tsx` has `SITE = "https://www.crazybear.dev"` hardcoded in one place. When you migrate, this is the **only** line that needs to change. I'll leave it as is for now (intentional during testing) but flag it so the migration is a one-line edit.

## Out of scope

- Image alt-text audit — separate task, do once you give the word
- Migrating sub-page Helmet blocks if any exist (none found in audit)
- The CMS-driven SEO override system (`seo_pages` table) is already wired up; admins can override any of these per route via the existing SEO management dashboard
