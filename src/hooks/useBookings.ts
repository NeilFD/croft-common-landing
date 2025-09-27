import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface Booking {
  id: string;
  space_id: string;
  lead_id?: string | null;
  title: string;
  start_ts: string;
  end_ts: string;
  setup_min: number;
  teardown_min: number;
  status: string;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  space?: {
    id: string;
    name: string;
  };
  lead?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface BookingFilters {
  space_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface CreateBookingData {
  space_id: string;
  lead_id?: string | null;
  title: string;
  start_ts: string;
  end_ts: string;
  setup_min?: number;
  teardown_min?: number;
}

export interface UpdateBookingData {
  title?: string;
  start_ts?: string;
  end_ts?: string;
  setup_min?: number;
  teardown_min?: number;
}

// Fetch all bookings with optional filters
export const useBookings = (filters?: BookingFilters) => {
  return useQuery({
    queryKey: ["bookings", filters],
    queryFn: async (): Promise<Booking[]> => {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          space:spaces(id, name),
          lead:leads(id, first_name, last_name, email)
        `)
        .order("start_ts", { ascending: true });

      if (filters?.space_id) {
        query = query.eq("space_id", filters.space_id);
      }

      if (filters?.start_date && filters?.end_date) {
        query = query
          .gte("start_ts", filters.start_date)
          .lte("end_ts", filters.end_date);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching bookings:", error);
        throw error;
      }

      return data || [];
    },
  });
};

// Fetch single booking
export const useBooking = (id: string) => {
  return useQuery({
    queryKey: ["booking", id],
    queryFn: async (): Promise<Booking | null> => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          space:spaces(id, name),
          lead:leads(id, first_name, last_name, email)
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching booking:", error);
        throw error;
      }

      return data;
    },
  });
};

// Create booking mutation using secure RPC
export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bookingData: CreateBookingData): Promise<Booking> => {
      // Call secure RPC function using rpc with proper typing
      const { data: bookingId, error } = await supabase.rpc('create_booking' as any, {
        payload: {
          space_id: bookingData.space_id,
          lead_id: bookingData.lead_id,
          title: bookingData.title,
          start_ts: bookingData.start_ts,
          end_ts: bookingData.end_ts,
          setup_min: bookingData.setup_min || 0,
          teardown_min: bookingData.teardown_min || 0,
        }
      });

      if (error) {
        console.error("Error creating booking:", error);
        throw error;
      }

      // Fetch the created booking with joins
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select(`
          *,
          space:spaces(id, name),
          lead:leads(id, first_name, last_name, email)
        `)
        .eq('id', bookingId as string)
        .single();

      if (fetchError) {
        console.error("Error fetching created booking:", fetchError);
        throw fetchError;
      }

      return booking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.setQueryData(["booking", data.id], data);
      
      toast({
        title: "Booking Created",
        description: `Successfully created booking "${data.title}"`,
      });
    },
    onError: (error: any) => {
      console.error("Failed to create booking:", error);
      let errorMessage = "Failed to create booking";
      
      // Handle specific error codes from secure RPC
      if (error.code === 'check_violation') {
        errorMessage = "Booking is outside trading hours for this space";
      } else if (error.message?.includes('overlaps with existing booking')) {
        errorMessage = "This booking conflicts with an existing booking";
      } else if (error.code === 'insufficient_privilege') {
        errorMessage = "You don't have permission to create bookings";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Update booking mutation using secure RPC
export const useUpdateBooking = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateBookingData): Promise<Booking> => {
      // Call secure RPC function
      const { error } = await supabase.rpc('update_booking' as any, {
        p_id: id,
        patch: updates
      });

      if (error) {
        console.error("Error updating booking:", error);
        throw error;
      }

      // Fetch the updated booking with joins
      const { data: booking, error: fetchError } = await supabase
        .from("bookings")
        .select(`
          *,
          space:spaces(id, name),
          lead:leads(id, first_name, last_name, email)
        `)
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error("Error fetching updated booking:", fetchError);
        throw fetchError;
      }

      return booking;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.setQueryData(["booking", data.id], data);
      
      toast({
        title: "Booking Updated",
        description: `Successfully updated booking "${data.title}"`,
      });
    },
    onError: (error: any) => {
      console.error("Failed to update booking:", error);
      let errorMessage = "Failed to update booking";
      
      // Handle specific error codes from secure RPC
      if (error.code === 'check_violation') {
        errorMessage = "Booking is outside trading hours for this space";
      } else if (error.message?.includes('overlaps with existing booking')) {
        errorMessage = "This booking conflicts with an existing booking";
      } else if (error.code === 'insufficient_privilege') {
        errorMessage = "You don't have permission to update bookings";
      } else if (error.code === 'no_data_found') {
        errorMessage = "Booking not found";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};

// Delete booking mutation using secure RPC
export const useDeleteBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { error } = await supabase.rpc('delete_booking' as any, {
        p_id: id
      });

      if (error) {
        console.error("Error deleting booking:", error);
        throw error;
      }
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      queryClient.removeQueries({ queryKey: ["booking", deletedId] });
      
      toast({
        title: "Booking Deleted",
        description: "Successfully deleted booking",
      });
    },
    onError: (error: any) => {
      console.error("Failed to delete booking:", error);
      let errorMessage = "Failed to delete booking";
      
      // Handle specific error codes from secure RPC
      if (error.code === 'insufficient_privilege') {
        errorMessage = "You don't have permission to delete bookings";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
};