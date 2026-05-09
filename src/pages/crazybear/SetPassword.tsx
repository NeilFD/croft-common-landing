import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import CBTopNav from '@/components/crazybear/CBTopNav';

const REDIRECT = 'https://www.crazybear.dev/set-password';

const SetPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();

  // Prefill email + clear any stale session on mount.
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const emailFromUrl = params.get('email') || '';
      if (emailFromUrl) setEmail(emailFromUrl);
    } catch {}

    // Always start with a clean slate so a stale/deleted session can't poison
    // the verifyOtp call.
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: userData, error: userErr } = await supabase.auth.getUser();
          if (userErr || !userData?.user) {
            await supabase.auth.signOut().catch(() => {});
            try { localStorage.removeItem('membershipLinked'); } catch {}
          }
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async () => {
    const target = email.trim();
    if (!target) {
      toast({
        title: 'Add your email',
        description: 'Enter the email address you signed up with.',
        variant: 'destructive',
      });
      return;
    }
    if (resending || resendCooldown > 0) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: target,
      options: { emailRedirectTo: REDIRECT },
    });
    setResending(false);
    if (error) {
      const msg = error.message || '';
      const wait = /(\d+)\s*seconds?/i.exec(msg)?.[1];
      if (wait) setResendCooldown(parseInt(wait, 10));
      toast({ title: 'Could not send', description: msg || 'Try again in a moment.', variant: 'destructive' });
      return;
    }
    setResendCooldown(45);
    toast({ title: 'Fresh code sent', description: 'Check your inbox.' });
  };

  const finalise = async () => {
    try { await supabase.functions.invoke('cb-send-welcome'); } catch {}
    try { sessionStorage.removeItem('recovery'); } catch {}
    toast({ title: 'You are in', description: 'Welcome to the den.' });
    window.location.assign('https://www.crazybear.dev/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.replace(/\D/g, '');
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      toast({ title: 'Add your email', variant: 'destructive' });
      return;
    }
    if (cleanCode.length < 6 || cleanCode.length > 8) {
      toast({ title: 'Check the code', description: 'Enter the code from your email.', variant: 'destructive' });
      return;
    }
    if (password.length < 8) {
      toast({ title: 'Too short', description: 'Use at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanCode,
      type: 'email',
    });

    if (verifyError) {
      setLoading(false);
      const msg = (verifyError.message || '').toLowerCase();
      if (/expired/.test(msg)) {
        toast({ title: 'Code expired', description: 'Tap "Send a fresh code" below.', variant: 'destructive' });
      } else {
        toast({ title: 'Code did not work', description: verifyError.message, variant: 'destructive' });
      }
      return;
    }

    const { error: pwError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (pwError) {
      const msg = (pwError.message || '').toLowerCase();
      if (msg.includes('different from the old')) {
        await finalise();
        return;
      }
      toast({ title: 'Could not set password', description: pwError.message, variant: 'destructive' });
      return;
    }
    await finalise();
  };

  return (
    <>
      <Helmet>
        <title>Set your password | The Crazy Bear</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <main className="bg-black text-white font-cb-sans min-h-screen relative">
        <CBTopNav tone="light" />
        <section className="flex items-center justify-center min-h-screen px-6">
          <div className="w-full max-w-md">
            <h1 className="font-display uppercase text-4xl md:text-5xl tracking-tight mb-2">
              Enter the den
            </h1>
            <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-8">
              Code from email. Set your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
              />
              <Input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                placeholder="Code from email"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                required
                autoComplete="one-time-code"
                className="font-cb-mono tracking-[0.5em] text-center bg-transparent border-white/30 text-white placeholder:text-white/40 placeholder:tracking-normal placeholder:font-cb-sans focus-visible:ring-0 focus-visible:border-white rounded-none h-12 text-lg"
              />
              <Input
                type="password"
                placeholder="New password (8+ characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
              />
              <Input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
              />
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-none bg-white text-black hover:bg-white/90 font-cb-mono text-xs tracking-[0.4em] uppercase"
              >
                {loading ? 'Opening...' : 'Open the door'}
              </Button>
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || resendCooldown > 0}
                className="w-full font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-70 hover:opacity-100 disabled:opacity-40 pt-2"
              >
                {resending
                  ? 'Sending...'
                  : resendCooldown > 0
                    ? `Send a fresh code (${resendCooldown}s)`
                    : 'Send a fresh code'}
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
};

export default SetPassword;
