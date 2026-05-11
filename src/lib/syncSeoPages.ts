import { supabase } from '@/integrations/supabase/client';
import { CMS_PAGES } from '@/data/cmsPages';

let syncPromise: Promise<void> | null = null;

/**
 * Idempotently registers every public page from the registry into seo_pages.
 * Existing rows are never overwritten (the SQL function uses ON CONFLICT DO NOTHING).
 * Safe to call on every admin page mount; runs at most once per session.
 */
export function syncSeoPagesFromRegistry(): Promise<void> {
  if (syncPromise) return syncPromise;
  syncPromise = (async () => {
    const entries = CMS_PAGES.filter((p) => p.seo.include && !p.route.startsWith('__'));
    await Promise.all(
      entries.map((p) =>
        (supabase as any).rpc('seed_seo_page', {
          p_route: p.route,
          p_title: p.seo.defaultTitle,
          p_description: p.seo.defaultDescription,
          p_noindex: p.seo.noindex ?? false,
        })
      )
    );
  })().catch((err) => {
    console.warn('[SEO sync] failed:', err);
    syncPromise = null;
  });
  return syncPromise;
}
