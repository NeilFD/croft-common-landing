import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Edit2, Save, X, Calendar, Clock, Users } from "lucide-react";

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

export const CinemaManagement: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
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

  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const { error } = await supabase
        .from("cinema_releases")
        .update({ title: title.trim() || null })
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cinema-releases"] });
      setEditingId(null);
      setEditTitle("");
      toast({
        title: "Film title updated",
        description: "The film title has been successfully updated.",
      });
    },
    onError: (error) => {
      console.error("Error updating film title:", error);
      toast({
        title: "Error updating film",
        description: "Failed to update the film title. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createReleaseMutation = useMutation({
    mutationFn: async (monthKey: string) => {
      // Calculate the last Thursday of the month
      const date = new Date(monthKey);
      const year = date.getFullYear();
      const month = date.getMonth();
      const lastDay = new Date(year, month + 1, 0);
      const lastThursday = new Date(lastDay);
      lastThursday.setDate(lastDay.getDate() - ((lastDay.getDay() + 3) % 7));

      const { error } = await supabase
        .from("cinema_releases")
        .insert([{
          month_key: monthKey,
          screening_date: lastThursday.toISOString().split('T')[0],
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cinema-releases"] });
      toast({
        title: "New release created",
        description: "A new cinema release has been created.",
      });
    },
    onError: (error) => {
      console.error("Error creating release:", error);
      toast({
        title: "Error creating release",
        description: "Failed to create a new release. Please try again.",
        variant: "destructive",
      });
    },
  });

  const startEdit = (release: CinemaRelease) => {
    setEditingId(release.id);
    setEditTitle(release.title || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const saveEdit = () => {
    if (editingId) {
      updateTitleMutation.mutate({ id: editingId, title: editTitle });
    }
  };

  const generateFutureMonths = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const futureMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
      const monthKey = futureMonth.toISOString().split('T')[0].substring(0, 7) + '-01';
      
      const exists = releases?.some(r => r.month_key === monthKey);
      if (!exists) {
        months.push({
          key: monthKey,
          display: futureMonth.toLocaleDateString('en-GB', { 
            month: 'long', 
            year: 'numeric' 
          }),
        });
      }
    }
    
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

  const futureMonths = generateFutureMonths();

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

      {/* Add future months if needed */}
      {futureMonths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Create Future Releases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {futureMonths.slice(0, 6).map((month) => (
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
        {releases?.map((release) => (
          <Card key={release.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Month & Date */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{formatMonth(release.month_key)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(release.screening_date)}
                    </p>
                  </div>

                  {/* Time & Capacity */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Doors {release.doors_time} • Screen {release.screening_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Capacity: {release.capacity}</span>
                    </div>
                  </div>

                  {/* Film Title */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Film Title</span>
                      {editingId === release.id ? (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={saveEdit}
                            disabled={updateTitleMutation.isPending}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={cancelEdit}
                            disabled={updateTitleMutation.isPending}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(release)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    
                    {editingId === release.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Enter film title..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit();
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        autoFocus
                      />
                    ) : (
                      <div className="min-h-[40px] flex items-center">
                        {release.title ? (
                          <span className="text-sm">{release.title}</span>
                        ) : (
                          <Badge variant="secondary">No title set</Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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
