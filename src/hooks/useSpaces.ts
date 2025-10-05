import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Space {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  capacity_seated: number;
  capacity_standing: number;
  min_guests?: number | null;
  max_guests?: number | null;
  is_active: boolean;
  display_order: number;
  combinable_with?: string[] | null;
  ambience?: string | null;
  natural_light?: string | null;
  outdoor_access?: boolean;
  av_capabilities?: string[] | null;
  layout_flexibility?: string | null;
  catering_style?: string[] | null;
  ideal_event_types?: string[] | null;
  unique_features?: string[] | null;
  accessibility_features?: string[] | null;
  pricing_tier?: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SpaceHours {
  id: string;
  space_id: string;
  day_of_week: number;
  open_time: string | null;
  close_time: string | null;
  late_close_allowed: boolean;
  buffer_before_min: number;
  buffer_after_min: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSpaceData {
  name: string;
  slug: string;
  description?: string;
  capacity_seated: number;
  capacity_standing: number;
  min_guests?: number;
  max_guests?: number;
  is_active?: boolean;
  display_order?: number;
  combinable_with?: string[];
  ambience?: string;
  natural_light?: string;
  outdoor_access?: boolean;
  av_capabilities?: string[];
  layout_flexibility?: string;
  catering_style?: string[];
  ideal_event_types?: string[];
  unique_features?: string[];
  accessibility_features?: string[];
  pricing_tier?: string[];
}

export interface UpdateSpaceData extends Partial<CreateSpaceData> {
  id: string;
}

export const useSpaces = () => {
  return useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as Space[];
    }
  });
};

export const useActiveSpaces = () => {
  return useQuery({
    queryKey: ['spaces', 'active'],
    queryFn: async (): Promise<Space[]> => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw error;
      }

      return data as Space[];
    },
  });
};

export const useSpace = (id: string) => {
  return useQuery({
    queryKey: ['space', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Space;
    },
    enabled: !!id
  });
};

export const useSpaceHours = (spaceId: string) => {
  return useQuery({
    queryKey: ['space-hours', spaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('space_hours')
        .select('*')
        .eq('space_id', spaceId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return data as SpaceHours[];
    },
    enabled: !!spaceId
  });
};

export const useCreateSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateSpaceData) => {
      const { data: space, error } = await supabase
        .from('spaces')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      // Log audit entry
      await supabase.rpc('log_audit_entry', {
        _action: 'CREATE',
        _entity: 'spaces',
        _entity_id: space.id,
        _diff: data as any
      });

      return space;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast({
        title: "Space created",
        description: "The space has been created successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create space",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

export const useUpdateSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateSpaceData) => {
      const { data: space, error } = await supabase
        .from('spaces')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log audit entry
      await supabase.rpc('log_audit_entry', {
        _action: 'UPDATE',
        _entity: 'spaces',
        _entity_id: id,
        _diff: data
      });

      return space;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      queryClient.invalidateQueries({ queryKey: ['space', variables.id] });
      toast({
        title: "Space updated",
        description: "The space has been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update space",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

export const useDeleteSpace = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('spaces')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Log audit entry
      await supabase.rpc('log_audit_entry', {
        _action: 'DELETE',
        _entity: 'spaces',
        _entity_id: id
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
      toast({
        title: "Space deleted",
        description: "The space has been deleted successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete space",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};

export const useUpdateSpaceHours = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ spaceId, hours }: { spaceId: string; hours: Partial<SpaceHours>[] }) => {
      const updates = hours.map(hour => ({
        space_id: spaceId,
        day_of_week: hour.day_of_week!,
        open_time: hour.open_time || null,
        close_time: hour.close_time || null,
        late_close_allowed: hour.late_close_allowed || false,
        buffer_before_min: hour.buffer_before_min || 0,
        buffer_after_min: hour.buffer_after_min || 0
      }));

      const { data, error } = await supabase
        .from('space_hours')
        .upsert(updates, { onConflict: 'space_id,day_of_week' })
        .select();

      if (error) throw error;

      // Log audit entry
      await supabase.rpc('log_audit_entry', {
        _action: 'UPDATE',
        _entity: 'space_hours',
        _entity_id: spaceId,
        _diff: { updated_hours: updates }
      });

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['space-hours', variables.spaceId] });
      toast({
        title: "Trading hours updated",
        description: "The trading hours have been updated successfully"
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update trading hours",
        description: error.message,
        variant: "destructive"
      });
    }
  });
};