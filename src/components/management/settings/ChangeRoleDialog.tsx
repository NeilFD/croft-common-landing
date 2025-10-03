import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface User {
  user_id: string;
  email: string;
  role: string;
}

interface ChangeRoleDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ChangeRoleDialog = ({ user, open, onOpenChange, onSuccess }: ChangeRoleDialogProps) => {
  const [newRole, setNewRole] = useState<'admin' | 'manager'>(user.role as any);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newRole === user.role) {
      toast({
        title: 'No changes',
        description: 'The role is already set to this value',
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('update_management_user_role', {
        p_user_id: user.user_id,
        p_new_role: newRole
      });

      if (error) throw error;

      toast({
        title: 'Role updated',
        description: `${user.email} is now a ${newRole}`
      });

      onSuccess();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the management role for {user.email}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div className="font-medium capitalize">{user.role}</div>
            </div>

            <div className="space-y-2">
              <Label>New Role</Label>
              <RadioGroup value={newRole} onValueChange={(value) => setNewRole(value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="manager" id="manager-change" />
                  <Label htmlFor="manager-change" className="font-normal cursor-pointer">
                    Manager
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin-change" />
                  <Label htmlFor="admin-change" className="font-normal cursor-pointer">
                    Admin
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || newRole === user.role}>
              {loading ? 'Updating...' : 'Update Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
