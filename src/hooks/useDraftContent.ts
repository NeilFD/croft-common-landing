import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDraftContent = (page: string) => {
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDraftCount = async () => {
    try {
      setLoading(true);
      console.log('🎯 useDraftContent: Fetching draft count for page:', page);
      
      // Count page-specific drafts
      const { count: pageCount, error: pageError } = await supabase
        .from('cms_content')
        .select('*', { count: 'exact', head: true })
        .eq('page', page)
        .eq('published', false);

      if (pageError) {
        console.warn('Failed to fetch page draft count:', pageError);
        return;
      }

      // Count global content drafts (affects all pages)
      const { count: globalCount, error: globalError } = await supabase
        .from('cms_global_content')
        .select('*', { count: 'exact', head: true })
        .eq('published', false);

      if (globalError) {
        console.warn('Failed to fetch global draft count:', globalError);
        return;
      }

      const totalDrafts = (pageCount || 0) + (globalCount || 0);
      console.log('🎯 useDraftContent: Found', pageCount, 'page drafts and', globalCount, 'global drafts for page:', page);
      setDraftCount(totalDrafts);
    } catch (err) {
      console.warn('Error fetching draft count:', err);
    } finally {
      setLoading(false);
    }
  };

  const publishDrafts = async () => {
    try {
      console.log('🎯 useDraftContent: Publishing drafts for page:', page);
      
      // Publish page-specific drafts
      const { error: pageError } = await supabase
        .from('cms_content')
        .update({ published: true })
        .eq('page', page)
        .eq('published', false);

      if (pageError) {
        console.error('🎯 useDraftContent: Page publish error:', pageError);
        throw pageError;
      }

      // Publish global content drafts
      const { error: globalError } = await supabase
        .from('cms_global_content')
        .update({ published: true })
        .eq('published', false);

      if (globalError) {
        console.error('🎯 useDraftContent: Global publish error:', globalError);
        throw globalError;
      }

      console.log('🎯 useDraftContent: Publish successful for page:', page);
      // Refresh draft count after publishing
      await fetchDraftCount();
      
      return { success: true };
    } catch (error) {
      console.error('Failed to publish drafts:', error);
      return { success: false, error };
    }
  };

  useEffect(() => {
    fetchDraftCount();
    
    // Listen for draft content changes
    const handleDraftChange = (event: CustomEvent) => {
      console.log('🎯 useDraftContent: Received draftContentChanged event:', event.detail);
      fetchDraftCount();
    };
    
    window.addEventListener('draftContentChanged', handleDraftChange as EventListener);
    
    return () => {
      window.removeEventListener('draftContentChanged', handleDraftChange as EventListener);
    };
  }, [page]);

  return { 
    draftCount, 
    loading, 
    publishDrafts, 
    refreshDraftCount: fetchDraftCount 
  };
};