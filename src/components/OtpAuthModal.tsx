import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface OtpAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const OtpAuthModal = ({ isOpen, onClose, onSuccess, title, description }: OtpAuthModalProps) => {
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
      // Use minimal parameters - just email and explicit undefined redirect to force OTP mode
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: undefined // This forces OTP mode instead of magic link
        }
      });

      if (error) {
        console.error('OTP send error:', error);
        // Handle "User not found" error specifically
        if (error.message.includes('User not found') || error.message.includes('signup')) {
          toast({
            title: "Account not found",
            description: "Please sign up first or check your email address.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Failed to send code",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        setOtpSent(true);
        toast({
          title: "Code sent!",
          description: "Check your email for the 6-digit code.",
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
        // Refresh the session to get the latest user state
        await refreshSession();
        toast({
          title: "Signed in successfully!",
          description: "Welcome to your loyalty card.",
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
    onClose();
  };

  const handleBackToEmail = () => {
    setOtpCode('');
    setOtpSent(false);
  };

  // If user is already authenticated and not in verification state, close modal
  if (user && isOpen && !otpSent) {
    console.debug('[OtpAuthModal] User already authenticated, calling onSuccess');
    onSuccess();
    return null;
  }

  if (otpSent) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) handleClose(); }}>
        <DialogContent className="sm:max-w-[425px] z-[10002]" overlayClassName="bg-black/10">
          <DialogHeader>
            <DialogTitle>Enter verification code</DialogTitle>
            <DialogDescription>
              We've sent a 6-digit code to {email}. Enter it below to access your loyalty card.
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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) handleClose(); }}>
      <DialogContent className="sm:max-w-[425px] z-[10002]" overlayClassName="bg-black/10">
        <DialogHeader>
          <DialogTitle>{title ?? 'Sign in to your loyalty card'}</DialogTitle>
          <DialogDescription>
            {description ?? "Enter your email address and we'll send you a 6-digit code to access your loyalty card."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.name@company.com"
              className="cursor-text"
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
      </DialogContent>
    </Dialog>
  );
};