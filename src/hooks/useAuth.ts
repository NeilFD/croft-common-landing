import { useState, useEffect, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';


export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const lastAutoLinkAttempt = useRef<number>(0);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔐 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔐 Initial session result:', { session: session?.user?.email, error });
        
        if (error) {
          console.error('🚨 Error getting initial session:', error);
          console.error('🚨 Error details:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);

          // Also try auto-linking on initial load if user is already signed in
          // But only if it hasn't been attempted recently (prevent spam)
          if (session?.user && Date.now() - lastAutoLinkAttempt.current > 30000) { // 30 seconds cooldown
            lastAutoLinkAttempt.current = Date.now();
            setTimeout(async () => {
              try {
                const { data } = await supabase.functions.invoke('auto-link-push-subscription');
                if (data?.linked) {
                  console.log('🔗 Push subscription automatically linked on load');
                }
              } catch (error) {
                console.log('Auto-link failed (this is normal if no subscriptions exist):', error);
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('🚨 Exception getting initial session:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        console.log('🔐 Auth state change:', {
          event,
          user: session?.user?.email,
          timestamp: new Date().toISOString(),
          url: window.location.href
        });
        
        // Only synchronous state updates here
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Defer any Supabase calls with setTimeout to prevent deadlocks
        if (event === 'SIGNED_IN' && session && Date.now() - lastAutoLinkAttempt.current > 30000) {
          console.log('✅ User successfully signed in:', session.user.email);
          lastAutoLinkAttempt.current = Date.now();
          
          setTimeout(() => {
            supabase.functions.invoke('auto-link-push-subscription')
              .then(({ data }) => {
                if (data?.linked) {
                  console.log('🔗 Push subscription automatically linked');
                }
              })
              .catch((error) => {
                console.log('Auto-link failed (this is normal if no subscriptions exist):', error);
              });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 User signed out');
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
        }
      }
    );

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setSession(session);
    setUser(session?.user ?? null);
    return session;
  };

  return {
    user,
    session,
    loading,
    signOut,
    refreshSession
  };
};
