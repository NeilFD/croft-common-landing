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

  // Add window focus detection for cross-window authentication
  useEffect(() => {
    if (!emailSent || !isOpen) return;

    const handleWindowFocus = async () => {
      console.log('Window focused, checking auth...');
      const session = await refreshSession();
      console.log('Session after focus:', session?.user?.email);
      
      if (session?.user) {
        console.log('User authenticated on focus, calling onSuccess');
        onSuccess();
      }
    };

    // Add window focus listener
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [emailSent, isOpen, refreshSession, onSuccess]);

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
    console.log('Got it clicked, checking authentication...');
    
    // Try direct Supabase check first
    const { data: { user: directUser } } = await supabase.auth.getUser();
    console.log('Direct user check:', directUser?.email);
    
    if (directUser) {
      console.log('User found via direct check, calling onSuccess');
      onSuccess();
      return;
    }
    
    // Fallback to refreshSession
    console.log('No user found directly, trying refreshSession...');
    const session = await refreshSession();
    console.log('Session after refresh:', session?.user?.email);
    
    if (session?.user) {
      console.log('User found via refresh, calling onSuccess');
      onSuccess();
    } else {
      console.log('No user found, closing modal');
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