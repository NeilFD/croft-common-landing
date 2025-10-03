import { useState, useEffect } from 'react';
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
  const [userName, setUserName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [managementUser?.user?.id]);

  const loadProfile = async () => {
    if (!managementUser?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('management_profiles')
        .select('user_name, job_title')
        .eq('user_id', managementUser.user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserName(data.user_name);
        setJobTitle(data.job_title);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim() || !jobTitle.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive'
      });
      return;
    }

    setProfileLoading(true);

    try {
      const { error } = await supabase.rpc('update_my_management_profile', {
        p_user_name: userName.trim(),
        p_job_title: jobTitle.trim()
      });

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setProfileLoading(false);
    }
  };

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
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your profile details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">User Name</Label>
              <Input
                id="userName"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="John Smith"
                required
              />
              <p className="text-xs text-muted-foreground">Enter as: [first name] [surname]</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={managementUser?.user?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g. Sales Manager"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <div>
                <Badge variant={managementUser?.role === 'admin' ? 'default' : 'secondary'}>
                  {managementUser?.role || 'No role assigned'}
                </Badge>
              </div>
            </div>

            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? 'Updating...' : 'Update Profile'}
            </Button>
          </form>
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
