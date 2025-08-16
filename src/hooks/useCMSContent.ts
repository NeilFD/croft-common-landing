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

export const useCMSContent = (page: string, section: string, contentKey: string, showDrafts = false) => {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // Build query - if showDrafts is true, get the latest content regardless of published status
        let query = supabase
          .from('cms_content')
          .select('*')
          .eq('page', page)
          .eq('section', section)
          .eq('content_key', contentKey);
        
        if (!showDrafts) {
          query = query.eq('published', true);
        }
        
        // Order by updated_at desc to get the latest version
        query = query.order('updated_at', { ascending: false });
        
        const { data, error } = await query.maybeSingle();

        if (error) {
          console.warn('CMS content not found:', error);
          setError(error.message);
          return;
        }

        if (data?.content_data && typeof data.content_data === 'object' && 'text' in data.content_data) {
          setContent(data.content_data.text as string);
        }
      } catch (err) {
        console.warn('Failed to fetch CMS content:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [page, section, contentKey, showDrafts]);

  return { content, loading, error };
};