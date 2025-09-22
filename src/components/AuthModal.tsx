import { useState, useEffect, type ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
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
  onCodeSent?: () => void;
  emailSentTitle?: string;
  emailSentDescription?: ReactNode;
  toastTitle?: string;
  toastDescription?: string;
  emailSentInstructions?: string;
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

export const AuthModal = ({ isOpen, onClose, onSuccess, requireAllowedDomain = true, title, description, onCodeSent, emailSentTitle, emailSentDescription, toastTitle, toastDescription, emailSentInstructions }: AuthModalProps) => {
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

    console.log('🔐 Starting OTP flow for:', email);

    if (requireAllowedDomain) {
      try {
        const isValidDomain = await validateEmailDomain(email);
        if (!isValidDomain) {
          console.log('🚨 Email domain not authorized:', email);
          toast({
            title: "Access denied",
            description: "This email address is not authorized.",
            variant: "destructive"
          });
          return;
        }
      } catch (error) {
        console.error('🚨 Email validation error:', error);
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
      // Add timeout wrapper for mobile networks
      const otpPromise = supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: undefined
        }
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout - please check your connection')), 10000);
      });

      const { error } = await Promise.race([otpPromise, timeoutPromise]) as { error: any };

      if (error) {
        console.error('🚨 OTP send error:', error);
        
        // Check if it's a timeout or network error
        const isTimeout = error.message.includes('timeout');
        const isNetwork = error.message.includes('Failed to fetch') || error.message.includes('Network');
        
        if (isTimeout || isNetwork) {
          // Auto-retry once for network issues
          console.log('🔄 Retrying OTP send due to network issue...');
          
          setTimeout(async () => {
            try {
              const { error: retryError } = await supabase.auth.signInWithOtp({
                email,
                options: {
                  shouldCreateUser: true,
                  emailRedirectTo: undefined
                }
              });
              
              if (!retryError) {
                console.log('✅ OTP sent successfully on retry to:', email);
                if (onCodeSent) {
                  try { onCodeSent(); } catch {}
                } else {
                  setOtpSent(true);
                }
                toast({
                  title: toastTitle || "Code sent!",
                  description: toastDescription || "Check your email for the 6-digit verification code.",
                });
              } else {
                toast({
                  title: "Connection issue",
                  description: "Please check your internet connection and try again.",
                  variant: "destructive"
                });
              }
            } catch (retryErr) {
              toast({
                title: "Connection issue", 
                description: "Please check your internet connection and try again.",
                variant: "destructive"
              });
            }
            setLoading(false);
          }, 2000);
          return; // Don't set loading to false yet
        }
        
        toast({
          title: "Authentication failed",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('✅ OTP sent successfully to:', email);
        if (onCodeSent) {
          try { onCodeSent(); } catch {}
        } else {
          setOtpSent(true);
        }
        toast({
          title: toastTitle || "Code sent!",
          description: toastDescription || "Check your email for the 6-digit verification code.",
        });
      }
    } catch (error) {
      console.error('🚨 Exception during OTP send:', error);
      const isTimeout = error.message.includes('timeout');
      
      toast({
        title: isTimeout ? "Request timeout" : "Unexpected error",
        description: isTimeout 
          ? "The request took too long. Please check your connection and try again."
          : "An unexpected error occurred. Please try again.",
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
        console.error('🚨 OTP verification error:', error);
        const isNetwork = (error as any)?.status === 0 || (error as any)?.message?.includes('Failed to fetch');
        toast({
          title: isNetwork ? "Network error" : "Invalid code",
          description: isNetwork
            ? "Could not reach Supabase. Check Authentication > URL Configuration for Site/Redirect URLs to include this domain."
            : (error as any).message,
          variant: "destructive"
        });
      } else {
        await refreshSession();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('✅ OTP accepted but no session established yet.');
          toast({
            title: "Verification issue",
            description: "Code accepted but session not established. Please try again.",
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
        toast({
          title: "Signed in successfully!",
          description: "Welcome back.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error('🚨 Exception during OTP verify:', error);
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
    console.debug('[AuthModal] User already authenticated, calling onSuccess');
    onSuccess();
    return null;
  }

  if (otpSent) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open && !loading) handleClose(); }}>
        <DialogContent className="sm:max-w-[425px] z-[10002]">
          <DialogHeader>
            <DialogTitle className="text-black font-bold">
              {emailSentTitle ?? (requireAllowedDomain ? 'IMPORTANT PLEASE READ INSTRUCTIONS' : 'Enter verification code')}
            </DialogTitle>
            <DialogDescription>
              {`We've sent a 6-digit code to ${email}.`}
            </DialogDescription>
            {emailSentDescription ? (
              <div className="space-y-2 text-sm text-muted-foreground text-left">{emailSentDescription}</div>
            ) : (
              <div className="space-y-2 text-sm text-muted-foreground text-left">
                {requireAllowedDomain ? (
                  <>
                    <p>Enter the code below to continue.</p>
                    <p>Once verified, complete the secret gesture again and the event creation form will open for you.</p>
                    <p>Complete the form and save.</p>
                  </>
                ) : (
                  <p>{emailSentInstructions || "Enter the code below to continue."}</p>
                )}
              </div>
            )}
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
      <DialogContent className="sm:max-w-[425px] z-[10002]">
        <DialogHeader>
          <DialogTitle>{title ?? 'Sign in'}</DialogTitle>
          <DialogDescription>
            {description ?? "Enter your email address and we'll send you a 6-digit verification code to sign in."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSendOtp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="your.name@company.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} required />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading} className="flex-1">{loading ? 'Sending…' : 'Send code'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};