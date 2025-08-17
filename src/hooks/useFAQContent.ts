import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FAQContent {
  id: string;
  page: string;
  question: string;
  answer: string;
  sort_order: number;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export const useFAQContent = (page: string, showDrafts = false) => {
  const [faqs, setFaqs] = useState<FAQContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('cms_faq_content')
        .select('*')
        .eq('page', page)
        .order('sort_order', { ascending: true });

      if (!showDrafts) {
        query = query.eq('published', true);
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setFaqs(data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching FAQ content:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch FAQ content');
    } finally {
      setLoading(false);
    }
  };

  const refreshFAQs = () => fetchFAQs();

  useEffect(() => {
    fetchFAQs();
  }, [page, showDrafts]);

  return {
    faqs,
    loading,
    error,
    refreshFAQs
  };
};