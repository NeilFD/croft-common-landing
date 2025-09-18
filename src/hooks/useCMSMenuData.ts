import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface CMSMenuItem {
  name: string;
  description?: string;
  price?: string;
}

export interface CMSMenuSection {
  title: string;
  items: CMSMenuItem[];
}

interface DatabaseMenuItem {
  id: string;
  item_name: string;
  description?: string;
  price?: string;
  sort_order: number;
}

interface DatabaseMenuSection {
  id: string;
  section_name: string;
  sort_order: number;
  items?: DatabaseMenuItem[];
}

// Generic hook to fetch menu data from CMS for any page
export const useCMSMenuData = (page: string, showDrafts: boolean = false) => {
  const { data: sections, isLoading: sectionsLoading, error: sectionsError } = useQuery({
    queryKey: ['cms-menu-sections', page, showDrafts],
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
        .eq('page', page)
        .order('sort_order');

      if (!showDrafts) {
        query = query.eq('published', true).eq('cms_menu_items.published', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as (DatabaseMenuSection & { cms_menu_items: DatabaseMenuItem[] })[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });

  const menuData = useMemo(() => {
    if (!sections) return [];
    
    return sections.map((section): CMSMenuSection => ({
      title: section.section_name,
      items: (section.cms_menu_items || [])
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((item): CMSMenuItem => ({
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