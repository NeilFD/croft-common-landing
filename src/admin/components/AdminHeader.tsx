import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { AdminHeader } from './AdminHeader';

export const AdminHeader = () => {
  const { user, signOut } = useAuth();

  const { data: enabled } = useQuery<{ count: number; devices: number; unknown_endpoints: number }>({
    queryKey: ["enabled-users-count"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-enabled-users-count");
      if (error) throw error;
      return {
        count: Number(data?.count ?? 0),
        devices: Number(data?.devices ?? 0),
        unknown_endpoints: Number(data?.unknown_endpoints ?? 0),
      };
    },
    refetchInterval: 30000,
  });

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "Please sign in again on the main site if needed.",
    });
  };

  const handleBackfill = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("backfill-push-user-links");
      if (error) throw error;
      toast({
        title: "Backfill complete",
        description: `${data?.updated ?? 0} subscriptions linked. Unknown remaining: ${data?.remaining_unknown ?? 0}`,
      });
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Backfill failed", 
        description: err?.message ?? "Please try again later.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" title="Distinct users with notifications enabled">
              Users: {enabled?.count ?? 0}
            </Badge>
            <Badge variant="outline" title="Active device endpoints">
              Devices: {enabled?.devices ?? 0}
            </Badge>
            <Badge variant="outline" title="Active endpoints not linked to a user">
              Unknown: {enabled?.unknown_endpoints ?? 0}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            title="Attempt to link historical subscriptions to users"
            onClick={handleBackfill}
          >
            Backfill
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-sm text-primary hover:underline"
            title="Back to site"
          >
            Back to site
          </a>
          {user?.email && (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};