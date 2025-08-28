
import React, { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposeNotificationForm } from "./components/ComposeNotificationForm";
import { NotificationsTable } from "./components/NotificationsTable";
import { DeliveriesTable } from "./components/DeliveriesTable";
import { NotificationPicker } from "./components/NotificationPicker";
import { toast } from "@/hooks/use-toast";
import { AuthModal } from "@/components/AuthModal";
import CroftLogo from "@/components/CroftLogo";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OptInAnalytics } from "./components/OptInAnalytics";
import { UserAnalytics } from "./components/UserAnalytics";
import { SubscribersTable } from "./components/SubscribersTable";
import MomentsModeration from "./components/MomentsModeration";
import { GranularAnalytics } from "./components/GranularAnalytics";

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

  return (
    <div className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <CroftLogo size="sm" className="shrink-0" />
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">Notifications Admin</span>
          <span className="text-muted-foreground text-sm">Croft Common</span>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" title="Distinct users with notifications enabled">
              Users: {enabled?.count ?? 0}
            </Badge>
            <Badge variant="outline" title="Active device endpoints">
              Devices: {enabled?.devices ?? 0}
            </Badge>
            <Badge variant="outline" title="Active endpoints not linked to a user">
              Unknown: {enabled?.unknown_endpoints ?? 0}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              title="Attempt to link historical subscriptions to users"
              onClick={async () => {
                try {
                  const { data, error } = await supabase.functions.invoke("backfill-push-user-links");
                  if (error) throw error;
                  toast({
                    title: "Backfill complete",
                    description: `${data?.updated ?? 0} subscriptions linked. Unknown remaining: ${data?.remaining_unknown ?? 0}`,
                  });
                } catch (err: any) {
                  console.error(err);
                  toast({ title: "Backfill failed", description: err?.message ?? "Please try again later.", variant: "destructive" });
                }
              }}
            >
              Backfill
            </Button>
          </div>
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
  const [archivedFilter, setArchivedFilter] = useState<'all' | 'active' | 'archived'>('active');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'queued' | 'sent'>('all');
  const [rightTab, setRightTab] = useState<'history' | 'analytics' | 'user-analytics' | 'granular' | 'subscribers' | 'moments'>('history');

  const queryClient = useQueryClient();

  // Process magic link tokens on admin page (supports hash, query, or pending localStorage)
  useEffect(() => {
    const processTokens = async () => {
      try {
        console.log('🔐 Admin: Processing auth tokens on load');
        const hash = window.location.hash || "";
        const search = window.location.search || "";
        const hashParams = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash);
        const searchParams = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);

        let access_token = hashParams.get("access_token") || searchParams.get("access_token");
        let refresh_token = hashParams.get("refresh_token") || searchParams.get("refresh_token");
        let code = hashParams.get("code") || searchParams.get("code");

        console.log('🔐 Admin: URL tokens found:', { 
          hasAccessToken: !!access_token, 
          hasRefreshToken: !!refresh_token, 
          hasCode: !!code,
          hash: hash.substring(0, 50),
          search: search.substring(0, 50)
        });

        // If not present in URL, check pending tokens captured by admin.html
        if ((!access_token || !refresh_token) && !code) {
          const pending = localStorage.getItem('pending_supabase_tokens');
          if (pending) {
            try {
              const parsed = JSON.parse(pending);
              access_token = parsed.at;
              refresh_token = parsed.rt;
              console.log('🔐 Admin: Using pending tokens from localStorage');
            } catch {}
          }
          const pendingCode = localStorage.getItem('pending_supabase_code');
          if (pendingCode) {
            code = pendingCode;
            console.log('🔐 Admin: Using pending code from localStorage');
          }
        }

        // Process authentication BEFORE cleaning URL
        if (code && (!access_token || !refresh_token)) {
          console.log('🔐 Admin: Exchanging code for session');
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (!error && data.session) {
              console.log('✅ Admin: Code exchange successful');
              try { localStorage.removeItem('pending_supabase_code'); } catch {}
            } else {
              console.error('🚨 Admin: Code exchange failed:', error);
            }
          } catch (e) {
            console.error('🚨 Admin: exchangeCodeForSession failed', e);
          }
        } else if (access_token && refresh_token) {
          console.log('🔐 Admin: Setting session with tokens');
          const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
          if (!error && data.session) {
            console.log('✅ Admin: Session set successfully');
          } else {
            console.error('🚨 Admin: Session set failed:', error);
          }
          try { localStorage.removeItem('pending_supabase_tokens'); } catch {}
        }

        // Clean the URL AFTER processing tokens
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.delete("access_token");
        url.searchParams.delete("refresh_token");
        url.searchParams.delete("code");
        if (url.searchParams.get("auth") === "true") {
          url.searchParams.delete("auth");
        }
        console.log('🔐 Admin: Cleaning URL from', window.location.href, 'to', url.toString());
        window.history.replaceState({}, "", url.toString());
      } catch (e) {
        console.error("🚨 Admin: Failed to process auth tokens from URL", e);
      }
    };
    processTokens();
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      
      // Debug session state for admin interface
      console.log('🔐 Admin: Auth state change', { 
        event, 
        hasSession: !!session, 
        email,
        userId: session?.user?.id 
      });
      
      // Test database session after auth change
      if (session?.user) {
        try {
          const { data: testData, error: testError } = await supabase
            .from('member_moments')
            .select('id')
            .limit(1);
          console.log('🔍 Admin: DB session test result:', { 
            canQuery: !testError, 
            error: testError?.message,
            rowCount: testData?.length 
          });
        } catch (e) {
          console.error('🚨 Admin: DB session test failed:', e);
        }
      }
      
      // Avoid reopening modal on transient refresh events; only open on explicit sign-out
      if (event === 'SIGNED_OUT') {
        setAuthOpen(true);
      }
    });

    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!mounted) return;
        
        const email = session?.user?.email ?? null;
        setUserEmail(email);
        setReady(true);
        
        // Debug initial session state
        console.log('🔐 Admin: Initial session check', { 
          hasSession: !!session, 
          email,
          userId: session?.user?.id,
          error: error?.message 
        });
        
        // Test database session on initial load
        if (session?.user) {
          try {
            const { data: testData, error: testError } = await supabase
              .from('member_moments')
              .select('id')
              .limit(1);
            console.log('🔍 Admin: Initial DB session test:', { 
              canQuery: !testError, 
              error: testError?.message,
              rowCount: testData?.length 
            });
          } catch (e) {
            console.error('🚨 Admin: Initial DB session test failed:', e);
          }
        }
        
        if (!email) setAuthOpen(true);
      } catch (error) {
        console.error('🚨 Admin: Failed to get initial session:', error);
        if (mounted) {
          setReady(true);
          setAuthOpen(true);
        }
      }
    };

    initializeSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const onSent = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  const { data: editing } = useQuery({
    queryKey: ["notification", selectedId],
    enabled: !!selectedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, title, body, url, icon, badge, scope, dry_run, status, scheduled_for, schedule_timezone, repeat_rule, repeat_until, occurrences_limit")
        .eq("id", selectedId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

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
              <p>Click the 6-digit code from your email; you’ll return here signed in to the Notifications Admin.</p>
              <p>If this tab doesn’t refresh automatically, click Got it.</p>
            </>
          }
        />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header userEmail={userEmail} onSignOut={handleSignOut} />
      <main className="container mx-auto p-4 space-y-6">
        <div className="flex flex-col gap-6">
          <ComposeNotificationForm
            key={selectedId ?? 'new'}
            onSent={onSent}
            editing={selectedId ? editing : null}
            onClearEdit={() => {
              if (selectedId) {
                queryClient.removeQueries({ queryKey: ["notification", selectedId] });
              }
              setSelectedId(null);
            }}
          />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CardTitle>
                  {rightTab === 'history' ? 'History' : 
                   rightTab === 'analytics' ? 'Opt-in Analytics' : 
                   rightTab === 'user-analytics' ? 'User Analytics' : 
                   rightTab === 'granular' ? 'Granular Analytics' :
                   rightTab === 'moments' ? 'Member Moments' : 'Subscribers'}
                </CardTitle>
                <Tabs value={rightTab} onValueChange={(v) => setRightTab(v as 'history' | 'analytics' | 'user-analytics' | 'granular' | 'subscribers' | 'moments')}>
                  <TabsList>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="analytics">Opt‑in</TabsTrigger>
                    <TabsTrigger value="user-analytics">User Analytics</TabsTrigger>
                    <TabsTrigger value="granular">Granular</TabsTrigger>
                    <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                    <TabsTrigger value="moments">Moments</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              {rightTab === 'history' && (
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  <Tabs value={filterMode} onValueChange={(v) => setFilterMode(v as 'all' | 'live' | 'dry')}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="live">Live</TabsTrigger>
                      <TabsTrigger value="dry">Dry runs</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'draft' | 'queued' | 'sent')}>
                    <TabsList>
                      <TabsTrigger value="all">Any status</TabsTrigger>
                      <TabsTrigger value="draft">Drafts</TabsTrigger>
                      <TabsTrigger value="queued">Scheduled</TabsTrigger>
                      <TabsTrigger value="sent">Sent</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <Tabs value={archivedFilter} onValueChange={(v) => setArchivedFilter(v as 'all' | 'active' | 'archived')}>
                    <TabsList>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="archived">Archived</TabsTrigger>
                      <TabsTrigger value="all">All</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {rightTab === 'history' ? (
                <NotificationsTable
                  onSelect={(id) => setSelectedId(id)}
                  selectedId={selectedId}
                  filterMode={filterMode}
                  archivedFilter={archivedFilter}
                  statusFilter={statusFilter}
                />
              ) : rightTab === 'analytics' ? (
                <OptInAnalytics embedded />
              ) : rightTab === 'user-analytics' ? (
                <UserAnalytics />
              ) : rightTab === 'granular' ? (
                <GranularAnalytics />
              ) : rightTab === 'moments' ? (
                <MomentsModeration />
              ) : (
                <SubscribersTable />
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle>Deliveries</CardTitle>
            <div className="w-full sm:w-auto">
              <NotificationPicker value={selectedId} onChange={(id) => setSelectedId(id)} />
            </div>
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
  );
};
