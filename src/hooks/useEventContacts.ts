import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EventContact {
  id: string;
  event_id: string;
  contact_type: 'primary' | 'management' | 'emergency' | 'vendor';
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useEventContacts = (eventId: string) => {
  return useQuery({
    queryKey: ['event-contacts', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_contacts')
        .select('*')
        .eq('event_id', eventId)
        .order('contact_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data as EventContact[];
    },
    enabled: !!eventId
  });
};

export const useContactMutations = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addContact = useMutation({
    mutationFn: async (params: {
      contact_type: string;
      name: string;
      role?: string;
      phone?: string;
      email?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('event_contacts')
        .insert({
          event_id: eventId,
          ...params
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts', eventId] });
      toast({ title: "Contact added successfully" });
    },
    onError: (error: any) => {
      console.error('Error adding contact:', error);
      toast({
        title: "Error",
        description: error?.message || 'Failed to add contact',
        variant: "destructive"
      });
    }
  });

  const updateContact = useMutation({
    mutationFn: async (params: {
      id: string;
      contact_type?: string;
      name?: string;
      role?: string;
      phone?: string;
      email?: string;
      notes?: string;
    }) => {
      const { id, ...updateData } = params;
      const { data, error } = await supabase
        .from('event_contacts')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts', eventId] });
      toast({ title: "Contact updated successfully" });
    },
    onError: (error: any) => {
      console.error('Error updating contact:', error);
      toast({
        title: "Error",
        description: error?.message || 'Failed to update contact',
        variant: "destructive"
      });
    }
  });

  const deleteContact = useMutation({
    mutationFn: async (contactId: string) => {
      const { error } = await supabase
        .from('event_contacts')
        .delete()
        .eq('id', contactId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-contacts', eventId] });
      toast({ title: "Contact deleted successfully" });
    },
    onError: (error: any) => {
      console.error('Error deleting contact:', error);
      toast({
        title: "Error",
        description: error?.message || 'Failed to delete contact',
        variant: "destructive"
      });
    }
  });

  return {
    addContact,
    updateContact,
    deleteContact
  };
};