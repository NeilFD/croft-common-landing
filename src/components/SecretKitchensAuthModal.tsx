import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SecretKitchensAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const SecretKitchensAuthModal = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  title = "Access Secret Kitchens",
  description = "Sign up or sign in to access exclusive recipes"
}: SecretKitchensAuthModalProps) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signup');
  const [isSignup, setIsSignup] = useState(false);
  const { user, refreshSession } = useAuth();

  const validateSecretKitchensAccess = async (email: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('check_secret_kitchen_access_status', {
      user_email: email
    });
    
    if (error) {
      console.error('Error validating Secret Kitchens access:', error);
      return false;
    }
    
    // Parse the response array from the function
    if (Array.isArray(data) && data.length > 0) {
      return data[0]?.has_access || false;
    }
    
    return false;
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
      // First validate access for Secret Kitchens
      const hasAccess = await validateSecretKitchensAccess(email);
      if (!hasAccess) {
        toast({
          title: "Access denied",
          description: "This email address is not authorized for Secret Kitchens.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const isSignupFlow = activeTab === 'signup';
      setIsSignup(isSignupFlow);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: isSignupFlow,
          data: isSignupFlow ? {
            user_type: 'secret_kitchens'
          } : undefined
        }
      });

      if (error) {
        console.error('Secret Kitchens OTP send error:', error);
        
        // Handle specific errors for sign-in vs sign-up
        if (error.message.includes('User not found') && activeTab === 'signin') {
          toast({
            title: "Account not found",
            description: "This email hasn't signed up yet. Please use the Sign Up tab instead.",
            variant: "destructive"
          });
        } else if (error.message.includes('already registered') && activeTab === 'signup') {
          toast({
            title: "Account exists",
            description: "This email is already registered. Please use the Sign In tab instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Authentication failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        setOtpSent(true);
        toast({
          title: "Code sent!",
          description: "Check your email for the 6-digit verification code.",
        });
      }
    } catch (error) {
      console.error('Exception during Secret Kitchens OTP send:', error);
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
        console.error('Secret Kitchens OTP verification error:', error);
        toast({
          title: "Invalid code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        await refreshSession();
        toast({
          title: isSignup ? "Welcome to Secret Kitchens!" : "Welcome back!",
          description: isSignup ? "Your account has been created successfully." : "You're now signed in.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Exception during Secret Kitchens OTP verify:', error);
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
    setIsSignup(false);
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
            <DialogDescription>
              We've sent a 6-digit code to {email}. Enter it below to access Secret Kitchens.
            </DialogDescription>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription className="space-y-2">
            <p>{description}</p>
            <p className="text-sm font-medium text-foreground/80">
              <strong>First time visitor?</strong> Use "Sign Up" to create your account first.
            </p>
            <p className="text-sm text-foreground/60">
              <strong>Returning visitor?</strong> Use "Sign In" to access your existing account.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'signin' | 'signup')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
            <TabsTrigger value="signin">Sign In</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signup" className="space-y-4 mt-4">
            <div className="text-sm text-foreground/70 bg-muted p-3 rounded">
              <strong>New to Secret Kitchens?</strong> Create your account to access exclusive wood-fired recipes. We'll send you a 6-digit code to verify your email.
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="your.name@company.com"
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
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signin" className="space-y-4 mt-4">
            <div className="text-sm text-foreground/70 bg-muted p-3 rounded">
              <strong>Already have an account?</strong> Sign in with your email address. We'll send you a 6-digit code to verify it's you.
            </div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signin-email">Email address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="your.name@company.com"
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
                  {loading ? 'Sending code...' : 'Send Code'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};