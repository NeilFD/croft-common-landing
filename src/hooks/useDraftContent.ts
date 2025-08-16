import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDraftContent = (page: string) => {
  const [draftCount, setDraftCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDraftCount = async () => {
    try {
      setLoading(true);
      const { count, error } = await supabase
        .from('cms_content')
        .select('*', { count: 'exact', head: true })
        .eq('page', page)
        .eq('published', false);

      if (error) {
        console.warn('Failed to fetch draft count:', error);
        return;
      }

      setDraftCount(count || 0);
    } catch (err) {
      console.warn('Error fetching draft count:', err);
    } finally {
      setLoading(false);
    }
  };

  const publishDrafts = async () => {
    try {
      const { error } = await supabase
        .from('cms_content')
        .update({ published: true })
        .eq('page', page)
        .eq('published', false);

      if (error) {
        throw error;
      }

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
    const handleDraftChange = () => {
      fetchDraftCount();
    };
    
    window.addEventListener('draftContentChanged', handleDraftChange);
    
    return () => {
      window.removeEventListener('draftContentChanged', handleDraftChange);
    };
  }, [page]);

  return { 
    draftCount, 
    loading, 
    publishDrafts, 
    refreshDraftCount: fetchDraftCount 
  };
};