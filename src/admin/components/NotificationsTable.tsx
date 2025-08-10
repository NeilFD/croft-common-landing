
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type Props = {
  onSelect: (id: string) => void;
  selectedId: string | null;
  filterMode?: 'all' | 'live' | 'dry';
};

export const NotificationsTable: React.FC<Props> = ({ onSelect, selectedId, filterMode = 'all' }) => {
  const { data: notifications, isLoading, error } = useQuery({
    queryKey: ["notifications", filterMode],
    queryFn: async () => {
      let q = supabase
        .from("notifications")
        .select(
          "id, created_at, title, status, scope, dry_run, recipients_count, success_count, failed_count, sent_at"
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (filterMode === 'live') {
        q = q.eq('dry_run', false);
      } else if (filterMode === 'dry') {
        q = q.eq('dry_run', true);
      }

      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: clicked, isLoading: loadingClicks } = useQuery({
    queryKey: ['notification-clicks', notifications?.map((n:any)=>n.id) ?? []],
    enabled: !!notifications && notifications.length > 0,
    queryFn: async () => {
      const ids = (notifications ?? []).map((n: any) => n.id);
      const { data, error } = await supabase
        .from('notification_deliveries')
        .select('notification_id, clicked_at')
        .in('notification_id', ids)
        .not('clicked_at', 'is', null);
      if (error) throw error;
      return data ?? [];
    },
  });

  const clicksMap = React.useMemo(() => {
    const map: Record<string, number> = {};
    for (const row of clicked ?? []) {
      map[row.notification_id] = (map[row.notification_id] || 0) + 1;
    }
    return map;
  }, [clicked]);

  if (isLoading || loadingClicks) return <div className="text-sm text-muted-foreground">Loading…</div>;
  if (error) return <div className="text-sm text-destructive">Failed to load notifications.</div>;
  if (!notifications || notifications.length === 0) return <div className="text-sm text-muted-foreground">No notifications yet.</div>;

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
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">CTR</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((n: any) => {
            const clicks = clicksMap[n.id] || 0;
            const sent = n.success_count;
            const ctr = sent > 0 ? Math.round((clicks / sent) * 100) : 0;
            return (
              <TableRow
                key={n.id}
                role="button"
                tabIndex={0}
                onClick={(e) => { e.preventDefault(); onSelect(n.id); }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(n.id); } }}
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
                <TableCell className="text-right">{clicks}</TableCell>
                <TableCell className="text-right">{ctr}%</TableCell>
              </TableRow>
            );
          })}

        </TableBody>
      </Table>
    </div>
  );
};
