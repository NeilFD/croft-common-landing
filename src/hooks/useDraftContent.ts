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

      // Count FAQ drafts for the same page
      const { count: faqCount, error: faqError } = await (supabase as any)
        .from('cms_faq_content')
        .select('*', { count: 'exact', head: true })
        .eq('page', page)
        .eq('is_draft', true);

      if (faqError) {
        console.warn('Failed to fetch FAQ draft count:', faqError);
      }

      // Count list-item drafts (timelines, collages, etc.) for the same page
      const { count: listCount, error: listError } = await (supabase as any)
        .from('cms_list_items')
        .select('*', { count: 'exact', head: true })
        .eq('page', page)
        .eq('is_draft', true);

      if (listError) {
        console.warn('Failed to fetch list draft count:', listError);
      }

      const totalDrafts = (pageCount || 0) + (imgCount || 0) + (faqCount || 0) + (listCount || 0);
      console.log('🎯 useDraftContent: Found', pageCount, 'text /', imgCount, 'image /', faqCount, 'faq /', listCount, 'list drafts for page:', page);
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

      // Publish FAQ drafts: delete published rows for this page, then flip drafts to published.
      const { data: draftFaqs } = await (supabase as any)
        .from('cms_faq_content')
        .select('id')
        .eq('page', page)
        .eq('is_draft', true);
      if (draftFaqs && draftFaqs.length > 0) {
        await (supabase as any)
          .from('cms_faq_content')
          .delete()
          .eq('page', page)
          .eq('published', true)
          .eq('is_draft', false);
        await (supabase as any)
          .from('cms_faq_content')
          .update({ published: true, is_draft: false })
          .eq('page', page)
          .eq('is_draft', true);
      }

      // Publish list-item drafts per (page, section). For each draft, only delete the
      // matching published row at the SAME sort_order (per-row replacement). This avoids
      // wiping unrelated published entries that the user did not edit.
      const { data: draftLists } = await (supabase as any)
        .from('cms_list_items')
        .select('section, sort_order')
        .eq('page', page)
        .eq('is_draft', true);
      const draftRows = (draftLists as Array<{ section: string; sort_order: number }> | null) ?? [];
      const sections = Array.from(new Set(draftRows.map((r) => r.section).filter(Boolean)));
      for (const section of sections) {
        const orders = Array.from(
          new Set(draftRows.filter((r) => r.section === section).map((r) => r.sort_order)),
        );
        if (orders.length > 0) {
          await (supabase as any)
            .from('cms_list_items')
            .delete()
            .eq('page', page)
            .eq('section', section)
            .eq('published', true)
            .eq('is_draft', false)
            .in('sort_order', orders);
        }
        await (supabase as any)
          .from('cms_list_items')
          .update({ published: true, is_draft: false })
          .eq('page', page)
          .eq('section', section)
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