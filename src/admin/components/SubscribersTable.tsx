import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface Subscriber {
  user_id: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  subscriber_name: string | null;
  platform: string | null;
  created_at: string;
  last_seen: string | null;
  device_count: number;
}

export const SubscribersTable: React.FC = () => {
  const [search, setSearch] = React.useState("");

  const { data: subscribers, isLoading, error } = useQuery({
    queryKey: ["subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_push_subscribers");
      if (error) throw error;
      return data as Subscriber[];
    },
  });

  const filteredSubscribers = React.useMemo(() => {
    if (!subscribers || !search.trim()) return subscribers || [];
    
    const searchLower = search.toLowerCase();
    return subscribers.filter(sub => 
      sub.email?.toLowerCase().includes(searchLower) ||
      sub.first_name?.toLowerCase().includes(searchLower) ||
      sub.last_name?.toLowerCase().includes(searchLower) ||
      sub.subscriber_name?.toLowerCase().includes(searchLower)
    );
  }, [subscribers, search]);

  const getDisplayName = (subscriber: Subscriber) => {
    if (subscriber.first_name || subscriber.last_name) {
      return [subscriber.first_name, subscriber.last_name].filter(Boolean).join(" ");
    }
    if (subscriber.subscriber_name) {
      return subscriber.subscriber_name;
    }
    return "Unknown User";
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading subscribers...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-4 text-destructive">
        Error loading subscribers: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <div className="text-sm text-muted-foreground">
          {filteredSubscribers.length} subscriber{filteredSubscribers.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Devices</TableHead>
              <TableHead>Platform</TableHead>
              <TableHead>Subscribed</TableHead>
              <TableHead>Last Seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscribers.map((subscriber, index) => (
              <TableRow key={`${subscriber.user_id || 'unknown'}-${index}`}>
                <TableCell className="font-medium">
                  {getDisplayName(subscriber)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {subscriber.email || "No email"}
                    {!subscriber.user_id && (
                      <Badge variant="secondary" className="text-xs">
                        Guest
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {subscriber.device_count}
                  </Badge>
                </TableCell>
                <TableCell>
                  {subscriber.platform ? (
                    <Badge variant="secondary">
                      {subscriber.platform}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Unknown</span>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(subscriber.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  {subscriber.last_seen ? (
                    format(new Date(subscriber.last_seen), "MMM d, yyyy")
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filteredSubscribers.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {search.trim() ? "No subscribers found matching your search." : "No subscribers found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};