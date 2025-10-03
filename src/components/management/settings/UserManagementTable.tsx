import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, ShieldAlert, Key, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChangeRoleDialog } from './ChangeRoleDialog';

interface User {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

interface UserManagementTableProps {
  users: User[];
  onRefresh: () => void;
}

export const UserManagementTable = ({ users, onRefresh }: UserManagementTableProps) => {
  const [deactivateUser, setDeactivateUser] = useState<User | null>(null);
  const [changeRoleUser, setChangeRoleUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDeactivate = async () => {
    if (!deactivateUser) return;

    try {
      setLoading(true);
      const { error } = await supabase.rpc('deactivate_management_user', {
        p_user_id: deactivateUser.user_id
      });

      if (error) throw error;

      toast({
        title: 'User deactivated',
        description: `${deactivateUser.email} has been deactivated`
      });

      onRefresh();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
      setDeactivateUser(null);
    }
  };

  const handleForcePasswordChange = async (userId: string, email: string) => {
    try {
      const { error } = await supabase.rpc('force_password_change', {
        p_user_id: userId
      });

      if (error) throw error;

      toast({
        title: 'Password change required',
        description: `${email} will be prompted to change their password on next login`
      });
    } catch (error) {
      console.error('Error forcing password change:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setChangeRoleUser(user)}>
                          <ShieldAlert className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleForcePasswordChange(user.user_id, user.email)}
                        >
                          <Key className="h-4 w-4 mr-2" />
                          Force Password Change
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeactivateUser(user)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deactivate User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deactivateUser} onOpenChange={() => setDeactivateUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate {deactivateUser?.email}?
              They will lose all management access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={loading}>
              {loading ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {changeRoleUser && (
        <ChangeRoleDialog
          user={changeRoleUser}
          open={!!changeRoleUser}
          onOpenChange={(open) => !open && setChangeRoleUser(null)}
          onSuccess={() => {
            setChangeRoleUser(null);
            onRefresh();
          }}
        />
      )}
    </>
  );
};
