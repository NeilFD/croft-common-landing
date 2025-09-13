import { useMemo } from 'react';
import { useCMSContentBatch } from '@/hooks/useCMSContentBatch';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface KitchensMenuItem {
  name: string;
  description?: string;
  price?: string;
}

export interface KitchensMenuSection {
  title: string;
  items: KitchensMenuItem[];
}

interface CMSMenuItem {
  id: string;
  item_name: string;
  description?: string;
  price?: string;
  sort_order: number;
}

interface CMSMenuSection {
  id: string;
  section_name: string;
  sort_order: number;
  items?: CMSMenuItem[];
}

// Hook to fetch menu data from CMS
export const useKitchensMenuData = (tabName: string, showDrafts: boolean = false) => {
  const pageKey = `kitchens-${tabName}`;
  
  const { data: sections, isLoading: sectionsLoading, error: sectionsError } = useQuery({
    queryKey: ['kitchens-menu-sections', pageKey, showDrafts],
    queryFn: async () => {
      let query = supabase
        .from('cms_menu_sections')
        .select(`
          id,
          section_name,
          sort_order,
          cms_menu_items (
            id,
            item_name,
            description,
            price,
            sort_order,
            published
          )
        `)
        .eq('page', pageKey)
        .order('sort_order');

      if (!showDrafts) {
        query = query.eq('published', true).eq('cms_menu_items.published', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (CMSMenuSection & { cms_menu_items: CMSMenuItem[] })[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });

  const menuData = useMemo(() => {
    if (!sections) return [];
    
    return sections.map((section): KitchensMenuSection => ({
      title: section.section_name,
      items: (section.cms_menu_items || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item): KitchensMenuItem => ({
          name: item.item_name,
          description: item.description || undefined,
          price: item.price || undefined
        }))
    }));
  }, [sections]);

  return {
    data: menuData,
    loading: sectionsLoading,
    error: sectionsError
  };
};

// Hook to fetch recipe data from CMS
export const useKitchensRecipeData = (recipeId: string) => {
  const queries = [
    { page: 'kitchens-recipes', section: recipeId, contentKey: 'metadata' },
    { page: 'kitchens-recipes', section: recipeId, contentKey: 'the-idea' },
    { page: 'kitchens-recipes', section: recipeId, contentKey: 'youll-need' },
    { page: 'kitchens-recipes', section: recipeId, contentKey: 'the-cook' }
  ];

  const { contents, loading, error, getContent } = useCMSContentBatch(queries);

  const recipeData = useMemo(() => {
    const metadata = getContent('kitchens-recipes', recipeId, 'metadata');
    const theIdea = getContent('kitchens-recipes', recipeId, 'the-idea');
    const youllNeed = getContent('kitchens-recipes', recipeId, 'youll-need');
    const theCook = getContent('kitchens-recipes', recipeId, 'the-cook');

    if (!metadata && !theIdea && !youllNeed && !theCook) {
      return null;
    }

    return {
      metadata: metadata?.content_data || {},
      theIdea: theIdea?.content_data?.text || '',
      youllNeed: youllNeed?.content_data?.items || [],
      theCook: theCook?.content_data?.steps || []
    };
  }, [contents, recipeId, getContent]);

  return {
    data: recipeData,
    loading,
    error
  };
};