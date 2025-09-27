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

  useEffect(() => {
    cleanUrlNowAndLater();
  }, []);

  useEffect(() => {
    // Initial recovery is derived synchronously to block premature redirects

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

      // Detect recovery flow early
      if (type === 'recovery' || code || tokenHash || token || accessToken || refreshToken) {
        setRecoveryInProgress(true);
        setIsPasswordUpdateMode(true);
        sessionStorage.setItem('recovery', '1');
      }

      // Clean up trailing hash or params
      if (window.location.hash) {
        stripAuthArtifacts();
      }

      try {
        // If only access_token is present (no refresh token), Supabase may have already
        // established a temporary session from the hash. Clean URL once session exists.
        if (accessToken && !refreshToken && !code && !tokenHash && !token) {
          const { data: s } = await supabase.auth.getSession();
          if (s?.session) {
            window.history.replaceState({}, document.title, '/management/login');
            return;
          }
          // Otherwise, continue and rely on the auth listener below to finalise state.
        }
        // Handle direct session tokens
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;

          // Clean up URL
          stripAuthArtifacts();
          return;
        }

        // Handle PKCE/code exchange
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;

          stripAuthArtifacts();
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

          stripAuthArtifacts();
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
      // Always clean recovery hashes on any auth event
      cleanUrlNowAndLater();

      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryInProgress(true);
        setIsPasswordUpdateMode(true);
        sessionStorage.setItem('recovery', '1');
      } else if (event === 'SIGNED_IN') {
        // If sign-in came from a recovery redirect, keep reset UI visible
        const h = window.location.hash;
        if (h && (h.includes('type=recovery') || h.includes('access_token'))) {
          setRecoveryInProgress(true);
          setIsPasswordUpdateMode(true);
          sessionStorage.setItem('recovery', '1');
        }
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);


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

    // UI fail-safe: never leave the button spinning indefinitely
    const loadingFailSafe = setTimeout(() => {
      console.warn('⏱️ Password update taking too long, auto-resetting UI state');
      setIsLoading(false);
    }, 25000);

    try {
      console.log('🔐 Attempting password update...');

      // Ensure we have an active recovery session before attempting update
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) {
        console.error('🚨 Could not read session:', sessionErr);
      }
      if (!sessionData?.session) {
        toast({
          title: 'Recovery session expired',
          description: 'Please click the reset link in your email again to continue.',
          variant: 'destructive',
        });
        return;
      }

      // Best-effort token refresh (non-blocking for UI)
      try {
        await supabase.auth.refreshSession();
      } catch (e) {
        console.warn('⚠️ refreshSession failed (non-blocking):', e);
      }

      // Update password via direct GoTrue REST call with abort timeout
      const GOTRUE_URL = 'https://xccidvoxhpgcnwinnyin.supabase.co/auth/v1/user';
      const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjY2lkdm94aHBnY253aW5ueWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzQwMDgsImV4cCI6MjA3MDA1MDAwOH0.JYTjbecdXJmOkFj5b24nZ15nfon2Sg_mGDrOI6tR7sU';
      const accessToken = sessionData.session.access_token as string;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      let ok = false;
      try {
        const res = await fetch(GOTRUE_URL, {
          method: 'PUT',
          headers: {
            'content-type': 'application/json',
            'apikey': ANON,
            'authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ password: newPassword }),
          signal: controller.signal,
        });
        ok = res.ok;
        if (!ok) {
          const msg = await res.text().catch(() => '');
          throw new Error(msg || `HTTP ${res.status}`);
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          console.warn('⏱️ Password update timed out');
          toast({ title: 'Update timed out', description: 'Please try again, or request a new reset link.', variant: 'destructive' });
        } else {
          console.error('🚨 Password update failed (REST):', err);
          toast({ title: 'Password update failed', description: err?.message || 'Please try again.', variant: 'destructive' });
        }
      } finally {
        clearTimeout(timeout);
      }

      if (ok) {
        console.log('✅ Password updated successfully (REST)');
        toast({ title: 'Password updated successfully', description: 'Please sign in with your new password' });

        // Clean recovery state and enforce a fresh load on the production URL
        try { await supabase.auth.signOut(); } catch (e) { console.warn('⚠️ Sign out after reset failed:', e); }
        setIsPasswordUpdateMode(false);
        setRecoveryInProgress(false);
        setNewPassword('');
        setConfirmPassword('');
        sessionStorage.removeItem('recovery');
        window.location.assign('https://www.croftcommontest.com/management/login');
      }
    } catch (error) {
      console.error('🚨 Password update exception:', error);
      toast({
        title: "Password update failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      clearTimeout(loadingFailSafe);
      setIsLoading(false);
    }
  };

  if (loading && !(isPasswordUpdateMode || recoveryInProgress)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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