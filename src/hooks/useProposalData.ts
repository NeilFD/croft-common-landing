import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProposalVersion {
  id: string;
  event_id: string;
  version_no: number;
  beo_version_id?: string;
  pdf_url?: string;
  generated_by?: string;
  generated_at: string;
  status: 'draft' | 'sent' | 'approved' | 'superseded';
  client_viewed_at?: string;
  client_approved_at?: string;
  notes?: string;
  content_snapshot: any;
  created_at: string;
}

export interface ProposalContent {
  eventOverview: {
    eventName: string;
    eventDate: string;
    headcount: number;
    clientName: string;
    contactEmail: string;
  };
  setup: {
    spaces: Array<{
      space_name: string;
      layout_type: string;
      capacity?: number;
      setup_notes?: string;
      setup_time?: string;
      breakdown_time?: string;
    }>;
  };
  menu: {
    courses: Array<{
      course: string;
      items: Array<{
        item_name: string;
        description?: string;
        allergens?: string[];
      }>;
    }>;
  };
  timeline: {
    schedule: Array<{
      time_label: string;
      scheduled_at: string;
      duration_minutes?: number;
      notes?: string;
    }>;
  };
  pricing: {
    lineItems: Array<{
      type: 'room' | 'menu' | 'addon' | 'discount';
      description: string;
      qty: number;
      unit_price: number;
      per_person: boolean;
    }>;
    serviceChargePct: number;
  };
  equipment?: Array<{
    category: string;
    item_name: string;
    quantity: number;
    specifications?: string;
  }>;
}

// Hook for fetching proposal versions
export const useProposalVersions = (eventId: string) => {
  return useQuery({
    queryKey: ['proposal-versions', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('proposal_versions')
        .select('*')
        .eq('event_id', eventId)
        .order('version_no', { ascending: false });

      if (error) throw error;
      return data as ProposalVersion[];
    },
    enabled: !!eventId
  });
};

// Hook for fetching the current/latest proposal
export const useCurrentProposal = (eventId: string) => {
  return useQuery({
    queryKey: ['current-proposal', eventId],
    queryFn: async () => {
      const { data: proposal, error: proposalError } = await supabase
        .from('proposal_versions')
        .select('*')
        .eq('event_id', eventId)
        .order('version_no', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (proposalError) throw proposalError;
      if (!proposal) return null;

      // Fetch line items for this event
      const { data: lineItems, error: lineItemsError } = await supabase
        .from('management_event_line_items')
        .select('*')
        .eq('event_id', eventId)
        .order('category', { ascending: true })
        .order('item_order', { ascending: true });

      if (lineItemsError) throw lineItemsError;

      return {
        ...proposal,
        lineItems: lineItems || []
      } as ProposalVersion & { lineItems: any[] };
    },
    enabled: !!eventId
  });
};

// Hook for proposal mutations
export const useProposalMutations = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const generateProposalFromBEO = useMutation({
    mutationFn: async (beoVersionId?: string) => {
      console.log('Generating proposal from BEO for event:', eventId);
      const { data, error } = await supabase.functions.invoke('generate-proposal-from-beo', {
        body: { eventId, beoVersionId }
      });
      console.log('Proposal generation response:', { data, error });
      if (error) {
        console.error('Proposal generation error:', error);
        throw error;
      }
      return data;
    },
    onSuccess: (data) => {
      console.log('Proposal generated successfully:', data);
      queryClient.invalidateQueries({ queryKey: ['proposal-versions', eventId] });
      queryClient.invalidateQueries({ queryKey: ['current-proposal', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event-line-items', eventId] });
      toast({ 
        title: "Proposal updated",
        description: "Proposal has been auto-populated from the BEO."
      });
    },
    onError: (error: any) => {
      console.error('Proposal generation mutation error:', error);
      toast({
        title: "Error updating proposal",
        description: error?.message || 'Failed to update proposal from BEO.',
        variant: "destructive"
      });
    }
  });

  const updateProposalStatus = useMutation({
    mutationFn: async (params: {
      versionId: string;
      status: ProposalVersion['status'];
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('proposal_versions')
        .update({
          status: params.status,
          notes: params.notes
        })
        .eq('id', params.versionId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-versions', eventId] });
      queryClient.invalidateQueries({ queryKey: ['current-proposal', eventId] });
      toast({ title: "Proposal status updated" });
    },
    onError: (error) => {
      toast({
        title: "Error updating proposal status",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const markProposalApproved = useMutation({
    mutationFn: async (versionId: string) => {
      const { data, error } = await supabase
        .from('proposal_versions')
        .update({
          status: 'approved',
          client_approved_at: new Date().toISOString()
        })
        .eq('id', versionId);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposal-versions', eventId] });
      queryClient.invalidateQueries({ queryKey: ['current-proposal', eventId] });
      toast({ 
        title: "Proposal approved",
        description: "This proposal is now ready for contract generation."
      });
    },
    onError: (error) => {
      toast({
        title: "Error approving proposal",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    generateProposalFromBEO,
    updateProposalStatus,
    markProposalApproved
  };
};
