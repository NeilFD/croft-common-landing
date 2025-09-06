import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface LedgerPasswordPromptProps {
  onPasswordSubmit: (password: string) => Promise<boolean>;
  loading: boolean;
  isLocked?: boolean;
  lockedUntil?: Date;
}

export const LedgerPasswordPrompt: React.FC<LedgerPasswordPromptProps> = ({
  onPasswordSubmit,
  loading,
  isLocked,
  lockedUntil
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      const success = await onPasswordSubmit(password);
      if (!success) {
        setPassword('');
      }
    }
  };

  const formatTimeRemaining = () => {
    if (!lockedUntil) return '';
    
    const now = new Date();
    const diff = lockedUntil.getTime() - now.getTime();
    
    if (diff <= 0) return '';
    
    const minutes = Math.ceil(diff / (1000 * 60));
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-2 border-black shadow-lg">
        <CardHeader className="text-center">
          <Lock className="mx-auto h-12 w-12 text-primary mb-4" />
          <CardTitle className="text-2xl font-brutalist">
            {isLocked ? 'Access Locked' : 'Access Your Ledger'}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {isLocked 
              ? `Too many failed attempts. Try again in ${formatTimeRemaining()}`
              : 'Enter your ledger password to view transaction history'
            }
          </p>
        </CardHeader>
        <CardContent>
          {!isLocked && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your ledger password"
                    className="pr-10"
                    required
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

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading || !password.trim()}
              >
                {loading ? 'Verifying...' : 'Access Ledger'}
              </Button>
            </form>
          )}
          
          {isLocked && (
            <div className="text-center py-4">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
                className="mt-4"
              >
                Try Again Later
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};