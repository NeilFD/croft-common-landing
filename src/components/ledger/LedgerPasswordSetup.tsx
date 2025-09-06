import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface LedgerPasswordSetupProps {
  onPasswordSet: (password: string) => Promise<boolean>;
  loading: boolean;
}

export const LedgerPasswordSetup: React.FC<LedgerPasswordSetupProps> = ({
  onPasswordSet,
  loading
}) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 6) {
      return;
    }
    
    if (password !== confirmPassword) {
      return;
    }

    const success = await onPasswordSet(password);
    if (success) {
      setPassword('');
      setConfirmPassword('');
    }
  };

  const isValid = password.length >= 6 && password === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-lg">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-brutalist">
            Secure Your Ledger
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Set a password to protect your transaction history
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="pr-10"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-auto p-1"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {password && password.length < 6 && (
              <p className="text-sm text-destructive">
                Password must be at least 6 characters long
              </p>
            )}

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive">
                Passwords do not match
              </p>
            )}

            <Button 
              type="submit" 
              className="w-full"
              disabled={!isValid || loading}
            >
              {loading ? 'Setting up...' : 'Secure My Ledger'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};