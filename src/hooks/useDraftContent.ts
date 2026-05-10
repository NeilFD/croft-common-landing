import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDraftContent = (page: string) => {
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDraftCount = async () => {
    try {
      setLoading(true);
      console.log('🎯 useDraftContent: Fetching draft count for page:', page);
      
      // Count page-specific text drafts
      const { count: pageCount, error: pageError } = await (supabase as any)
        .from('cms_content')
        .select('*', { count: 'exact', head: true })
        .eq('page', page)
        .eq('published', false);

      if (pageError) {
        console.warn('Failed to fetch page draft count:', pageError);
      }

      // Count image drafts for the same page
      const { count: imgCount, error: imgError } = await (supabase as any)
        .from('cms_images')
        .select('*', { count: 'exact', head: true })
        .eq('page', page)
        .eq('is_draft', true);

      if (imgError) {
        console.warn('Failed to fetch image draft count:', imgError);
      }

      const totalDrafts = (pageCount || 0) + (imgCount || 0);
      console.log('🎯 useDraftContent: Found', pageCount, 'text drafts and', imgCount, 'image drafts for page:', page);
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
      
      // Publish page-specific text drafts
      const { error: pageError } = await (supabase as any)
        .from('cms_content')
        .update({ published: true })
        .eq('page', page)
        .eq('published', false);

      if (pageError) {
        console.error('🎯 useDraftContent: Page publish error:', pageError);
        throw pageError;
      }

      // Publish image drafts: replace published rows then flip drafts
      const { data: draftImgs } = await (supabase as any)
        .from('cms_images')
        .select('slot')
        .eq('page', page)
        .eq('is_draft', true);
      const slots = Array.from(new Set(((draftImgs as any[]) ?? []).map((r) => r.slot).filter(Boolean)));
      for (const slot of slots) {
        await (supabase as any)
          .from('cms_images')
          .delete()
          .eq('page', page)
          .eq('slot', slot)
          .eq('published', true)
          .eq('is_draft', false);
        await (supabase as any)
          .from('cms_images')
          .update({ published: true, is_draft: false })
          .eq('page', page)
          .eq('slot', slot)
          .eq('is_draft', true);
      }

      console.log('🎯 useDraftContent: Publish successful for page:', page);
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