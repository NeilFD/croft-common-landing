import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Lead {
  id: string;
  status: string;
  owner_id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  event_type: string | null;
  preferred_space: string | null;
  preferred_date: string | null;
  date_flexible: boolean;
  headcount: number | null;
  budget_low: number | null;
  budget_high: number | null;
  message: string | null;
  source: string | null;
  utm: any;
  created_at: string;
  updated_at: string;
}

export interface LeadWithSpace extends Lead {
  space?: {
    id: string;
    name: string;
  };
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  type: string;
  body: string | null;
  author_id: string | null;
  meta: any;
  created_at: string;
}

export interface CreateLeadPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  event_type?: string;
  preferred_space: string;
  preferred_date?: string;
  date_flexible?: boolean;
  headcount?: number;
  budget_low?: number;
  budget_high?: number;
  message?: string;
  source?: string;
  utm?: any;
  privacy_accepted?: boolean;
  consent_marketing?: boolean;
}

// Hook to get all leads with filtering and search
export const useLeads = (filters?: {
  status?: string;
  owner_id?: string;
  space_id?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}) => {
  return useQuery({
    queryKey: ['leads', filters],
    queryFn: async (): Promise<LeadWithSpace[]> => {
      let query = supabase
        .from('leads')
        .select(`
          *,
          space:spaces(id, name)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters?.space_id) {
        query = query.eq('preferred_space', filters.space_id);
      }
      if (filters?.date_from) {
        query = query.gte('created_at', filters.date_from);
      }
      if (filters?.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      // Use fast text search if search term provided
      if (filters?.search) {
        query = query.textSearch('search_tsv', filters.search, {
          type: 'websearch',
          config: 'simple'
        });
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
  });
};

// Hook to get a single lead with activity
export const useLead = (leadId: string) => {
  return useQuery({
    queryKey: ['leads', leadId],
    queryFn: async (): Promise<LeadWithSpace | null> => {
      const { data, error } = await supabase
        .from('leads')
        .select(`
          *,
          space:spaces(id, name)
        `)
        .eq('id', leadId)
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!leadId,
  });
};

// Hook to get lead activity
export const useLeadActivity = (leadId: string) => {
  return useQuery({
    queryKey: ['lead-activity', leadId],
    queryFn: async (): Promise<LeadActivity[]> => {
      const { data, error } = await supabase
        .from('lead_activity')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    },
    enabled: !!leadId,
  });
};

// Mutation to create a lead (public endpoint)
export const useCreateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateLeadPayload): Promise<string> => {
      const { data, error } = await supabase.rpc('create_lead', { 
        payload: payload as any
      });

      if (error) {
        throw error;
      }

      // Send email notification
      try {
        await supabase.functions.invoke('send-lead-notification', {
          body: {
            leadId: data,
            leadData: {
              first_name: payload.first_name,
              last_name: payload.last_name,
              email: payload.email,
              phone: payload.phone,
              event_type: payload.event_type,
              space_name: payload.preferred_space, // Will be resolved to name in the email function
              preferred_date: payload.preferred_date,
              date_flexible: payload.date_flexible,
              headcount: payload.headcount,
              budget_low: payload.budget_low,
              budget_high: payload.budget_high,
              message: payload.message,
            },
          },
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the lead creation if email fails
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Enquiry submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit enquiry');
    },
  });
};

// Mutation to update a lead
export const useUpdateLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, patch }: { leadId: string; patch: Partial<Lead> }) => {
      const { error } = await supabase.rpc('update_lead', {
        lead_id_param: leadId,
        patch: patch,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activity', leadId] });
      toast.success('Lead updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update lead');
    },
  });
};

// Mutation to add a note to a lead
export const useAddLeadNote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, body }: { leadId: string; body: string }) => {
      const { error } = await supabase.rpc('add_lead_note', {
        lead_id_param: leadId,
        note_body: body,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['lead-activity', leadId] });
      toast.success('Note added successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add note');
    },
  });
};

// Mutation to reassign a lead
export const useReassignLead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ leadId, ownerId }: { leadId: string; ownerId: string }) => {
      const { error } = await supabase.rpc('reassign_lead', {
        lead_id_param: leadId,
        new_owner_id: ownerId,
      });

      if (error) {
        throw error;
      }
    },
    onSuccess: (_, { leadId }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads', leadId] });
      queryClient.invalidateQueries({ queryKey: ['lead-activity', leadId] });
      toast.success('Lead reassigned successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reassign lead');
    },
  });
};