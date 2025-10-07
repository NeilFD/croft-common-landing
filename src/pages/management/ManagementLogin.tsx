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

// Synchronous detector to block redirects before effects run
const detectRecoveryFromUrl = (): boolean => {
  try {
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const type = params.get('type') || hashParams.get('type');
    return (
      sessionStorage.getItem('recovery') === '1' ||
      type === 'recovery' ||
      params.has('token_hash') ||
      params.has('token') ||
      params.has('code') ||
      hashParams.has('code') ||
      params.has('access_token') ||
      hashParams.has('access_token') ||
      params.has('refresh_token') ||
      hashParams.has('refresh_token')
    );
  } catch {
    return false;
  }
};

const ManagementLogin = () => {
  const { managementUser, loading } = useManagementAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const initialRecovery = detectRecoveryFromUrl();
  const [isPasswordUpdateMode, setIsPasswordUpdateMode] = useState(initialRecovery);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [recoveryInProgress, setRecoveryInProgress] = useState(initialRecovery);
  const [sessionValid, setSessionValid] = useState(false);
  const [sessionCheckComplete, setSessionCheckComplete] = useState(false);


  // Utility: remove auth artefacts (# fragments and sensitive query params)
  const stripAuthArtifacts = () => {
    try {
      const url = new URL(window.location.href);
      const paramsToRemove = ['access_token','refresh_token','code','token_hash','token','type','error','error_description'];
      paramsToRemove.forEach((p) => url.searchParams.delete(p));
      url.hash = '';
      const qs = url.searchParams.toString();
      const path = url.pathname + (qs ? `?${qs}` : '');
      window.history.replaceState({}, document.title, path);
    } catch { /* no-op */ }
  };

  // Utility: clean now and a bit later to override late hash writes by providers
  const cleanUrlNowAndLater = () => {
    stripAuthArtifacts();
    requestAnimationFrame(() => stripAuthArtifacts());
    setTimeout(stripAuthArtifacts, 150);
    setTimeout(stripAuthArtifacts, 500);
  };

  // Validate session before showing password update form
  const validateSession = async () => {
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error || !sessionData?.session) {
        setSessionValid(false);
        setSessionCheckComplete(true);
        return false;
      }
      setSessionValid(true);
      setSessionCheckComplete(true);
      return true;
    } catch (err) {
      console.error('Session validation error:', err);
      setSessionValid(false);
      setSessionCheckComplete(true);
      return false;
    }
  };

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

      const hasTokens = !!(type === 'recovery' || code || tokenHash || token || accessToken || refreshToken);

      // Canonicalise to www when tokens are present in browser (avoid native)
      const host = window.location.hostname;
      const isNative = typeof window !== 'undefined' && (window.Capacitor?.isNativePlatform?.() || false);
      if (hasTokens && host === 'croftcommontest.com' && !isNative) {
        const newUrl = 'https://www.croftcommontest.com'
          + window.location.pathname
          + window.location.search
          + window.location.hash;
        console.info('[ManagementLogin] Canonicalising to www for token handling');
        window.location.replace(newUrl);
        return;
      }

      // Detect recovery flow early
      if (hasTokens) {
        console.log('[ManagementLogin] Entering password-update mode with tokens');
        setRecoveryInProgress(true);
        setIsPasswordUpdateMode(true);
        sessionStorage.setItem('recovery', '1');
      } else if (sessionStorage.getItem('recovery') === '1') {
        console.log('[ManagementLogin] Entering password-update mode WITHOUT tokens (recovery flag present)');
        setRecoveryInProgress(true);
        setIsPasswordUpdateMode(true);
      }

      try {
        let sessionEstablished = false;

        // Handle direct session tokens
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          sessionEstablished = true;
        }

        // Handle PKCE/code exchange
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          sessionEstablished = true;
        }

        // Handle recovery via token_hash or token
        if (type === 'recovery' && (tokenHash || token)) {
          const { error } = await supabase.auth.verifyOtp({
            type: 'recovery',
            token_hash: tokenHash || undefined,
            token: tokenHash ? undefined : (token as string),
            email: tokenHash ? undefined : (email || undefined),
          } as any);
          if (error) throw error;
          sessionEstablished = true;
        }

        // Wait for session to be confirmed before cleaning URL
        if (sessionEstablished) {
          // Give Supabase time to fully establish the session
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Validate session exists
          const valid = await validateSession();
          
          if (valid) {
            // Only clean URL after session is confirmed
            cleanUrlNowAndLater();
          } else {
            toast({
              title: 'Session not established',
              description: 'Please try clicking the reset link again',
              variant: 'destructive',
            });
          }
        }
      } catch (err: any) {
        console.error('Auth token processing error:', err);
        toast({
          title: 'Invalid reset link',
          description: err?.message || 'The password reset link is invalid or expired. Please request a new one.',
          variant: 'destructive',
        });
        setSessionValid(false);
        setSessionCheckComplete(true);
      }
    };

    processAuthTokens();
  }, []);

  // React to Supabase auth events
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryInProgress(true);
        setIsPasswordUpdateMode(true);
        sessionStorage.setItem('recovery', '1');
        // Validate session immediately
        await validateSession();
      } else if (event === 'SIGNED_IN') {
        const h = window.location.hash;
        if (h && (h.includes('type=recovery') || h.includes('access_token'))) {
          setRecoveryInProgress(true);
          setIsPasswordUpdateMode(true);
          sessionStorage.setItem('recovery', '1');
          // Validate session before showing form
          await validateSession();
        }
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fallback session check: if in password-update mode but session check not complete
  useEffect(() => {
    if ((isPasswordUpdateMode || recoveryInProgress) && !sessionCheckComplete) {
      // Small delay to avoid racing with auth events
      const timer = setTimeout(async () => {
        console.log('[ManagementLogin] Fallback session check triggered');
        const valid = await validateSession();
        console.log('[ManagementLogin] Fallback session check result:', valid);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isPasswordUpdateMode, recoveryInProgress, sessionCheckComplete]);


  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation checks before setting loading state
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
      // Validate session one more time before update
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      
      if (sessionErr || !sessionData?.session) {
        toast({
          title: 'Recovery session expired',
          description: 'Your password reset link has expired. Please request a new one.',
          variant: 'destructive',
        });
        setSessionValid(false);
        setIsPasswordUpdateMode(false);
        setRecoveryInProgress(false);
        sessionStorage.removeItem('recovery');
        return;
      }

      // Update password using Supabase SDK
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        throw updateError;
      }

      toast({ 
        title: 'Password updated successfully', 
        description: 'Please sign in with your new password' 
      });

      // Clean recovery state
      await supabase.auth.signOut();
      setIsPasswordUpdateMode(false);
      setRecoveryInProgress(false);
      setNewPassword('');
      setConfirmPassword('');
      setSessionValid(false);
      sessionStorage.removeItem('recovery');
      
      // Clean URL before redirect
      cleanUrlNowAndLater();
      
      // Redirect to login
      setTimeout(() => {
        window.location.assign('https://www.croftcommontest.com/management/login');
      }, 500);
      
    } catch (error: any) {
      console.error('Password update error:', error);
      toast({
        title: "Password update failed",
        description: error?.message || "An unexpected error occurred. Please try requesting a new reset link.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (loading && !(isPasswordUpdateMode || recoveryInProgress)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const blockRedirect = isPasswordUpdateMode || recoveryInProgress || (typeof window !== 'undefined' && sessionStorage.getItem('recovery') === '1');
  if (managementUser?.hasAccess && !blockRedirect) {
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

      // Check if password change is required
      const { data: mustChange } = await supabase.rpc('check_password_change_required');
      
      if (mustChange) {
        toast({
          title: "Password change required",
          description: "You must change your password before continuing"
        });
        navigate('/management/password-change');
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
        redirectTo: "https://www.croftcommontest.com/management/login"
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
    <div className="min-h-screen bg-transparent px-4">
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
                <>
                  {!sessionCheckComplete ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : !sessionValid ? (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <p className="text-destructive mb-2">Your password reset link has expired</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Please request a new password reset link to continue
                        </p>
                      </div>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => {
                          setIsPasswordUpdateMode(false);
                          setRecoveryInProgress(false);
                          setIsResetMode(true);
                          sessionStorage.removeItem('recovery');
                        }}
                      >
                        Request New Reset Link
                      </Button>
                    </div>
                  ) : (
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
                  )}
                </>
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