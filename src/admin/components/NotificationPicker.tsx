
import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type NotificationOption = {
  id: string;
  title: string;
  created_at: string;
  archived: boolean;
  dry_run: boolean;
  success_count: number;
};

type Props = {
  value: string | null;
  onChange: (id: string) => void;
};

export const NotificationPicker: React.FC<Props> = ({ value, onChange }) => {
  const { data, isLoading } = useQuery<NotificationOption[]>({
    queryKey: ["notification-picker"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, created_at, archived, dry_run, success_count")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as NotificationOption[];
    },
  });

  // Removed auto-select on empty value to avoid re-selecting after Clear actions
  // Users will explicitly pick a notification to inspect deliveries.

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Notification</span>
      <Select value={value ?? undefined} onValueChange={(v) => onChange(v)}>
        <SelectTrigger className="min-w-[260px]">
          <SelectValue placeholder={isLoading ? "Loading…" : "Choose notification"} />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          {(data ?? []).map((n) => (
            <SelectItem key={n.id} value={n.id}>
              <div className="flex items-center gap-2">
                <span className="truncate max-w-[180px]">{n.title}</span>
                {n.dry_run ? <Badge variant="secondary">Dry</Badge> : null}
                {n.archived ? <Badge variant="outline">Archived</Badge> : null}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
