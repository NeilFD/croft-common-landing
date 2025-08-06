import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ALLOWED_DOMAINS = ['cityandsanctuary.com', 'croftcommon.com'];

const validateEmailDomain = (email: string): boolean => {
  const domain = email.split('@')[1];
  return ALLOWED_DOMAINS.includes(domain);
};

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, refreshSession } = useAuth();

  // Detect when user becomes authenticated and automatically proceed
  useEffect(() => {
    if (user && isOpen && emailSent) {
      // User has successfully authenticated after magic link
      onSuccess();
    }
  }, [user, isOpen, emailSent, onSuccess]);

  // Add window focus detection and polling for cross-window authentication
  useEffect(() => {
    if (!emailSent || !isOpen) return;

    const handleWindowFocus = async () => {
      await refreshSession();
    };

    // Add window focus listener
    window.addEventListener('focus', handleWindowFocus);

    // Poll for authentication every 2 seconds while email is sent
    const pollInterval = setInterval(async () => {
      await refreshSession();
    }, 2000);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(pollInterval);
    };
  }, [emailSent, isOpen, refreshSession]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address.",
        variant: "destructive"
      });
      return;
    }

    if (!validateEmailDomain(email)) {
      toast({
        title: "Domain not allowed",
        description: "Only @cityandsanctuary.com and @croftcommon.com email addresses are allowed.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    const redirectUrl = `${window.location.origin}/calendar`;
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    if (error) {
      toast({
        title: "Authentication failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setEmailSent(true);
      toast({
        title: "Magic link sent!",
        description: "Check your email and click the link to sign in.",
      });
    }

    setLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onClose();
  };

  const handleGotIt = async () => {
    // Refresh session to get latest auth state before checking
    const session = await refreshSession();
    
    if (session?.user) {
      onSuccess();
    } else {
      handleClose();
    }
  };

  // If user is already authenticated, don't show the modal
  if (user && isOpen) {
    onSuccess();
    return null;
  }

  if (emailSent) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Check your email</DialogTitle>
            <DialogDescription>
              We've sent a magic link to {email}. Click the link in your email to sign in and create your event.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={handleGotIt} className="mt-4">
            Got it
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to create events</DialogTitle>
          <DialogDescription>
            Enter your email address and we'll send you a magic link to sign in.
            Only @cityandsanctuary.com and @croftcommon.com emails are allowed.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.name@cityandsanctuary.com"
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
              {loading ? 'Sending...' : 'Send magic link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};