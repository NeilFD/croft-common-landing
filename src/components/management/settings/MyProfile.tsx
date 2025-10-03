import { useState } from 'react';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

export const MyProfile = () => {
  const { managementUser } = useManagementAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validatePassword = (password: string) => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /[0-9]/.test(password), text: 'One number' }
    ];
    return requirements;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const requirements = validatePassword(newPassword);
    if (requirements.some(r => !r.met)) {
      toast({
        title: 'Password requirements not met',
        description: 'Please ensure your password meets all requirements',
        variant: 'destructive'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'New password and confirm password must match',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      // Mark password as changed
      await supabase.rpc('mark_password_changed');

      toast({
        title: 'Password updated',
        description: 'Your password has been changed successfully'
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
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
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your management portal account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Email</Label>
            <div className="mt-1 font-medium">{managementUser?.user.email}</div>
          </div>
          <div>
            <Label>Role</Label>
            <div className="mt-1">
              <Badge variant={managementUser?.role === 'admin' ? 'default' : 'secondary'}>
                {managementUser?.role}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your password for the management portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              {newPassword && (
                <PasswordStrengthIndicator requirements={validatePassword(newPassword)} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Button type="submit" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? 'Updating...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
