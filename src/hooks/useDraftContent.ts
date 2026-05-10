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
      const { count: pageCount, error: pageError } = await (supabase as any)
        .from('cms_content')
        .select('*', { count: 'exact', head: true })
        .eq('page', page)
        .eq('published', false);

      if (pageError) {
        console.warn('Failed to fetch page draft count:', pageError);
        return;
      }

      // Note: cms_global_content does not have a `published` column, so it
      // is not part of the draft/publish flow.
      const totalDrafts = pageCount || 0;
      console.log('🎯 useDraftContent: Found', pageCount, 'page drafts for page:', page);
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
      const { error: pageError } = await (supabase as any)
        .from('cms_content')
        .update({ published: true })
        .eq('page', page)
        .eq('published', false);

      if (pageError) {
        console.error('🎯 useDraftContent: Page publish error:', pageError);
        throw pageError;
      }

      // Note: cms_global_content has no `published` column, so it is skipped here.

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
      // Optimistic bump so the Publish button enables immediately
      setDraftCount((c) => c + 1);
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