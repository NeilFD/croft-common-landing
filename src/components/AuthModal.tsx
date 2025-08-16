import { useState, useEffect, type ReactNode } from 'react';
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
  requireAllowedDomain?: boolean;
  title?: string;
  description?: string;
  onMagicLinkSent?: () => void;
  emailSentTitle?: string;
  emailSentDescription?: ReactNode;
  redirectUrl?: string;
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

export const AuthModal = ({ isOpen, onClose, onSuccess, requireAllowedDomain = true, title, description, onMagicLinkSent, emailSentTitle, emailSentDescription, redirectUrl }: AuthModalProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { user, refreshSession } = useAuth();

  // Check for auth URL parameter on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const hasAuthParam = urlParams.has('auth');
    
    if (hasAuthParam && isOpen) {
      console.log('🔍 Auth parameter detected in URL, checking session...');
      
      // Give a moment for the auth state to settle after redirect
      setTimeout(async () => {
        try {
          const session = await refreshSession();
          if (session?.user) {
            console.log('✅ User authenticated via URL parameter');
            // Clean up the URL
            urlParams.delete('auth');
            const newUrl = window.location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
            window.history.replaceState({}, '', newUrl);
            onSuccess();
          }
        } catch (error) {
          console.error('🚨 Error checking auth from URL parameter:', error);
        }
      }, 1000);
    }
  }, [isOpen, refreshSession, onSuccess]);

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

    // Use provided redirectUrl or construct default based on current domain
    const magicLinkRedirectUrl = redirectUrl || `${window.location.origin}/admin`;
    
    console.log('🔐 Sending magic link with redirect URL:', magicLinkRedirectUrl);

    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: magicLinkRedirectUrl,
          // Add shouldCreateUser to handle new signups
          shouldCreateUser: true
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
          if (onMagicLinkSent) {
            // Immediately close and let parent handle UI/navigation
            try { onMagicLinkSent(); } catch {}
          } else {
            setEmailSent(true);
          }
          toast({
            title: "Magic link sent!",
            description: "Click the magic link and follow the page to reserve tickets.",
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
          <DialogTitle className="text-black font-bold">
            {emailSentTitle ?? (requireAllowedDomain ? 'IMPORTANT PLEASE READ INSTRUCTIONS' : 'Check your email')}
          </DialogTitle>
          <DialogDescription className="space-y-4 text-left">
            <p>We've sent you a magic link to {email}.</p>
            {emailSentDescription ? (
              <div className="space-y-2">{emailSentDescription}</div>
            ) : (
              <>
                {requireAllowedDomain ? (
                  <>
                    <p>Click it and you will be taken to a new browser window.</p>
                    <p>In this new window, complete the secret gesture again and the event creation form will open for you.</p>
                    <p>Complete the form and save.</p>
                  </>
                ) : (
                  <>
                    <p>Click the magic link and follow the page to reserve tickets.</p>
                  </>
                )}
              </>
            )}
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
          <DialogTitle>{title ?? 'Sign in'}</DialogTitle>
          <DialogDescription>
            {description ?? "Enter your email address and we'll send you a magic link to sign in."}
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