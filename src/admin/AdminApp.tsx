import React, { useEffect, useState, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from '@/components/ui/toaster';
import { AuthModal } from '@/components/AuthModal';
import { toast } from '@/hooks/use-toast';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotificationCompose } from './pages/NotificationCompose';
import { NotificationHistory } from './pages/NotificationHistory';
import { OptInAnalytics } from './pages/OptInAnalytics';
import { UserAnalyticsPage } from './pages/UserAnalyticsPage';
import { GranularAnalyticsPage } from './pages/GranularAnalyticsPage';
import { SubscribersPage } from './pages/SubscribersPage';
import { MomentsPage } from './pages/MomentsPage';
import { CinemaPage } from './pages/CinemaPage';
import LeadsList from '../pages/management/LeadsList';

const LeadDetail = lazy(() => import('../pages/management/LeadDetail'));

export const AdminApp = () => {
  const [ready, setReady] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  // Process magic link tokens on admin page
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
      
      // Avoid reopening modal on transient refresh events
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
          description="Enter your authorized email to access the admin interface."
          emailSentTitle="Check your email"
          emailSentDescription={
            <>
              <p>Click the 6-digit code from your email; you'll return here signed in to the admin interface.</p>
              <p>If this tab doesn't refresh automatically, click Got it.</p>
            </>
          }
        />
        <Toaster />
      </div>
    );
  }

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/notifications/compose" element={<NotificationCompose />} />
        <Route path="/notifications/history" element={<NotificationHistory />} />
        <Route path="/analytics/opt-in" element={<OptInAnalytics />} />
        <Route path="/analytics/users" element={<UserAnalyticsPage />} />
        <Route path="/analytics/granular" element={<GranularAnalyticsPage />} />
        <Route path="/management/subscribers" element={<SubscribersPage />} />
        <Route path="/management/moments" element={<MomentsPage />} />
        <Route path="/management/cinema" element={<CinemaPage />} />
        <Route path="/management/leads" element={<LeadsList />} />
        <Route path="/management/leads/:id" element={<LeadDetail />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
      <Toaster />
    </AdminLayout>
  );
};