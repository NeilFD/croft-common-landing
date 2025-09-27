import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Mail, Eye, EyeOff } from 'lucide-react';
import CroftLogo from '@/components/CroftLogo';

const ManagementLogin = () => {
  const { managementUser, loading } = useManagementAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isPasswordUpdateMode, setIsPasswordUpdateMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // Handle password reset/auth tokens from URL (robust for multiple Supabase flows)
    const processAuthTokens = async () => {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      const accessToken = params.get('access_token') || hashParams.get('access_token');
      const refreshToken = params.get('refresh_token') || hashParams.get('refresh_token');
      const code = params.get('code') || hashParams.get('code');
      const tokenHash = params.get('token_hash') || hashParams.get('token_hash');
      const token = params.get('token') || hashParams.get('token');
      const email = params.get('email') || hashParams.get('email');
      const type = params.get('type') || hashParams.get('type');

      try {
        // Handle direct session tokens
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;

          if (type === 'recovery') {
            setIsPasswordUpdateMode(true);
          }
          // Clean up URL
          window.history.replaceState({}, document.title, '/management/login');
          return;
        }

        // Handle PKCE/code exchange
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          if (type === 'recovery') {
            setIsPasswordUpdateMode(true);
          }
          window.history.replaceState({}, document.title, '/management/login');
          return;
        }

        // Handle recovery via token_hash or token
        if (type === 'recovery' && (tokenHash || token)) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            // token_hash variant (most common for recovery links)
            token_hash: tokenHash || undefined,
            // token variant (fallback if template provided Token)
            token: tokenHash ? undefined : (token as string),
            email: tokenHash ? undefined : (email || undefined),
          } as any);
          if (error) throw error;

          setIsPasswordUpdateMode(true);
          window.history.replaceState({}, document.title, '/management/login');
          return;
        }
      } catch (err: any) {
        toast({
          title: 'Invalid reset link',
          description: err?.message || 'The password reset link is invalid or expired',
          variant: 'destructive',
        });
      }
    };

    processAuthTokens();
  }, []);

  // Also react to Supabase auth events in case the redirect established a recovery session
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordUpdateMode(true);
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);


  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please ensure both passwords are identical",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        toast({
          title: "Password update failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Password updated successfully",
        description: "You can now sign in with your new password"
      });
      
      setIsPasswordUpdateMode(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      toast({
        title: "Password update failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (managementUser?.hasAccess && !isPasswordUpdateMode) {
    return <Navigate to="/management" replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Sign in failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Signed in successfully",
        description: "Welcome to the management portal"
      });
      
      navigate('/management');
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/management/login`
      });

      if (error) {
        toast({
          title: "Reset failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Reset email sent",
        description: "Check your email for password reset instructions"
      });
      
      setIsResetMode(false);
    } catch (error) {
      toast({
        title: "Reset failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4">
      <div className="absolute top-6 left-6">
        <CroftLogo size="lg" />
      </div>
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Croft Common
            </h1>
            <p className="text-muted-foreground">Management Portal</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {isPasswordUpdateMode ? 'Set New Password' : isResetMode ? 'Reset Password' : 'Sign In'}
              </CardTitle>
              <CardDescription>
                {isPasswordUpdateMode 
                  ? 'Enter your new password below'
                  : isResetMode 
                    ? 'Enter your email to receive reset instructions'
                    : 'Access the management dashboard'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {isPasswordUpdateMode ? (
                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pr-10"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Updating...</span>
                      </div>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              ) : (
                <form onSubmit={isResetMode ? handlePasswordReset : handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {!isResetMode && (
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{isResetMode ? 'Sending...' : 'Signing in...'}</span>
                      </div>
                    ) : (
                      isResetMode ? 'Send Reset Email' : 'Sign In'
                    )}
                  </Button>

                  <div className="text-center">
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setIsResetMode(!isResetMode)}
                      className="text-sm"
                    >
                      {isResetMode ? 'Back to sign in' : 'Forgot password?'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ManagementLogin;