
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
import { AuthModal } from "@/components/AuthModal";
import CroftLogo from "@/components/CroftLogo";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          <CroftLogo size="sm" className="shrink-0" />
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold">Notifications Admin</span>
            <span className="text-muted-foreground text-sm">Croft Common</span>
          </div>
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
  const [authOpen, setAuthOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'dry'>('all');

  const queryClient = useMemo(() => new QueryClient(), []);

  // Process magic link tokens on admin page
  useEffect(() => {
    const processTokens = async () => {
      try {
        const hash = window.location.hash || "";
        if (hash.includes("access_token") && hash.includes("refresh_token")) {
          const params = new URLSearchParams(hash.slice(1));
          const access_token = params.get("access_token");
          const refresh_token = params.get("refresh_token");
          if (access_token && refresh_token) {
            await supabase.auth.setSession({ access_token, refresh_token });
            const url = new URL(window.location.href);
            url.hash = "";
            if (url.searchParams.get("auth") === "true") {
              url.searchParams.delete("auth");
            }
            window.history.replaceState({}, "", url.toString());
          }
        }
      } catch (e) {
        console.error("Failed to process auth tokens from URL", e);
      }
    };
    processTokens();
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      if (!email) {
        setAuthOpen(true);
      } else {
        setAuthOpen(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      setReady(true);
      if (!email) setAuthOpen(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      <div className="min-h-screen">
        <AuthModal
          isOpen={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={async () => {
            const { data } = await supabase.auth.getUser();
            setUserEmail(data.user?.email ?? null);
            setAuthOpen(false);
            toast({ title: "Signed in", description: "You can now use the admin console." });
          }}
          requireAllowedDomain
          title="Admin sign in"
          description="Enter your authorized email to access the Notifications Admin."
          emailSentTitle="Check your email"
          emailSentDescription={
            <>
              <p>Click the magic link; you’ll return here signed in to the Notifications Admin.</p>
              <p>If this tab doesn’t refresh automatically, click Got it.</p>
            </>
          }
          onMagicLinkSent={() => setAuthOpen(false)}
        />
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>History</CardTitle>
                <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as 'all' | 'live' | 'dry')}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="live">Live</TabsTrigger>
                    <TabsTrigger value="dry">Dry runs</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationsTable
                  onSelect={(id) => setSelectedId(id)}
                  selectedId={selectedId}
                  filterMode={filterMode}
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
