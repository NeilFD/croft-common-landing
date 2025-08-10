import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';


export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

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
        if (mounted) {
          console.log('🔐 Auth state change:', {
            event,
            user: session?.user?.email,
            timestamp: new Date().toISOString(),
            url: window.location.href
          });
          
          // Log any potential redirects
          if (event === 'SIGNED_IN' && session) {
            console.log('✅ User successfully signed in:', session.user.email);
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out');
          } else if (event === 'TOKEN_REFRESHED') {
            console.log('🔄 Token refreshed');
          }
          
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
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
