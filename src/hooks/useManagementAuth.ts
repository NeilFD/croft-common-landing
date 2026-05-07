import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export type ManagementRole = 'admin' | 'sales' | 'ops' | 'finance' | 'readonly';

export interface ManagementUser {
  user: User;
  role: ManagementRole | null;
  hasAccess: boolean;
}

export const useManagementAuth = () => {
  const [managementUser, setManagementUser] = useState<ManagementUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        console.log('🔑 useManagementAuth: Getting session...');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔑 useManagementAuth: Session:', session?.user?.email);
        
        if (session?.user) {
          // Get user's management role with timeout
          console.log('🔑 useManagementAuth: Fetching role for user:', session.user.id);
          
          const rolePromise = (supabase as any).rpc('get_user_management_role', { _user_id: session.user.id });
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
          );
          
          try {
            const { data: roleData, error: roleError } = await Promise.race([
              rolePromise,
              timeoutPromise
            ]) as any;
            
            console.log('🔑 useManagementAuth: Role data:', roleData, 'Error:', roleError);
            
            setManagementUser({
              user: session.user,
              role: roleData as ManagementRole,
              hasAccess: !!roleData
            });
          } catch (roleErr) {
            console.error('🔑 useManagementAuth: Role fetch failed:', roleErr);
            // Set user without role on timeout/error
            setManagementUser({
              user: session.user,
              role: null,
              hasAccess: false
            });
          }
        } else {
          console.log('🔑 useManagementAuth: No session found');
          setManagementUser(null);
        }
      } catch (error) {
        console.error('🔑 useManagementAuth: Error getting management session:', error);
        setManagementUser(null);
      } finally {
        console.log('🔑 useManagementAuth: Setting loading to false');
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Synchronously update state first, defer async calls
      if (session?.user) {
        // Set user immediately
        setManagementUser({
          user: session.user,
          role: null,
          hasAccess: false
        });
        
        // Defer role fetch to avoid blocking auth state change callback
        setTimeout(async () => {
          try {
            const rolePromise = (supabase as any).rpc('get_user_management_role', { _user_id: session.user.id });
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
            );
            
            const { data: roleData } = await Promise.race([
              rolePromise,
              timeoutPromise
            ]) as any;
            
            setManagementUser({
              user: session.user,
              role: roleData as ManagementRole,
              hasAccess: !!roleData
            });
          } catch (err) {
            console.error('🔑 useManagementAuth: Role fetch failed in auth change:', err);
            setManagementUser({
              user: session.user,
              role: null,
              hasAccess: false
            });
          }
        }, 0);
      } else {
        setManagementUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setManagementUser(null);
  };

  return {
    managementUser,
    loading,
    signOut,
    hasRole: (role: ManagementRole) => managementUser?.role === role,
    hasAnyRole: (roles: ManagementRole[]) => managementUser?.role && roles.includes(managementUser.role),
    canEdit: () => managementUser?.role && ['admin', 'sales'].includes(managementUser.role),
    canEditHours: () => managementUser?.role === 'admin',
    canViewAudit: () => managementUser?.role && ['admin', 'finance'].includes(managementUser.role)
  };
};