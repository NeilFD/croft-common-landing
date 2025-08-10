
import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  const successes = useMemo(() => (data ?? []).filter((d: any) => d.status === 'sent'), [data]);
  const failures = useMemo(() => (data ?? []).filter((d: any) => d.status === 'failed'), [data]);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);
  const toggleAll = () => {
    const next = !(openSuccess && openFailed);
    setOpenSuccess(next);
    setOpenFailed(next);
  };


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">Total: {data.length}</Badge>
          <Badge variant="default">Success: {successes.length}</Badge>
          <Badge variant="destructive">Failed: {failures.length}</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={toggleAll}>
          {openSuccess && openFailed ? "Collapse all" : "Expand all"}
        </Button>
      </div>

      <Collapsible open={openSuccess} onOpenChange={setOpenSuccess}>
        <div className="flex items-center justify-between px-2">
          <div className="font-medium">Successful deliveries</div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {openSuccess ? "Hide" : `Show ${successes.length}`}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent at</TableHead>
                  <TableHead>Endpoint</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {successes.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap">{new Date(d.sent_at).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[600px] truncate">{d.endpoint}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={openFailed} onOpenChange={setOpenFailed}>
        <div className="flex items-center justify-between px-2">
          <div className="font-medium">Failed deliveries</div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {openFailed ? "Hide" : `Show ${failures.length}`}
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sent at</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {failures.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="whitespace-nowrap">{new Date(d.sent_at).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[420px] truncate">{d.endpoint}</TableCell>
                    <TableCell className="max-w-[420px] truncate text-muted-foreground">{d.error || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};
