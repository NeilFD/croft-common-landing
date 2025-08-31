import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SecretKitchensAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const SecretKitchensAuthModal = ({ isOpen, onClose, onSuccess }: SecretKitchensAuthModalProps) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'signup' | 'signin'>('signup');
  const { user, refreshSession } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setOtpCode('');
      setOtpSent(false);
      setActiveTab('signup');
    }
  }, [isOpen]);

  const validateSecretKitchenAccess = async (email: string) => {
    const { data, error } = await supabase.rpc('validate_secret_kitchen_user', {
      user_email: email
    });
    
    if (error) {
      console.error('Error validating secret kitchen access:', error);
      return { hasAccess: false, userType: 'none', isVerified: false };
    }
    
    return {
      hasAccess: data?.[0]?.has_access || false,
      userType: data?.[0]?.user_type || 'none',
      isVerified: data?.[0]?.is_verified || false
    };
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // First, validate if this email has Secret Kitchens access
      const { hasAccess, userType, isVerified } = await validateSecretKitchenAccess(email);
      
      if (!hasAccess) {
        toast({
          title: "Access denied",
          description: "This email address is not authorized for Secret Kitchens access.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // For sign up - check if already verified
      if (activeTab === 'signup' && isVerified) {
        toast({
          title: "Account exists",
          description: "You already have an account. Please use the Sign In tab instead.",
          variant: "destructive"
        });
        setActiveTab('signin');
        setLoading(false);
        return;
      }

      // For sign in - check if not verified yet
      if (activeTab === 'signin' && !isVerified) {
        toast({
          title: "Account not found",
          description: "Please sign up first using the Sign Up tab.",
          variant: "destructive"
        });
        setActiveTab('signup');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: activeTab === 'signup',
          data: activeTab === 'signup' ? {
            user_type: 'secret_kitchens'
          } : undefined
        }
      });

      if (error) {
        console.error('OTP send error:', error);
        toast({
          title: "Failed to send code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setOtpSent(true);
        toast({
          title: "Code sent!",
          description: "Check your email for the 6-digit verification code.",
        });
      }
    } catch (error) {
      console.error('Exception during OTP send:', error);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpCode || otpCode.length !== 6) {
      toast({
        title: "Code required",
        description: "Please enter the 6-digit code from your email.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'email'
      });

      if (error) {
        console.error('OTP verification error:', error);
        toast({
          title: "Invalid code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        await refreshSession();
        toast({
          title: activeTab === 'signup' ? "Account created!" : "Signed in successfully!",
          description: activeTab === 'signup' ? "Welcome to Secret Kitchens." : "Welcome back to Secret Kitchens.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Exception during OTP verify:', error);
      toast({
        title: "Verification failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setOtpCode('');
    setOtpSent(false);
    setActiveTab('signup');
    onClose();
  };

  const handleBackToEmail = () => {
    setOtpCode('');
    setOtpSent(false);
  };

  // If user is already authenticated, don't show the modal
  if (user && isOpen) {
    onSuccess();
    return null;
  }

  if (otpSent) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter verification code</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We've sent a 6-digit code to {email}. Enter it below to {activeTab === 'signup' ? 'create your account' : 'sign in'}.
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Verification code</Label>
                <InputOTP
                  value={otpCode}
                  onChange={setOtpCode}
                  maxLength={6}
                  disabled={loading}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleBackToEmail} disabled={loading}>
                  Back
                </Button>
                <Button type="submit" disabled={loading || otpCode.length !== 6} className="flex-1">
                  {loading ? 'Verifying...' : 'Verify'}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Access Secret Kitchens</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signup' | 'signin')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">New to Secret Kitchens?</CardTitle>
                <CardDescription>
                  Create your account to access our exclusive recipes. You must be on our authorized list to sign up.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Checking...' : 'Create Account'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="signin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Welcome Back</CardTitle>
                <CardDescription>
                  Sign in to your existing Secret Kitchens account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@domain.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? 'Sending...' : 'Send Code'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <p className="font-medium">First time here?</p>
          <p>Use the Sign Up tab to create your account, then come back to Sign In for future visits.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};