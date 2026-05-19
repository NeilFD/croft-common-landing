#!/usr/bin/env tsx
/**
 * Curls a list of URLs as Googlebot and asserts each one returns a unique
 * <title> + a real <h1> in the static HTML. Use before swapping DNS:
 *
 *   bunx tsx scripts/verify-prerender.ts https://www.crazybear.dev
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const BASE = process.argv[2] || 'https://www.crazybear.dev';
const UA = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const src = readFileSync(resolve(ROOT, 'src/data/cmsPages.ts'), 'utf8');
const routes = Array.from(src.matchAll(/route:\s*'([^']+)'/g))
  .map((m) => m[1])
  .filter((r, i, a) => a.indexOf(r) === i);

interface Res {
  route: string;
  status: number;
  title: string | null;
  h1: string | null;
}

async function check(route: string): Promise<Res> {
  const url = `${BASE}${route === '/' ? '' : route}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const html = await res.text();
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim() ?? null;
    const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1].trim() ?? null;
    return { route, status: res.status, title, h1 };
  } catch (e: any) {
    return { route, status: 0, title: null, h1: e.message };
  }
}

async function main() {
  console.log(`[verify] checking ${routes.length} routes against ${BASE}`);
  const results: Res[] = [];
  for (const r of routes) {
    results.push(await check(r));
    process.stdout.write('.');
  }
  console.log('');

  const titles = new Map<string, string[]>();
  for (const r of results) {
    if (!r.title) continue;
    titles.set(r.title, [...(titles.get(r.title) ?? []), r.route]);
  }

  let fails = 0;
  for (const r of results) {
    const issues: string[] = [];
    if (r.status !== 200) issues.push(`HTTP ${r.status}`);
    if (!r.title) issues.push('no <title>');
    if (!r.h1) issues.push('no <h1>');
    if (r.title && (titles.get(r.title)?.length ?? 0) > 1) issues.push('duplicate <title>');
    if (issues.length) {
      fails++;
      console.log(`✗ ${r.route}  [${issues.join(', ')}]  title="${r.title}" h1="${r.h1}"`);
    }
  }

  console.log(`\n[verify] ${results.length - fails}/${results.length} ok`);
  if (fails) process.exit(1);
}

main();
