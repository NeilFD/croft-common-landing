import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { PasswordStrengthIndicator } from '../settings/PasswordStrengthIndicator';
import { useNavigate } from 'react-router-dom';

const PasswordChangeRequired = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password: string) => {
    const requirements = [
      { met: password.length >= 8, text: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /[0-9]/.test(password), text: 'One number' }
    ];
    return requirements;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        description: 'Your password has been set successfully'
      });

      // Redirect to management dashboard
      navigate('/management');
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="font-brutalist text-2xl">Change Password Required</CardTitle>
          <CardDescription>
            Please set a new password to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
                required
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
                required
              />
            </div>

            <div className="p-3 bg-yellow-50 dark:bg-yellow-950 border border-yellow-500 rounded text-sm">
              <strong>First Login:</strong> You must change your temporary password before accessing the management portal.
            </div>

            <Button type="submit" className="w-full" disabled={loading || !newPassword || !confirmPassword}>
              {loading ? 'Setting Password...' : 'Set New Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasswordChangeRequired;
