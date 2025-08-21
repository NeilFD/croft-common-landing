import { useState, useEffect, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { OTPInput } from '@/components/ui/otp-input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requireAllowedDomain?: boolean;
  title?: string;
  description?: string;
  prefilledEmail?: string;
}

const validateEmailDomain = async (email: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('is_email_domain_allowed', {
    email: email
  });
  
  if (error) {
    console.error('Error validating email domain:', error);
    return false;
  }
  
  return data;
};

export const AuthModal = ({ isOpen, onClose, onSuccess, requireAllowedDomain = true, title, description, prefilledEmail }: AuthModalProps) => {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { user } = useAuth();

  // Set prefilled email when modal opens
  useEffect(() => {
    if (prefilledEmail && isOpen) {
      setEmail(prefilledEmail);
    }
  }, [prefilledEmail, isOpen]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const sendEmailOTP = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    if (requireAllowedDomain) {
      try {
        const isValidDomain = await validateEmailDomain(email);
        if (!isValidDomain) {
          toast({
            title: "Access denied",
            description: "This email address is not authorized.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('Email validation error:', error);
        toast({
          title: "Validation error",
          description: "Unable to validate email domain. Please try again.",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Allow user creation for OTP flow
          data: {}, // Empty metadata to prevent welcome emails
        }
      });

      if (error) {
        toast({
          title: "Failed to send code",
          description: error.message,
          variant: "destructive"
        });
      } else {
        setStep('otp');
        setResendCountdown(30);
        toast({
          title: "Code sent!",
          description: "Check your email for the 6-digit code.",
        });
      }
    } catch (error) {
      console.error('Exception during OTP send:', error);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
      });

      if (error) {
        toast({
          title: "Invalid code",
          description: "The code is incorrect or has expired. Please try again.",
          variant: "destructive"
        });
        setOtp('');
      } else {
        toast({
          title: "Success!",
          description: "You're now signed in.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('Exception during OTP verification:', error);
      toast({
        title: "Verification failed",
        description: "An error occurred while verifying the code.",
        variant: "destructive"
      });
    }

    setLoading(false);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendEmailOTP();
  };

  const handleOTPSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyOTP();
  };

  const resendOTP = () => {
    sendEmailOTP();
  };

  const handleClose = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setResendCountdown(0);
    onClose();
  };

  const goBackToEmail = () => {
    setStep('email');
    setOtp('');
  };

  // If user is already authenticated, don't show the modal
  if (user && isOpen) {
    onSuccess();
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title ?? 'Sign in'}</DialogTitle>
          <DialogDescription>
            {step === 'email' 
              ? (description ?? "Enter your email address and we'll send you a 6-digit code.")
              : `Enter the 6-digit code sent to ${email}`
            }
          </DialogDescription>
        </DialogHeader>
        
        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
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
                {loading ? 'Sending...' : 'Send code'}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOTPSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Verification code</Label>
              <div className="flex justify-center">
                <OTPInput
                  value={otp}
                  onChange={setOtp}
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={goBackToEmail} disabled={loading}>
                Back
              </Button>
              <Button type="submit" disabled={loading || otp.length !== 6} className="flex-1">
                {loading ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
            <div className="text-center">
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                onClick={resendOTP} 
                disabled={resendCountdown > 0 || loading}
                className="text-xs"
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};