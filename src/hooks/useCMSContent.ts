import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CMSContentData {
  text?: string;
  [key: string]: any;
}

interface CMSContent {
  id: string;
  content_data: CMSContentData;
  published: boolean;
}

interface UseCMSContentProps {
  page: string;
  section: string;
  content_key: string;
  fallback?: string;
}

export const useCMSContent = ({ page, section, content_key, fallback = '' }: UseCMSContentProps) => {
  const [content, setContent] = useState<string>(fallback);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('cms_content')
          .select('id, content_data, published')
          .eq('page', page)
          .eq('section', section)
          .eq('content_key', content_key)
          .eq('published', true)
          .maybeSingle();

        if (fetchError) {
          console.warn('CMS content fetch error:', fetchError);
          setError(fetchError.message);
          setContent(fallback);
          return;
        }

        if (data && typeof data.content_data === 'object' && data.content_data && 'text' in data.content_data) {
          setContent(data.content_data.text as string);
        } else {
          setContent(fallback);
        }
      } catch (err) {
        console.warn('CMS content error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setContent(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [page, section, content_key, fallback]);

  return { content, loading, error };
};