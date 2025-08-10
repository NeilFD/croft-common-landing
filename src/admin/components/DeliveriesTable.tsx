
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = {
  notificationId: string;
};

export const DeliveriesTable: React.FC<Props> = ({ notificationId }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["deliveries", notificationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_deliveries")
        .select("id, sent_at, status, endpoint, error")
        .eq("notification_id", notificationId)
        .order("sent_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="text-sm text-destructive">Failed to load deliveries.</div>;
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No deliveries yet.</div>;

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sent at</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Error</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((d: any) => (
            <TableRow key={d.id}>
              <TableCell className="whitespace-nowrap">
                {new Date(d.sent_at).toLocaleString()}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    d.status === "sent"
                      ? "default"
                      : d.status === "failed"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {d.status}
                </Badge>
              </TableCell>
              <TableCell className="max-w-[420px] truncate">{d.endpoint}</TableCell>
              <TableCell className="max-w-[320px] truncate text-muted-foreground">
                {d.error || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
