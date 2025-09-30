import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types for BEO data
export interface EventMenu {
  id: string;
  event_id: string;
  course: string;
  item_name: string;
  description?: string;
  price?: number;
  notes?: string;
  allergens?: string[];
  created_at: string;
  updated_at: string;
}

export interface EventStaffing {
  id: string;
  event_id: string;
  role: string;
  qty: number;
  shift_start?: string;
  shift_end?: string;
  hourly_rate?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EventSchedule {
  id: string;
  event_id: string;
  time_label: string;
  scheduled_at: string;
  duration_minutes?: number;
  responsible_role?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EventRoomLayout {
  id: string;
  event_id: string;
  space_name: string;
  layout_type: string;
  capacity?: number;
  setup_notes?: string;
  setup_time?: string;
  breakdown_time?: string;
  special_requirements?: string;
  created_at: string;
  updated_at: string;
}

export interface EventEquipment {
  id: string;
  event_id: string;
  category: string;
  item_name: string;
  quantity: number;
  specifications?: string;
  delivery_time?: string;
  collection_time?: string;
  hire_cost?: number;
  supplier?: string;
  contact_details?: string;
  setup_instructions?: string;
  created_at: string;
  updated_at: string;
}

export interface BEOVersion {
  id: string;
  event_id: string;
  version_no: number;
  pdf_url?: string;
  generated_by?: string;
  generated_at: string;
  notes?: string;
  is_final: boolean;
}

// Hook for fetching event menus
export const useEventMenus = (eventId: string) => {
  return useQuery({
    queryKey: ['event-menus', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_menus')
        .select('*')
        .eq('event_id', eventId)
        .order('course', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      return data as EventMenu[];
    },
    enabled: !!eventId
  });
};

// Hook for fetching event staffing
export const useEventStaffing = (eventId: string) => {
  return useQuery({
    queryKey: ['event-staffing', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_staffing')
        .select('*')
        .eq('event_id', eventId)
        .order('role', { ascending: true });

      if (error) throw error;
      return data as EventStaffing[];
    },
    enabled: !!eventId
  });
};

// Hook for fetching event schedule
export const useEventSchedule = (eventId: string) => {
  return useQuery({
    queryKey: ['event-schedule', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_schedule')
        .select('*')
        .eq('event_id', eventId)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data as EventSchedule[];
    },
    enabled: !!eventId
  });
};

// Hook for fetching event room layouts
export const useEventRoomLayouts = (eventId: string) => {
  return useQuery({
    queryKey: ['event-room-layouts', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_room_layouts')
        .select('*')
        .eq('event_id', eventId)
        .order('space_name', { ascending: true });

      if (error) throw error;
      return data as EventRoomLayout[];
    },
    enabled: !!eventId
  });
};

// Hook for fetching event equipment
export const useEventEquipment = (eventId: string) => {
  return useQuery({
    queryKey: ['event-equipment', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_equipment')
        .select('*')
        .eq('event_id', eventId)
        .order('category', { ascending: true })
        .order('item_name', { ascending: true });

      if (error) throw error;
      return data as EventEquipment[];
    },
    enabled: !!eventId
  });
};

// Hook for fetching BEO versions
export const useBEOVersions = (eventId: string) => {
  return useQuery({
    queryKey: ['beo-versions', eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('event_beo_versions')
        .select('*')
        .eq('event_id', eventId)
        .order('version_no', { ascending: false });

      if (error) throw error;
      return data as BEOVersion[];
    },
    enabled: !!eventId
  });
};

// Mutations for BEO management
export const useBEOMutations = (eventId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const addMenuItem = useMutation({
    mutationFn: async (params: {
      course: string;
      item_name: string;
      description?: string;
      price?: number;
      notes?: string;
      allergens?: string[];
    }) => {
      const { data, error } = await supabase
        .from('event_menus')
        .insert({
          event_id: eventId,
          course: params.course,
          item_name: params.item_name,
          description: params.description,
          price: params.price,
          notes: params.notes,
          allergens: params.allergens || []
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-menus', eventId] });
      toast({ title: "Menu item added successfully" });
    },
    onError: (error: any) => {
      console.error('Error adding menu item:', error);
      const errorMessage = error?.message?.includes('foreign key constraint')
        ? 'This event does not exist. Please check the event details.'
        : 'Failed to add menu item. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const addStaffingRequirement = useMutation({
    mutationFn: async (params: {
      role: string;
      qty: number;
      shift_start?: string;
      shift_end?: string;
      hourly_rate?: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('event_staffing')
        .insert({
          event_id: eventId,
          role: params.role,
          qty: params.qty,
          shift_start: params.shift_start,
          shift_end: params.shift_end,
          hourly_rate: params.hourly_rate,
          notes: params.notes
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-staffing', eventId] });
      toast({ title: "Staffing requirement added successfully" });
    },
    onError: (error: any) => {
      console.error('Error adding staffing requirement:', error);
      const errorMessage = error?.message?.includes('foreign key constraint')
        ? 'This event does not exist. Please check the event details.'
        : 'Failed to add staffing requirement. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const addScheduleItem = useMutation({
    mutationFn: async (params: {
      time_label: string;
      scheduled_at: string;
      duration_minutes?: number;
      responsible_role?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('event_schedule')
        .insert({
          event_id: eventId,
          time_label: params.time_label,
          scheduled_at: params.scheduled_at,
          duration_minutes: params.duration_minutes,
          responsible_role: params.responsible_role,
          notes: params.notes
        });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-schedule', eventId] });
      toast({ title: "Schedule item added successfully" });
    },
    onError: (error: any) => {
      console.error('Error adding schedule item:', error);
      const errorMessage = error?.message?.includes('foreign key constraint')
        ? 'This event does not exist. Please check the event details.'
        : 'Failed to add schedule item. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const addRoomLayout = useMutation({
    mutationFn: async (params: {
      space_name: string;
      layout_type: string;
      capacity?: number;
      setup_notes?: string;
      setup_time?: string;
      breakdown_time?: string;
      special_requirements?: string;
    }) => {
      const { data, error } = await supabase.rpc('add_room_layout', {
        p_event_id: eventId,
        p_space_name: params.space_name,
        p_layout_type: params.layout_type,
        p_capacity: params.capacity,
        p_setup_notes: params.setup_notes,
        p_setup_time: params.setup_time,
        p_breakdown_time: params.breakdown_time,
        p_special_requirements: params.special_requirements
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-room-layouts', eventId] });
      toast({ title: "Room layout added successfully" });
    },
    onError: (error: any) => {
      console.error('Error adding room layout:', error);
      const errorMessage = error?.message?.includes('foreign key constraint')
        ? 'This event does not exist. Please check the event details.'
        : 'Failed to add room layout. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const addEquipmentItem = useMutation({
    mutationFn: async (params: {
      category: string;
      item_name: string;
      quantity: number;
      specifications?: string;
      delivery_time?: string;
      collection_time?: string;
      hire_cost?: number;
      supplier?: string;
      contact_details?: string;
      setup_instructions?: string;
    }) => {
      const { data, error } = await supabase.rpc('add_equipment_item', {
        p_event_id: eventId,
        p_category: params.category,
        p_item_name: params.item_name,
        p_quantity: params.quantity,
        p_specifications: params.specifications,
        p_delivery_time: params.delivery_time,
        p_collection_time: params.collection_time,
        p_hire_cost: params.hire_cost,
        p_supplier: params.supplier,
        p_contact_details: params.contact_details,
        p_setup_instructions: params.setup_instructions
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-equipment', eventId] });
      toast({ title: "Equipment item added successfully" });
    },
    onError: (error: any) => {
      console.error('Error adding equipment item:', error);
      const errorMessage = error?.message?.includes('foreign key constraint')
        ? 'This event does not exist. Please check the event details.'
        : 'Failed to add equipment item. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const generateBEO = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('generate-beo-pdf', {
        body: { eventId }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beo-versions', eventId] });
      toast({ title: "BEO generated successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error generating BEO",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteMenuItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('event_menus')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-menus', eventId] });
      toast({ title: "Menu item deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting menu item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteStaffingRequirement = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('event_staffing')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-staffing', eventId] });
      toast({ title: "Staffing requirement deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting staffing requirement",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteScheduleItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('event_schedule')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-schedule', eventId] });
      toast({ title: "Schedule item deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting schedule item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteRoomLayout = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('event_room_layouts')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-room-layouts', eventId] });
      toast({ title: "Room layout deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting room layout",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteEquipmentItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('event_equipment')
        .delete()
        .eq('id', itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event-equipment', eventId] });
      toast({ title: "Equipment item deleted successfully" });
    },
    onError: (error) => {
      toast({
        title: "Error deleting equipment item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  return {
    addMenuItem,
    addStaffingRequirement,
    addScheduleItem,
    addRoomLayout,
    addEquipmentItem,
    generateBEO,
    deleteMenuItem,
    deleteStaffingRequirement,
    deleteScheduleItem,
    deleteRoomLayout,
    deleteEquipmentItem
  };
};