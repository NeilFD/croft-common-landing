
import React, { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposeNotificationForm } from "./components/ComposeNotificationForm";
import { NotificationsTable } from "./components/NotificationsTable";
import { DeliveriesTable } from "./components/DeliveriesTable";
import { toast } from "@/hooks/use-toast";

type NotificationRow = {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  created_by_email: string | null;
  title: string;
  body: string;
  url: string | null;
  icon: string | null;
  badge: string | null;
  scope: "all" | "self";
  status: "draft" | "queued" | "sending" | "sent" | "failed";
  dry_run: boolean;
  recipients_count: number;
  success_count: number;
  failed_count: number;
  sent_at: string | null;
};

const Header: React.FC<{
  userEmail: string | null;
  onSignOut: () => void;
}> = ({ userEmail, onSignOut }) => {
  return (
    <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Notifications Admin</span>
          <span className="text-muted-foreground text-sm">Croft Common</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/"
            className="text-sm text-primary hover:underline"
            title="Back to site"
          >
            Back to site
          </a>
          {userEmail ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {userEmail}
              </span>
              <Button variant="outline" size="sm" onClick={onSignOut}>
                Sign out
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export const AdminNotificationsApp: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const queryClient = useMemo(() => new QueryClient(), []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      setUserEmail(email);
      setReady(true);
      if (!email) {
        toast({
          title: "Sign-in required",
          description:
            "Please sign in on the main site first. This page will use your existing session.",
        });
      }
    });
  }, []);

  const onSent = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserEmail(null);
    toast({
      title: "Signed out",
      description: "Please sign in again on the main site if needed.",
    });
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              To use the admin console, sign in on the main site first, then
              return to this page.
            </p>
            <div className="flex gap-2">
              <a href="/" className="underline text-primary text-sm">
                Go to main site
              </a>
            </div>
          </CardContent>
        </Card>
        <Toaster />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <Header userEmail={userEmail} onSignOut={handleSignOut} />
        <main className="container mx-auto p-4 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComposeNotificationForm onSent={onSent} />
            <Card className="order-first lg:order-none">
              <CardHeader>
                <CardTitle>History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationsTable
                  onSelect={(id) => setSelectedId(id)}
                  selectedId={selectedId}
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Deliveries</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedId ? (
                <DeliveriesTable notificationId={selectedId} />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Select a notification to view deliveries.
                </p>
              )}
            </CardContent>
          </Card>
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
};
