import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

export interface CBMemberProfile {
  id: string;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birthday_day: number | null;
  birthday_month: string | null;
  interests: string[] | null;
}

/**
 * Crazy Bear member auth hook. Clean implementation, no legacy biometric/OTP.
 * Session persistence is handled by the supabase client (localStorage + autoRefresh)
 * which keeps members signed in for as long as the refresh token is valid.
 */
export const useCBMember = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CBMemberProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadProfile(sess.user!.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadProfile(sess.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from('cb_members')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();
    if (data) setProfile(data as CBMemberProfile);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return {
    user,
    session,
    profile,
    loading,
    isMember: !!user,
    signOut,
    refreshProfile: () => user && loadProfile(user.id),
  };
};
