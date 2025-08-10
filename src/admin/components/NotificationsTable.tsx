
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = {
  onSelect: (id: string) => void;
  selectedId: string | null;
};

export const NotificationsTable: React.FC<Props> = ({ onSelect, selectedId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, created_at, title, status, scope, dry_run, recipients_count, success_count, failed_count, sent_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="text-sm text-destructive">Failed to load notifications.</div>;
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No notifications yet.</div>;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Created</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead className="text-right">Recipients</TableHead>
            <TableHead className="text-right">Success</TableHead>
            <TableHead className="text-right">Failed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((n: any) => (
            <TableRow
              key={n.id}
              onClick={() => onSelect(n.id)}
              className={`cursor-pointer ${selectedId === n.id ? "bg-muted/50" : ""}`}
            >
              <TableCell className="whitespace-nowrap">
                {new Date(n.created_at).toLocaleString()}
              </TableCell>
              <TableCell className="max-w-[280px] truncate">{n.title}</TableCell>
              <TableCell>
                <Badge variant={n.status === "sent" ? "default" : n.status === "failed" ? "destructive" : "secondary"}>
                  {n.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="outline">{n.scope}</Badge>
              </TableCell>
              <TableCell className="text-right">{n.recipients_count}</TableCell>
              <TableCell className="text-right">{n.success_count}</TableCell>
              <TableCell className="text-right">{n.failed_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
