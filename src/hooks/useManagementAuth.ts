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
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Get user's management role
          const { data: roleData } = await supabase
            .rpc('get_user_management_role', { _user_id: session.user.id });
          
          setManagementUser({
            user: session.user,
            role: roleData as ManagementRole,
            hasAccess: !!roleData
          });
        } else {
          setManagementUser(null);
        }
      } catch (error) {
        console.error('Error getting management session:', error);
        setManagementUser(null);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: roleData } = await supabase
          .rpc('get_user_management_role', { _user_id: session.user.id });
        
        setManagementUser({
          user: session.user,
          role: roleData as ManagementRole,
          hasAccess: !!roleData
        });
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