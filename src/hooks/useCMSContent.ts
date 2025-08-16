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
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchContent = async () => {
    try {
      setLoading(true);
      
      console.log('🎯 useCMSContent: Fetching content for', { page, section, contentKey, showDrafts });
      
      // Build query - if showDrafts is true, get the latest content regardless of published status
      let query = supabase
        .from('cms_content')
        .select('*')
        .eq('page', page)
        .eq('section', section)
        .eq('content_key', contentKey);
      
      if (!showDrafts) {
        console.log('🎯 useCMSContent: Only fetching published content');
        query = query.eq('published', true);
      } else {
        console.log('🎯 useCMSContent: Fetching all content (including drafts)');
      }
      
      // Order by updated_at desc to get the latest version
      query = query.order('updated_at', { ascending: false });
      
      const { data, error } = await query.maybeSingle();

      console.log('🎯 useCMSContent: Query result:', { data, error, showDrafts });

      if (error) {
        console.warn('CMS content not found:', error);
        setError(error.message);
        return;
      }

      if (data?.content_data && typeof data.content_data === 'object' && 'text' in data.content_data) {
        console.log('🎯 useCMSContent: Setting content to:', data.content_data.text);
        setContent(data.content_data.text as string);
      } else {
        console.log('🎯 useCMSContent: No valid content data found, data:', data);
      }
    } catch (err) {
      console.warn('Failed to fetch CMS content:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [page, section, contentKey, showDrafts, refreshTrigger]);

  const refreshContent = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return { content, loading, error, refreshContent };
};