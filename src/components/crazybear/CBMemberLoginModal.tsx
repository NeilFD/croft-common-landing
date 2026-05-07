import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Mode = 'signin' | 'forgot';

const CBMemberLoginModal = ({ open, onClose, onSuccess }: Props) => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setEmail('');
    setPassword('');
    setMode('signin');
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({
        title: 'The bear does not recognise you',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }
    toast({ title: 'Welcome back', description: 'You are in the den.' });
    reset();
    onSuccess?.();
    onClose();
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Could not send', description: error.message, variant: 'destructive' });
      return;
    }
    toast({
      title: 'Check your email',
      description: 'A reset link is on its way.',
    });
    setMode('signin');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="bg-black border border-white/20 text-white max-w-md p-0 rounded-none">
        <div className="p-8">
          <h2 className="font-display uppercase text-3xl tracking-tight mb-1">
            {mode === 'signin' ? 'Members' : 'Forgot'}
          </h2>
          <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-7">
            {mode === 'signin' ? 'Sign in to the den' : 'Reset your password'}
          </p>

          {mode === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-none bg-white text-black hover:bg-white/90 font-cb-mono text-xs tracking-[0.4em] uppercase"
              >
                {loading ? 'Signing in...' : 'Enter the den'}
              </Button>
              <button
                type="button"
                onClick={() => setMode('forgot')}
                className="w-full font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100 pt-2"
              >
                Forgot password
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgot} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-none bg-white text-black hover:bg-white/90 font-cb-mono text-xs tracking-[0.4em] uppercase"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-60 hover:opacity-100 pt-2"
              >
                Back to sign in
              </button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CBMemberLoginModal;
