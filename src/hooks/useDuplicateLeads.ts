import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDuplicateLeads = (leadId: string) => {
  return useQuery({
    queryKey: ['duplicate-leads', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_lead_possible_duplicates')
        .select(`
          possible_duplicate_id,
          leads!possible_duplicate_id(
            id,
            first_name,
            last_name,
            email,
            created_at,
            preferred_date,
            status
          )
        `)
        .eq('lead_id', leadId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!leadId,
  });
};