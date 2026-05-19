#!/usr/bin/env tsx
/**
 * Build-time prerender.
 *
 * For every indexable route in src/data/cmsPages.ts we write a real
 * `dist/<route>/index.html`. That file is a copy of the SPA shell with:
 *   - <title>, <meta name="description"> replaced
 *   - <link rel="canonical"> injected
 *   - og:* and twitter:* replaced
 *   - JSON-LD from seo_pages appended
 *   - a real <h1> baked into <div id="root"> (offscreen, so users see no flash)
 *
 * Lovable hosting serves real files before falling back to the SPA shell, so
 * Googlebot sees unique HTML on the first byte for every page. Without this
 * every URL returns the same head + the early-error placeholder body, which
 * Google indexes as duplicate content and demotes.
 *
 * Per-route overrides from the `seo_pages` table win over defaults from the
 * registry, so editorial title/description/og_image/h1/jsonld changes ship
 * on the next build without code edits.
 *
 * Runs as the `postbuild` npm script. Failures are logged but never fail the
 * build (a missing prerender just falls through to the SPA shell, no worse
 * than today).
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DIST = resolve(ROOT, 'dist');
const SITE = 'https://www.crazybear.dev';
const DEFAULT_OG = `${SITE}/brand/logo.png`;

// ---------- 1. Bail early if there's no build to prerender ----------
if (!existsSync(join(DIST, 'index.html'))) {
  console.log('[prerender] no dist/index.html, skipping');
  process.exit(0);
}

// ---------- 2. Extract routes from the CMS registry ----------
// We can't import cmsPages.ts directly (it pulls React + lucide). Instead
// we parse it the same way scripts/check-cms-registry.ts does.
interface RouteEntry {
  route: string;
  defaultTitle: string;
  defaultDescription: string;
  noindex: boolean;
}

function extractRoutes(src: string): RouteEntry[] {
  const out: RouteEntry[] = [];
  // Split into chunks at each `route: '...'`, then look inside each chunk
  // for the matching seo block.
  const routeRe = /route:\s*'([^']+)'/g;
  const matches = Array.from(src.matchAll(routeRe));
  for (let i = 0; i < matches.length; i++) {
    const route = matches[i][1];
    const start = matches[i].index ?? 0;
    const end = matches[i + 1]?.index ?? src.length;
    const chunk = src.slice(start, end);

    const titleM = chunk.match(/defaultTitle:\s*'([^']*)'/);
    const descM = chunk.match(/defaultDescription:\s*'([^']*)'/);
    const includeM = chunk.match(/include:\s*(true|false)/);
    const noindexM = chunk.match(/noindex:\s*(true|false)/);

    if (!titleM || !descM) continue;
    if (includeM && includeM[1] === 'false') continue;

    out.push({
      route,
      defaultTitle: titleM[1],
      defaultDescription: descM[1],
      noindex: noindexM?.[1] === 'true',
    });
  }
  return out;
}

const registrySrc = readFileSync(resolve(ROOT, 'src/data/cmsPages.ts'), 'utf8');
const registryRoutes = extractRoutes(registrySrc);
console.log(`[prerender] registry: ${registryRoutes.length} indexable routes`);

// ---------- 3. Pull editorial overrides + dynamic slugs from the backend ----------
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://szokkwlleqndyiojhsll.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  // Public anon key (safe to ship; same one the browser uses)
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6b2trd2xsZXFuZHlpb2poc2xsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMDEwNjEsImV4cCI6MjA5MzY3NzA2MX0.ykpc99f8S7ZKaCa6eHlAU7L6rh9bRwAbI1mLikflhRY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

interface SeoOverride {
  route: string;
  title: string | null;
  description: string | null;
  og_image: string | null;
  noindex: boolean;
  h1: string | null;
  jsonld: any;
}

async function fetchOverrides(): Promise<Map<string, SeoOverride>> {
  const map = new Map<string, SeoOverride>();
  try {
    const { data, error } = await supabase
      .from('seo_pages')
      .select('route,title,description,og_image,noindex,h1,jsonld');
    if (error) throw error;
    for (const row of data ?? []) map.set(row.route, row as SeoOverride);
    console.log(`[prerender] overrides: ${map.size} rows from seo_pages`);
  } catch (e: any) {
    console.warn('[prerender] could not fetch seo_pages overrides:', e.message);
  }
  return map;
}

interface DynamicRoute {
  route: string;
  defaultTitle: string;
  defaultDescription: string;
}

async function fetchDynamic(): Promise<DynamicRoute[]> {
  const out: DynamicRoute[] = [];
  const sources: { table: string; prefix: string; brand: string }[] = [
    { table: 'cb_journal_posts', prefix: '/journal', brand: 'Journal' },
    { table: 'cb_stories', prefix: '/stories', brand: 'Stories' },
    { table: 'cb_events', prefix: '/whats-on', brand: "What's On" },
  ];
  for (const s of sources) {
    try {
      const { data, error } = await supabase
        .from(s.table)
        .select('slug,title,excerpt')
        .eq('published', true);
      if (error) throw error;
      for (const row of data ?? []) {
        if (!row.slug) continue;
        out.push({
          route: `${s.prefix}/${row.slug}`,
          defaultTitle: `${row.title ?? row.slug} | Crazy Bear`,
          defaultDescription: row.excerpt ?? `${s.brand} | Crazy Bear`,
        });
      }
    } catch (e: any) {
      console.warn(`[prerender] skip dynamic ${s.table}:`, e.message);
    }
  }
  console.log(`[prerender] dynamic: ${out.length} routes`);
  return out;
}

// ---------- 4. Build per-route head + body shell ----------
const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Resolved {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  h1: string;
  noindex: boolean;
  jsonld: any[];
}

function resolve_(
  entry: { route: string; defaultTitle: string; defaultDescription: string; noindex?: boolean },
  override: SeoOverride | undefined,
): Resolved {
  const title = (override?.title || entry.defaultTitle).trim();
  const description = (override?.description || entry.defaultDescription).trim();
  const ogImage = override?.og_image || DEFAULT_OG;
  const fullImage = ogImage.startsWith('http') ? ogImage : `${SITE}${ogImage}`;
  const canonical = `${SITE}${entry.route === '/' ? '/' : entry.route}`;
  // H1 falls back to title with brand suffix stripped
  const h1 = (override?.h1 || title.replace(/\s*[|—-]\s*Crazy Bear.*$/i, '')).trim();
  const jsonld = override?.jsonld
    ? Array.isArray(override.jsonld) ? override.jsonld : [override.jsonld]
    : [];
  return {
    title,
    description,
    canonical,
    ogImage: fullImage,
    h1,
    noindex: !!(override?.noindex || entry.noindex),
    jsonld,
  };
}

function renderHtml(shell: string, r: Resolved): string {
  let html = shell;

  // <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escape(r.title)}</title>`);

  // description
  html = html.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${escape(r.description)}" />`,
  );

  // og:* — replace each in place; the shell already has og:image and og:url
  const ogTags: Record<string, string> = {
    'og:title': r.title,
    'og:description': r.description,
    'og:url': r.canonical,
    'og:image': r.ogImage,
    'twitter:title': r.title,
    'twitter:description': r.description,
    'twitter:image': r.ogImage,
  };
  for (const [prop, val] of Object.entries(ogTags)) {
    const attr = prop.startsWith('og:') ? 'property' : 'name';
    const re = new RegExp(
      `<meta\\s+${attr}="${prop.replace(':', '\\:')}"\\s+content="[^"]*"\\s*/?>`,
      'i',
    );
    const tag = `<meta ${attr}="${prop}" content="${escape(val)}" />`;
    if (re.test(html)) {
      html = html.replace(re, tag);
    } else {
      html = html.replace('</head>', `  ${tag}\n  </head>`);
    }
  }

  // canonical (inject; the shell intentionally omits it)
  const canonicalTag = `<link rel="canonical" href="${escape(r.canonical)}" />`;
  if (/<link[^>]+rel="canonical"/i.test(html)) {
    html = html.replace(/<link[^>]+rel="canonical"[^>]*>/i, canonicalTag);
  } else {
    html = html.replace('</head>', `  ${canonicalTag}\n  </head>`);
  }

  // robots noindex
  if (r.noindex) {
    html = html.replace(
      /<meta\s+name="robots"[^>]*>/i,
      '<meta name="robots" content="noindex, nofollow" />',
    );
  }

  // JSON-LD
  if (r.jsonld.length) {
    const blocks = r.jsonld
      .map((d) => `<script type="application/ld+json">${JSON.stringify(d)}</script>`)
      .join('\n  ');
    html = html.replace('</head>', `  ${blocks}\n  </head>`);
  }

  // Body shell — inject an offscreen <h1> inside #root so crawlers see it.
  // Hydration replaces it before users see anything.
  const h1Tag = `<h1 style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden">${escape(r.h1)}</h1>`;
  html = html.replace(/<div id="root">\s*<\/div>/i, `<div id="root">${h1Tag}</div>`);

  return html;
}

function writeRoute(route: string, html: string) {
  // `/` → dist/index.html (overwrite, already exists)
  // `/town` → dist/town/index.html
  // `/country/rooms` → dist/country/rooms/index.html
  const rel = route === '/' ? '' : route.replace(/^\//, '').replace(/\/$/, '');
  const dir = rel ? join(DIST, rel) : DIST;
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf8');
}

// ---------- 5. Go ----------
async function main() {
  const shell = readFileSync(join(DIST, 'index.html'), 'utf8');
  const [overrides, dynamic] = await Promise.all([fetchOverrides(), fetchDynamic()]);

  const all = [...registryRoutes, ...dynamic];
  let written = 0;
  let skipped = 0;

  for (const entry of all) {
    const override = overrides.get(entry.route);
    if (override?.noindex) {
      skipped++;
      continue;
    }
    const r = resolve_(entry, override);
    if (r.noindex) {
      skipped++;
      continue;
    }
    try {
      const html = renderHtml(shell, r);
      writeRoute(entry.route, html);
      written++;
    } catch (e: any) {
      console.warn(`[prerender] failed ${entry.route}:`, e.message);
    }
  }

  console.log(`[prerender] wrote ${written} files, skipped ${skipped} noindex`);
}

main().catch((e) => {
  console.error('[prerender] fatal:', e);
  // Do not fail the build — falling back to the SPA shell is acceptable.
  process.exit(0);
});
