
import React, { useMemo, useState, useEffect } from "react";
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
      console.log("Fetching deliveries for notification:", notificationId);
      const { data, error } = await supabase
        .from("notification_deliveries")
        .select(`
          id, 
          sent_at, 
          status, 
          endpoint, 
          error, 
          clicked_at,
          subscription_id,
          push_subscriptions!notification_deliveries_subscription_id_fkey(
            id,
            user_id,
            profiles!push_subscriptions_user_id_fkey(
              first_name, 
              last_name
            )
          )
        `)
        .eq("notification_id", notificationId)
        .order("sent_at", { ascending: false });
      if (error) {
        console.error("Error fetching deliveries:", error);
        throw error;
      }
      
      console.log("Deliveries data:", data);
      return data ?? [];
    },
  });

  const deliveries = data ?? [];
  const successes = useMemo(() => deliveries.filter((d: any) => d.status === 'sent'), [deliveries]);
  const failures = useMemo(() => deliveries.filter((d: any) => d.status === 'failed'), [deliveries]);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openFailed, setOpenFailed] = useState(false);
  const toggleAll = () => {
    const next = !(openSuccess && openFailed);
    setOpenSuccess(next);
    setOpenFailed(next);
  };

  useEffect(() => {
    if (deliveries.length === 0) {
      setOpenSuccess(false);
      setOpenFailed(false);
      return;
    }
    setOpenSuccess(successes.length > 0);
    setOpenFailed(failures.length > 0);
  }, [notificationId, deliveries.length, successes.length, failures.length]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary">Total: {deliveries.length}</Badge>
          <Badge variant="default">Success: {successes.length}</Badge>
          <Badge variant="destructive">Failed: {failures.length}</Badge>
        </div>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sent at</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Endpoint</TableHead>
              <TableHead>Clicked at</TableHead>
              <TableHead>Error</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((d: any) => {
              const profile = d.push_subscriptions?.profiles;
              const displayName = profile 
                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() 
                : d.push_subscriptions?.user_id 
                  ? `User ${d.push_subscriptions.user_id.slice(-8)}` 
                  : `Subscription ${d.subscription_id?.slice(-8) || 'Unknown'}`;
              
              return (
                <TableRow key={d.id}>
                  <TableCell className="whitespace-nowrap">{displayName}</TableCell>
                  <TableCell className="whitespace-nowrap">{new Date(d.sent_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant={d.status === 'sent' ? 'default' : d.status === 'failed' ? 'destructive' : 'secondary'}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[600px] truncate">{d.endpoint}</TableCell>
                  <TableCell className="whitespace-nowrap">{d.clicked_at ? new Date(d.clicked_at).toLocaleString() : '-'}</TableCell>
                  <TableCell className="max-w-[420px] truncate text-muted-foreground">{d.error || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
