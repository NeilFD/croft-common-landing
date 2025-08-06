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

export const AuthModal = ({ isOpen, onClose, onSuccess }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, refreshSession } = useAuth();

  // Add window focus detection for cross-window authentication
  useEffect(() => {
    if (!emailSent || !isOpen) return;

    const handleWindowFocus = async () => {
      console.log('🔍 Window focused, checking auth state...');
      console.log('🔍 Current URL on focus:', window.location.href);
      
      try {
        const session = await refreshSession();
        console.log('🔍 Session after focus check:', {
          user: session?.user?.email,
          hasSession: !!session,
          timestamp: new Date().toISOString()
        });
        
        if (session?.user) {
          console.log('✅ User authenticated on focus, calling onSuccess');
          onSuccess();
        } else {
          console.log('❌ No user found on window focus');
        }
      } catch (error) {
        console.error('🚨 Error checking auth on window focus:', error);
      }
    };

    // Add window focus listener
    window.addEventListener('focus', handleWindowFocus);
    console.log('👀 Added window focus listener for auth detection');

    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      console.log('🧹 Removed window focus listener');
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

    console.log('🔐 Starting auth flow for:', email);
    console.log('🔐 Current URL:', window.location.href);

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

    setLoading(true);

    const redirectUrl = `${window.location.origin}/`;
    console.log('🔐 Sending magic link with redirect URL:', redirectUrl);
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        console.error('🚨 Magic link error:', {
          message: error.message,
          status: error.status,
          name: error.name,
          details: error
        });
        
        toast({
          title: "Authentication failed",
          description: `${error.message} (Check console for details)`,
          variant: "destructive"
        });
      } else {
        console.log('✅ Magic link sent successfully to:', email);
        setEmailSent(true);
        toast({
          title: "Magic link sent!",
          description: "Check your email and click the link to sign in.",
        });
      }
    } catch (error) {
      console.error('🚨 Exception during magic link send:', error);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred. Please check the console.",
        variant: "destructive"
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
            <DialogTitle className="text-black font-bold">IMPORTANT PLEASE READ INSTRUCTIONS</DialogTitle>
            <DialogDescription className="space-y-4 text-left">
              <p>We've sent you a magic link to {email}.</p>
              <p>Click it and you will be taken to a new browser window.</p>
              <p>In this new window, complete the secret gesture again and the event creation form will open for you.</p>
              <p>Complete the form and save.</p>
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
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              {loading ? 'Sending...' : 'Send magic link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};