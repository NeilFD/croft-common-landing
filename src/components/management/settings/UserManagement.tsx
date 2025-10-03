import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CreateUserDialog } from './CreateUserDialog';
import { UserManagementTable } from './UserManagementTable';
import { toast } from '@/hooks/use-toast';

interface ManagementUser {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

export const UserManagement = () => {
  const [users, setUsers] = useState<ManagementUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Get all users with management roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('role', ['admin', 'manager'])
        .order('role', { ascending: true });

      if (rolesError) throw rolesError;

      // Get user emails from auth.users using admin query
      const userIds = userRoles?.map(ur => ur.user_id) || [];
      
      // Fetch user details for each user_id
      const usersWithEmails = await Promise.all(
        (userRoles || []).map(async (ur) => {
          // Try to get email from profiles first (faster)
          const { data: profile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', ur.user_id)
            .single();

          // Get email from auth metadata (we'll need to use RPC or edge function for this in production)
          // For now, we'll show user_id as placeholder
          return {
            user_id: ur.user_id,
            email: `User ${ur.user_id.substring(0, 8)}...`, // Placeholder
            role: ur.role,
            created_at: new Date().toISOString() // Placeholder
          };
        })
      );

      setUsers(usersWithEmails);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Error loading users',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUserCreated = () => {
    loadUsers();
    setCreateDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-brutalist text-2xl">User Management</h2>
          <p className="text-muted-foreground mt-1">
            Manage access to the management portal
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

      <UserManagementTable users={users} onRefresh={loadUsers} />

      <CreateUserDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onUserCreated={handleUserCreated}
      />
    </div>
  );
};
