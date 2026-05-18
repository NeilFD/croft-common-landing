import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { MarketingCampaign } from '@/lib/marketing/types';
import type { Lane } from '@/lib/marketing/programme';

export interface ProgrammeRange {
  from: string; // ISO date (yyyy-MM-dd)
  to: string;
}

export const useProgrammeCampaigns = (range: ProgrammeRange) =>
  useQuery({
    queryKey: ['marketing', 'programme', range.from, range.to],
    queryFn: async (): Promise<MarketingCampaign[]> => {
      // Pull anything that overlaps the window. An "overlap" is
      // (start <= window.end) AND (end >= window.start). Items with NULL
      // dates are excluded from the Gantt (they have no bar to draw).
      const { data, error } = await (supabase as any)
        .from('marketing_campaigns')
        .select('*')
        .lte('start_date', range.to)
        .gte('end_date', range.from)
        .order('lane');
      if (error) throw error;
      return data || [];
    },
  });

export interface CampaignPatch {
  id?: string;
  name?: string;
  lane?: Lane;
  property_tag?: 'town' | 'country' | 'group' | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  colour?: string | null;
  notes?: string | null;
  goal?: string | null;
  kpi?: string | null;
}

export const useUpsertCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: CampaignPatch) => {
      const { id, ...rest } = patch;
      if (id) {
        const { error } = await (supabase as any)
          .from('marketing_campaigns')
          .update(rest)
          .eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data: { user } } = await supabase.auth.getUser();
      const insertRow: any = {
        name: 'Untitled campaign',
        status: 'planned',
        lane: 'live_campaign',
        ...rest,
        owner_id: user?.id ?? null,
      };
      const { data, error } = await (supabase as any)
        .from('marketing_campaigns')
        .insert(insertRow)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing', 'programme'] });
      qc.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
    },
  });
};

export const useDeleteCampaign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('marketing_campaigns')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['marketing', 'programme'] });
      qc.invalidateQueries({ queryKey: ['marketing', 'campaigns'] });
    },
  });
};

/**
 * Optimistic date update used by the Gantt drag handlers. Patches the cache
 * immediately and commits on pointer up.
 */
export const useOptimisticDates = () => {
  const qc = useQueryClient();
  return (id: string, start_date: string, end_date: string) => {
    qc.setQueriesData<MarketingCampaign[]>({ queryKey: ['marketing', 'programme'] }, (old) => {
      if (!old) return old;
      return old.map((c) => (c.id === id ? { ...c, start_date, end_date } : c));
    });
  };
};
