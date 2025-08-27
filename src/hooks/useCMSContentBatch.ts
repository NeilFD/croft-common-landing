import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CMSContent {
  id: string;
  page: string;
  section: string;
  content_key: string;
  content_data: any;
  published: boolean;
}

interface BatchQuery {
  page: string;
  section: string;
  contentKey: string;
  showDrafts?: boolean;
}

// Global cache to prevent duplicate requests
const contentCache = new Map<string, CMSContent | null>();
const pendingQueries = new Map<string, Promise<CMSContent | null>>();

export const useCMSContentBatch = (queries: BatchQuery[]) => {
  const [contents, setContents] = useState<Map<string, CMSContent | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!queries.length) {
      setLoading(false);
      return;
    }

    const fetchBatchContent = async () => {
      try {
        setLoading(true);
        
        // Check cache first
        const cachedResults = new Map<string, CMSContent | null>();
        const uncachedQueries: BatchQuery[] = [];
        
        queries.forEach(query => {
          const cacheKey = `${query.page}:${query.section}:${query.contentKey}:${query.showDrafts || false}`;
          const cached = contentCache.get(cacheKey);
          if (cached !== undefined) {
            cachedResults.set(`${query.page}_${query.section}_${query.contentKey}`, cached);
          } else {
            uncachedQueries.push(query);
          }
        });

        // If all results are cached, return immediately
        if (uncachedQueries.length === 0) {
          setContents(cachedResults);
          setLoading(false);
          return;
        }

        // Batch fetch uncached queries
        const batchPromises = uncachedQueries.map(async (query) => {
          const cacheKey = `${query.page}:${query.section}:${query.contentKey}:${query.showDrafts || false}`;
          
          // Check if query is already pending
          if (pendingQueries.has(cacheKey)) {
            return pendingQueries.get(cacheKey)!;
          }

          const queryPromise = (async () => {
            let dbQuery = supabase
              .from('cms_content')
              .select('*')
              .eq('page', query.page)
              .eq('section', query.section)
              .eq('content_key', query.contentKey);
            
            if (!query.showDrafts) {
              dbQuery = dbQuery.eq('published', true);
            }
            
            dbQuery = dbQuery.order('updated_at', { ascending: false });
            
            const { data, error } = await dbQuery.maybeSingle();
            
            if (error) {
              console.warn(`CMS content not found for ${cacheKey}:`, error);
              return null;
            }
            
            return data as CMSContent | null;
          })();

          pendingQueries.set(cacheKey, queryPromise);
          
          try {
            const result = await queryPromise;
            contentCache.set(cacheKey, result);
            return result;
          } finally {
            pendingQueries.delete(cacheKey);
          }
        });

        const results = await Promise.allSettled(batchPromises);
        
        // Combine cached and fetched results
        const allResults = new Map(cachedResults);
        
        uncachedQueries.forEach((query, index) => {
          const key = `${query.page}_${query.section}_${query.contentKey}`;
          const result = results[index];
          if (result.status === 'fulfilled') {
            allResults.set(key, result.value);
          } else {
            console.warn(`Failed to fetch ${key}:`, result.reason);
            allResults.set(key, null);
          }
        });

        setContents(allResults);
      } catch (err) {
        console.warn('Failed to fetch batch CMS content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchBatchContent();
  }, [queries]);

  const getContent = (page: string, section: string, contentKey: string): CMSContent | null => {
    const key = `${page}_${section}_${contentKey}`;
    return contents.get(key) || null;
  };

  return { contents, loading, error, getContent };
};