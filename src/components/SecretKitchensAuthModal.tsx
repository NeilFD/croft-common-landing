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
  title = "Access Secret Kitchens",
  description = "Sign up or sign in to access exclusive recipes"
}: SecretKitchensAuthModalProps) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { user, refreshSession } = useAuth();

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
      // Use the custom Secret Kitchens auth edge function
      const { data, error } = await supabase.functions.invoke('secret-kitchens-auth', {
        body: {
          email,
          action: 'send_otp'
        }
      });

      if (error || !data?.success) {
        console.error('Secret Kitchens OTP send error:', error);
        
        const errorMessage = error?.message || data?.error || 'Failed to send verification code';
        
        toast({
          title: "Authentication failed",
          description: errorMessage,
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
      // Use the custom Secret Kitchens auth edge function for verification
      const { data, error } = await supabase.functions.invoke('secret-kitchens-auth', {
        body: {
          email,
          code: otpCode,
          action: 'verify_otp'
        }
      });

      if (error || !data?.success) {
        console.error('Secret Kitchens OTP verification error:', error);
        const errorMessage = error?.message || data?.error || 'Invalid verification code';
        
        toast({
          title: "Invalid code",
          description: errorMessage,
          variant: "destructive"
        });
      } else {
        // Set the session using the tokens from our custom auth
        if (data.access_token && data.refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: data.access_token,
            refresh_token: data.refresh_token
          });
          
          if (sessionError) {
            console.error('Session setup error:', sessionError);
            toast({
              title: "Authentication error",
              description: "Failed to establish session. Please try again.",
              variant: "destructive"
            });
          } else {
            await refreshSession();
            toast({
              title: "Welcome to Secret Kitchens!",
              description: "You're now signed in and ready to explore.",
            });
            onSuccess();
          }
        } else {
          console.error('No session tokens received from auth function');
          toast({
            title: "Authentication error",
            description: "Failed to establish session. Please try again.",
            variant: "destructive"
          });
        }
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
          <DialogDescription className="space-y-2">
            <p>{description}</p>
            <p className="text-sm text-foreground/70">
              Enter your email address and we'll send you a 6-digit verification code to access Secret Kitchens.
            </p>
          </DialogDescription>
        </DialogHeader>
        
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
              {loading ? 'Sending code...' : 'Send Verification Code'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};