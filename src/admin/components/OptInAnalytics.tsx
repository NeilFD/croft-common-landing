import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Props = { embedded?: boolean };

function startDateForRange(range: string): string | null {
  const now = new Date();
  if (range === "7d") now.setDate(now.getDate() - 7);
  else if (range === "30d") now.setDate(now.getDate() - 30);
  else if (range === "90d") now.setDate(now.getDate() - 90);
  else return null; // all-time
  return now.toISOString();
}

export const OptInAnalytics: React.FC<Props> = ({ embedded = false }) => {
  const [range, setRange] = React.useState<"7d" | "30d" | "90d" | "all">("30d");

  const { data, isLoading, error } = useQuery({
    queryKey: ["push-optin-events", range],
    queryFn: async () => {
      let q = supabase
        .from("push_optin_events")
        .select("event, created_at")
        .order("created_at", { ascending: false })
        .limit(5000);
      const since = startDateForRange(range);
      if (since) q = q.gte("created_at", since);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const counts = React.useMemo(() => {
    const c: Record<string, number> = { prompt_shown: 0, granted: 0, denied: 0, subscribed: 0, unsubscribed: 0 };
    for (const row of data ?? []) {
      c[row.event] = (c[row.event] || 0) + 1;
    }
    return c;
  }, [data]);

  const permissionTotal = counts.granted + counts.denied;
  const grantRate = permissionTotal > 0 ? Math.round((counts.granted / permissionTotal) * 100) : 0;
  const subscribeRate = (counts.prompt_shown || counts.granted) > 0
    ? Math.round((counts.subscribed / (counts.prompt_shown || counts.granted)) * 100)
    : 0;

  const Body = (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base font-medium">Opt‑in Analytics</div>
        <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="90d">90d</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : error ? (
        <div className="text-sm text-destructive">Failed to load analytics.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-md border p-4 space-y-2">
            <div className="text-sm text-muted-foreground">Permission grant rate</div>
            <div className="text-3xl font-semibold">{grantRate}%</div>
            <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
              <Badge variant="secondary">Granted: {counts.granted}</Badge>
              <Badge variant="outline">Denied: {counts.denied}</Badge>
            </div>
          </div>

          <div className="rounded-md border p-4 space-y-2">
            <div className="text-sm text-muted-foreground">Subscribe conversion</div>
            <div className="text-3xl font-semibold">{subscribeRate}%</div>
            <div className="text-xs text-muted-foreground flex gap-2 flex-wrap">
              <Badge variant="secondary">Subscribed: {counts.subscribed}</Badge>
              <Badge variant="outline">Prompts: {counts.prompt_shown || counts.granted}</Badge>
            </div>
          </div>

          <div className="rounded-md border p-4 space-y-2">
            <div className="text-sm text-muted-foreground">Unsubscribed</div>
            <div className="text-3xl font-semibold">{counts.unsubscribed}</div>
            <div className="text-xs text-muted-foreground">Total (selected period)</div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return Body;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Opt‑in Analytics</CardTitle>
        <Tabs value={range} onValueChange={(v) => setRange(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">7d</TabsTrigger>
            <TabsTrigger value="30d">30d</TabsTrigger>
            <TabsTrigger value="90d">90d</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {Body}
      </CardContent>
    </Card>
  );
};
