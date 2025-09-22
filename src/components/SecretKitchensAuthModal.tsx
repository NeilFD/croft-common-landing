import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
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
  title = "Sign In to Secret Kitchens",
  description = "Sign in to access Secret Kitchens"
}: SecretKitchensAuthModalProps) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
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

      // Check if user already has a valid session with the same email
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === email) {
        // User has valid session for this email, sign them in directly
        toast({
          title: "Welcome back!",
          description: "You're now signed in to Secret Kitchens.",
        });
        onSuccess();
        setLoading(false);
        return;
      }

      // If no valid session, proceed with OTP
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          // Set session to last 49 hours (176400 seconds)
          data: {
            sessionDuration: 176400
          }
        }
      });

      if (error) {
        console.error('Secret Kitchens OTP send error:', error);
        toast({
          title: "Authentication failed",
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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('[SecretKitchens] OTP accepted but no session established');
          toast({
            title: "Verification issue",
            description: "Code accepted but session not established. Please try again.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        toast({
          title: "Welcome back!",
          description: "You're now signed in to Secret Kitchens.",
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
    onClose();
  };

  const handleBackToEmail = () => {
    setOtpCode('');
    setOtpSent(false);
  };

  // If user is already authenticated and not in verification state, close modal
  if (user && isOpen && !otpSent) {
    console.debug('[SecretKitchensAuthModal] User already authenticated, calling onSuccess');
    onSuccess();
    return null;
  }

  if (otpSent) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) handleClose(); }}>
        <DialogContent 
          className="sm:max-w-[425px] z-[10002]"
          onEscapeKeyDown={(e) => { e.preventDefault(); }}
          onInteractOutside={(e) => { e.preventDefault(); }}
        >
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
              <Button type="button" variant="outline" onClick={handleBackToEmail} disabled={loading} className="text-[hsl(var(--accent-pink))] border-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))] hover:text-white">
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) handleClose(); }}>
      <DialogContent 
        className="sm:max-w-[425px] z-[10002]"
        onEscapeKeyDown={(e) => { e.preventDefault(); }}
        onInteractOutside={(e) => { e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-foreground/70 bg-muted p-3 rounded mb-4">
          <strong>Authorised access only.</strong> First-time sign-ins require a 6-digit verification code. After that, just enter your email to access Croft Common Secret Kitchens.
        </div>
        
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading} className="text-[hsl(var(--accent-pink))] border-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))] hover:text-white">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};