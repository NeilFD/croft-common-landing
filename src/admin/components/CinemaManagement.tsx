import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Calendar, Clock, Users, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

type CinemaRelease = {
  id: string;
  month_key: string;
  screening_date: string;
  doors_time: string;
  screening_time: string;
  capacity: number;
  title: string | null;
  description: string | null;
  poster_url: string | null;
  is_active: boolean;
  created_at: string;
};

type EditingFields = {
  title: string;
  screening_date: string;
  doors_time: string;
  screening_time: string;
  capacity: string;
};

export const CinemaManagement: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingFields, setEditingFields] = useState<EditingFields>({
    title: "",
    screening_date: "",
    doors_time: "",
    screening_time: "",
    capacity: "",
  });
  const queryClient = useQueryClient();

  const { data: releases, isLoading } = useQuery({
    queryKey: ["cinema-releases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cinema_releases")
        .select("*")
        .order("month_key", { ascending: false });
      
      if (error) throw error;
      return data as CinemaRelease[];
    },
  });

  // Get current bookings for capacity validation
  const { data: bookingCounts } = useQuery({
    queryKey: ["cinema-booking-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cinema_bookings")
        .select("release_id, quantity")
        .in("release_id", releases?.map(r => r.id) || []);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach(booking => {
        counts[booking.release_id] = (counts[booking.release_id] || 0) + booking.quantity;
      });
      return counts;
    },
    enabled: !!releases?.length,
  });

  const updateReleaseMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CinemaRelease> }) => {
      console.log("🎬 Updating cinema release:", { id, updates });
      
      const { error, data } = await supabase
        .from("cinema_releases")
        .update(updates)
        .eq("id", id)
        .select("*");
      
      if (error) {
        console.error("❌ Database error:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error("❌ No data returned from update");
        throw new Error("Update failed - no data returned");
      }
      
      console.log("✅ Update successful:", data[0]);
      return data[0];
    },
    onMutate: async ({ id, updates }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cinema-releases"] });
      
      // Snapshot the previous value
      const previousReleases = queryClient.getQueryData<CinemaRelease[]>(["cinema-releases"]);
      
      // Optimistically update to the new value
      if (previousReleases) {
        const optimisticReleases = previousReleases.map(release =>
          release.id === id ? { ...release, ...updates } : release
        );
        queryClient.setQueryData<CinemaRelease[]>(["cinema-releases"], optimisticReleases);
      }
      
      return { previousReleases };
    },
    onSuccess: async (data) => {
      console.log("🎉 Mutation success, updated data:", data);
      console.log("🔄 Invalidating queries...");
      
      // Force immediate refetch of data
      await queryClient.invalidateQueries({ 
        queryKey: ["cinema-releases"],
        refetchType: 'active'
      });
      await queryClient.invalidateQueries({ 
        queryKey: ["cinema-booking-counts"],
        refetchType: 'active'
      });
      
      setEditingId(null);
      resetEditingFields();
      
      toast({
        title: "Release updated",
        description: `Film title "${data.title || 'No title'}" has been saved successfully.`,
      });
    },
    onError: (error: any, variables, context) => {
      console.error("Error updating release:", error);
      
      // Rollback optimistic update
      if (context?.previousReleases) {
        queryClient.setQueryData<CinemaRelease[]>(["cinema-releases"], context.previousReleases);
      }
      
      toast({
        title: "Error updating release",
        description: error.message || "Failed to update the release. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createReleaseMutation = useMutation({
    mutationFn: async (monthKey: string) => {
      console.log("🎬 Creating cinema release for month:", monthKey);
      
      // Calculate the last Thursday of the month (timezone-safe)
      const date = new Date(monthKey);
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const lastThursday = new Date(lastDay);
      lastThursday.setDate(lastDay.getDate() - ((lastDay.getDay() + 3) % 7));

      const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      const { error, data } = await supabase
        .from("cinema_releases")
        .insert([
          {
            month_key: monthKey,
            screening_date: toYMD(lastThursday),
            doors_time: "19:00",
            screening_time: "19:30",
            capacity: 100,
            is_active: true
          },
        ])
        .select("*");

      if (error) {
        console.error("❌ Database error creating release:", error);
        throw error;
      }
      
      console.log("✅ Create successful:", data);
      return data[0];
    },
    onMutate: async (monthKey) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["cinema-releases"] });
      
      // Snapshot the previous value
      const previousReleases = queryClient.getQueryData<CinemaRelease[]>(["cinema-releases"]);
      
      // Create optimistic new release
      const date = new Date(monthKey);
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const lastThursday = new Date(lastDay);
      lastThursday.setDate(lastDay.getDate() - ((lastDay.getDay() + 3) % 7));
      const toYMD = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      const optimisticRelease: CinemaRelease = {
        id: `temp-${Date.now()}`,
        month_key: monthKey,
        screening_date: toYMD(lastThursday),
        doors_time: "19:00",
        screening_time: "19:30",
        capacity: 100,
        title: null,
        description: null,
        poster_url: null,
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      // Optimistically update to the new value
      if (previousReleases) {
        const optimisticReleases = [...previousReleases, optimisticRelease]
          .sort((a, b) => b.month_key.localeCompare(a.month_key));
        queryClient.setQueryData<CinemaRelease[]>(["cinema-releases"], optimisticReleases);
      }
      
      return { previousReleases };
    },
    onSuccess: async (data) => {
      console.log("🎉 Create mutation success:", data);
      console.log("🔄 Invalidating queries...");
      
      // Force immediate refetch of data
      await queryClient.invalidateQueries({ 
        queryKey: ["cinema-releases"],
        refetchType: 'active'
      });
      
      toast({
        title: "New release created",
        description: "A new cinema release has been created.",
      });
    },
    onError: (error, variables, context) => {
      console.error("Error creating release:", error);
      
      // Rollback optimistic update
      if (context?.previousReleases) {
        queryClient.setQueryData<CinemaRelease[]>(["cinema-releases"], context.previousReleases);
      }
      
      toast({
        title: "Error creating release",
        description: "Failed to create a new release. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEdit = (release: CinemaRelease) => {
    setEditingId(release.id);
    setEditingFields({
      title: release.title || "",
      screening_date: release.screening_date,
      doors_time: release.doors_time,
      screening_time: release.screening_time,
      capacity: release.capacity.toString(),
    });
  };

  const resetEditingFields = () => {
    setEditingFields({
      title: "",
      screening_date: "",
      doors_time: "",
      screening_time: "",
      capacity: "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    resetEditingFields();
  };

  const validateAndSave = () => {
    if (!editingId) return;
    
    const release = releases?.find(r => r.id === editingId);
    if (!release) return;
    
    // Validation
    const newCapacity = parseInt(editingFields.capacity);
    const currentBookings = bookingCounts?.[editingId] || 0;
    
    if (isNaN(newCapacity) || newCapacity < 1) {
      toast({
        title: "Invalid capacity",
        description: "Capacity must be a positive number.",
        variant: "destructive",
      });
      return;
    }
    
    if (newCapacity < currentBookings) {
      toast({
        title: "Capacity too low",
        description: `Cannot set capacity below current bookings (${currentBookings}).`,
        variant: "destructive",
      });
      return;
    }
    
    // Validate times
    if (editingFields.doors_time >= editingFields.screening_time) {
      toast({
        title: "Invalid times",
        description: "Doors time must be before screening time.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate date is in correct month
    const screeningDate = new Date(editingFields.screening_date);
    const monthKey = new Date(release.month_key);
    if (screeningDate.getMonth() !== monthKey.getMonth() || 
        screeningDate.getFullYear() !== monthKey.getFullYear()) {
      toast({
        title: "Invalid date",
        description: "Screening date must be within the correct month.",
        variant: "destructive",
      });
      return;
    }
    
    const updates = {
      title: editingFields.title.trim() || null,
      screening_date: editingFields.screening_date,
      doors_time: editingFields.doors_time,
      screening_time: editingFields.screening_time,
      capacity: newCapacity,
    };
    
    updateReleaseMutation.mutate({ id: editingId, updates });
  };

  const generateAvailableMonths = () => {
    const months = [] as { key: string; display: string }[];
    const today = new Date();

    // Helper to build YYYY-MM-01 without timezone pitfalls
    const buildMonthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;

    // Only show future months starting from next month
    for (let i = 1; i <= 12; i++) {
      const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = buildMonthKey(month);

      const exists = releases?.some((r) => r.month_key === monthKey);
      if (!exists) {
        months.push({
          key: monthKey,
          display: month.toLocaleDateString("en-GB", {
            month: "long",
            year: "numeric",
          }),
        });
      }
    }

    // Debug: surface what we computed
    console.log("Create Releases options:", months.map((m) => m.key));

    return months;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatMonth = (monthKey: string) => {
    return new Date(monthKey).toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  const availableMonths = generateAvailableMonths();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Secret Cinema Films</h3>
          <p className="text-sm text-muted-foreground">
            Manage film titles for each month's secret cinema screening
          </p>
        </div>
      </div>

      {/* Add available months if needed */}
      {availableMonths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {availableMonths.slice(0, 6).map((month) => (
                <Button
                  key={month.key}
                  variant="outline"
                  size="sm"
                  onClick={() => createReleaseMutation.mutate(month.key)}
                  disabled={createReleaseMutation.isPending}
                >
                  Add {month.display}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing releases */}
      <div className="space-y-4">
        {releases?.map((release) => {
          const currentBookings = bookingCounts?.[release.id] || 0;
          const isEditing = editingId === release.id;
          
          return (
            <Card key={release.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{formatMonth(release.month_key)}</span>
                    {currentBookings > 0 && (
                      <Badge variant="secondary">{currentBookings} booked</Badge>
                    )}
                  </div>
                  
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={validateAndSave}
                        disabled={updateReleaseMutation.isPending}
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEdit}
                        disabled={updateReleaseMutation.isPending}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startEdit(release)}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Screening Date */}
                  <div>
                    <label className="text-sm font-medium">Screening Date</label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={editingFields.screening_date}
                        onChange={(e) => setEditingFields(prev => ({ ...prev, screening_date: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(release.screening_date)}
                      </p>
                    )}
                  </div>

                  {/* Doors Time */}
                  <div>
                    <label className="text-sm font-medium">Doors Time</label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={editingFields.doors_time}
                        onChange={(e) => setEditingFields(prev => ({ ...prev, doors_time: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {release.doors_time}
                      </p>
                    )}
                  </div>

                  {/* Screening Time */}
                  <div>
                    <label className="text-sm font-medium">Screening Time</label>
                    {isEditing ? (
                      <Input
                        type="time"
                        value={editingFields.screening_time}
                        onChange={(e) => setEditingFields(prev => ({ ...prev, screening_time: e.target.value }))}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {release.screening_time}
                      </p>
                    )}
                  </div>

                  {/* Capacity */}
                  <div>
                    <label className="text-sm font-medium">Capacity</label>
                    {isEditing ? (
                      <div className="mt-1">
                        <Input
                          type="number"
                          min={currentBookings || 1}
                          value={editingFields.capacity}
                          onChange={(e) => setEditingFields(prev => ({ ...prev, capacity: e.target.value }))}
                        />
                        {currentBookings > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="h-3 w-3 text-amber-500" />
                            <span className="text-xs text-amber-600">
                              Min: {currentBookings} (current bookings)
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground mt-1">
                        {release.capacity} seats
                        {currentBookings > 0 && (
                          <span className="text-amber-600 ml-2">
                            ({currentBookings} booked)
                          </span>
                        )}
                      </p>
                    )}
                  </div>
                </div>

                {/* Film Title - Full Width */}
                <div className="mt-4">
                  <label className="text-sm font-medium">Film Title</label>
                  {isEditing ? (
                    <Input
                      value={editingFields.title}
                      onChange={(e) => setEditingFields(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter film title..."
                      className="mt-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') validateAndSave();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                  ) : (
                    <div className="mt-1">
                      {release.title ? (
                        <span className="text-sm font-medium">{release.title}</span>
                      ) : (
                        <Badge variant="secondary">No title set</Badge>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!releases || releases.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No cinema releases found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Create releases for future months to get started.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
