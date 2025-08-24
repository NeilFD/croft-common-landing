
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
      
      // First get the basic delivery data
      const { data: deliveryData, error } = await supabase
        .from("notification_deliveries")
        .select("*")
        .eq("notification_id", notificationId)
        .order("sent_at", { ascending: false });
        
      if (error) {
        console.error("Error fetching deliveries:", error);
        throw error;
      }
      
      console.log("Raw delivery data:", deliveryData);
      
      if (!deliveryData || deliveryData.length === 0) {
        console.log("No deliveries found for notification:", notificationId);
        return [];
      }

      // Get subscription IDs
      const subscriptionIds = deliveryData
        .filter(d => d.subscription_id)
        .map(d => d.subscription_id);
      
      console.log("Subscription IDs:", subscriptionIds);

      // Get push subscriptions first
      const { data: subscriptionData, error: subError } = await supabase
        .from("push_subscriptions")
        .select("id, user_id")
        .in("id", subscriptionIds);

      if (subError) {
        console.warn("Error fetching subscription data:", subError);
      }
      
      console.log("Subscription data:", subscriptionData);

      // Get unique user IDs
      const userIds = [...new Set(subscriptionData?.filter(sub => sub.user_id).map(sub => sub.user_id) || [])];
      console.log("User IDs:", userIds);

      // Get profiles separately
      const { data: profilesData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, first_name, last_name")
        .in("user_id", userIds);

      if (profileError) {
        console.warn("Error fetching profiles data:", profileError);
      }
      
      console.log("Profiles data:", profilesData);

      // Also try to get names from subscribers table
      const { data: subscribersData, error: subsError } = await supabase
        .from("subscribers")
        .select("email, name")
        .eq("is_active", true);

      if (subsError) {
        console.warn("Error fetching subscribers data:", subsError);
      }
      
      console.log("Subscribers data:", subscribersData);

      // Combine the data manually with enhanced name resolution
      const enrichedDeliveries = deliveryData.map(delivery => {
        const subscription = subscriptionData?.find(sub => sub.id === delivery.subscription_id);
        const profile = subscription?.user_id ? profilesData?.find(p => p.user_id === subscription.user_id) : null;
        
        return {
          ...delivery,
          push_subscriptions: subscription ? {
            ...subscription,
            profiles: profile,
            subscribers_data: subscribersData
          } : null
        };
      });
      
      console.log("Enriched deliveries:", enrichedDeliveries);
      return enrichedDeliveries;
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
              const subscribersData = d.push_subscriptions?.subscribers_data;
              let displayName = 'Unknown User';
              
              // Try profile name first
              if (profile?.first_name || profile?.last_name) {
                displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              } 
              // Try to find name in subscribers table by matching user_id to email
              else if (d.push_subscriptions?.user_id && subscribersData) {
                // This is a simple approach - we could improve this by fetching auth.users email
                // For now, let's try to find a subscriber name if available
                const subscriberWithName = subscribersData.find((sub: any) => sub.name && sub.name.trim());
                if (subscriberWithName) {
                  displayName = subscriberWithName.name;
                }
              }
              // Fallback to user ID
              else if (d.push_subscriptions?.user_id) {
                displayName = `User ${d.push_subscriptions.user_id.slice(-8)}`;
              }
              
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
