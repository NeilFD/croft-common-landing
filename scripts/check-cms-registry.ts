#!/usr/bin/env tsx
/**
 * Build-time check: every public route in src/App.tsx must be present in
 * src/data/cmsPages.ts (or explicitly listed in CMS_EXCLUDED_ROUTES).
 *
 * Run: bun run scripts/check-cms-registry.ts
 * Wired into prebuild so missing entries fail the build.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const APP = readFileSync(resolve(ROOT, 'src/App.tsx'), 'utf8');
const REG = readFileSync(resolve(ROOT, 'src/data/cmsPages.ts'), 'utf8');

// Pull every <Route path="..."> from App.tsx (public-site routes only)
const routePaths = Array.from(APP.matchAll(/<Route\s+path="([^"]+)"/g))
  .map((m) => m[1])
  .filter((p) => p && p !== '*' && !p.includes('cms/visual'))
  // Exclude management/admin/internal routes — those have their own auth + UI
  .filter((p) => !p.startsWith('/management') && !p.startsWith('/beo') &&
    !p.startsWith('/client-login') && !p.startsWith('/proposal') &&
  // Skip relative paths (children of <Route> with a leading parent path) — those are checked via parent route in the registry
  .filter((p) => p.startsWith('/'))
  // Skip /cms/* legacy redirects (handled inside management area)
  .filter((p) => !p.startsWith('/cms'));

// Pull registry routes & excluded routes via simple string matching
const registryRoutes = Array.from(REG.matchAll(/route:\s*'([^']+)'/g)).map((m) => m[1]);
const excludedBlock = REG.match(/CMS_EXCLUDED_ROUTES[\s\S]*?\];/)?.[0] ?? '';
const excluded = Array.from(excludedBlock.matchAll(/'([^']+)'/g)).map((m) => m[1]);

const known = new Set([...registryRoutes, ...excluded]);
const missing = [...new Set(routePaths)].filter((r) => !known.has(r));

if (missing.length > 0) {
  console.error('\n❌ CMS registry check failed.\n');
  console.error('The following routes exist in src/App.tsx but are not in src/data/cmsPages.ts.');
  console.error('Add them to CMS_PAGES (so admins can edit them) or to CMS_EXCLUDED_ROUTES (if intentionally hidden):\n');
  for (const r of missing) console.error('  - ' + r);
  console.error('');
  process.exit(1);
}

// Also flag stale registry entries (route in registry but not in App.tsx)
const appSet = new Set(routePaths);
const stale = registryRoutes.filter((r) => !r.startsWith('__') && !appSet.has(r));
if (stale.length > 0) {
  console.warn('\n⚠️  CMS registry has entries with no matching <Route> in App.tsx:');
  for (const r of stale) console.warn('  - ' + r);
  console.warn('');
}

console.log(`✓ CMS registry check passed (${registryRoutes.length} entries, ${routePaths.length} routes).`);
