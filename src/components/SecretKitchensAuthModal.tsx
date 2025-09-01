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
  description = "Enter your email address to access exclusive recipes"
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

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false
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
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-foreground/70 bg-muted p-3 rounded mb-4">
          <strong>Authorized access only.</strong> Enter your registered email address. We'll send you a 6-digit code to verify it's you.
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Sending code...' : 'Send Code'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};