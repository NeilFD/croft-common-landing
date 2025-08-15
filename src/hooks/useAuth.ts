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

          // Also try auto-linking on initial load if user is already signed in
          if (session?.user) {
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
      async (event, session) => {
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
            
            // Check if this is a new user who just verified their email
            // and send welcome email if they're a subscriber
            setTimeout(async () => {
              try {
                // First auto-link push subscriptions
                const { data } = await supabase.functions.invoke('auto-link-push-subscription');
                if (data?.linked) {
                  console.log('🔗 Push subscription automatically linked');
                }
                
                // Check if user is a subscriber and send welcome email
                const { data: subscriber } = await supabase
                  .from('subscribers')
                  .select('*')
                  .eq('email', session.user.email)
                  .eq('is_active', true)
                  .single();
                
                if (subscriber) {
                  console.log('📧 Sending welcome email to subscriber:', session.user.email);
                  const welcomeResponse = await supabase.functions.invoke('send-welcome-email', {
                    body: {
                      email: session.user.email,
                      name: subscriber.name,
                      subscriberId: subscriber.id,
                      userId: session.user.id
                    }
                  });
                  
                  if (welcomeResponse.error) {
                    console.error('❌ Welcome email failed:', welcomeResponse.error);
                  } else {
                    console.log('✅ Welcome email sent successfully');
                  }
                }
              } catch (error) {
                console.log('Auto-operations failed:', error);
              }
            }, 1000); // Small delay to ensure auth is fully established
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
