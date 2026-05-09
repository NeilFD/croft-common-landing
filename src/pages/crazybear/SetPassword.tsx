import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import CBTopNav from '@/components/crazybear/CBTopNav';

const SetPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();

  // Tick down the resend cooldown each second
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
      options: { emailRedirectTo: 'https://www.crazybear.dev/set-password' },
    });
    setResending(false);
    if (error) {
      const msg = error.message || '';
      // Surface rate-limit clearly
      const wait = /(\d+)\s*seconds?/i.exec(msg)?.[1];
      if (wait) setResendCooldown(parseInt(wait, 10));
      toast({
        title: 'Could not resend',
        description: msg || 'Try again in a moment.',
        variant: 'destructive',
      });
      return;
    }
    setResendCooldown(45);
    toast({
      title: 'Code sent',
      description: 'Check your inbox. It can take a minute.',
    });
  };

  // Pre-fill email from URL, and detect if we already have a valid session
  // (e.g. user clicked a working magic link).
  useEffect(() => {
    let mounted = true;
    try {
      const params = new URLSearchParams(window.location.search);
      const e = params.get('email');
      if (e) setEmail(e);
    } catch {}

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (mounted && sess) setHasSession(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session) setHasSession(true);
      setVerifying(false);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const finalise = async () => {
    // Fire branded welcome email (idempotent server-side).
    try {
      await supabase.functions.invoke('cb-send-welcome');
    } catch (err) {
      console.warn('cb-send-welcome invoke failed', err);
    }
    try { sessionStorage.removeItem('recovery'); } catch {}
    try {
      const url = new URL(window.location.href);
      ['access_token','refresh_token','code','token_hash','token','type','error','error_description','email']
        .forEach((p) => url.searchParams.delete(p));
      url.hash = '';
      window.history.replaceState({}, document.title, url.pathname);
    } catch {}
    toast({ title: 'Password set', description: 'You are signed in.' });
    window.location.assign('https://www.crazybeartest.com/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast({ title: 'Too short', description: 'Use at least 8 characters.', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);

    // Always verify the OTP code from the email — even if a stale session exists.
    const cleanCode = code.replace(/\s/g, '');
    if (!email || !cleanCode || (cleanCode.length !== 6 && cleanCode.length !== 8)) {
      setLoading(false);
      toast({
        title: 'Enter your code',
        description: 'Add the email and the code from your inbox.',
        variant: 'destructive',
      });
      return;
    }
    const { error: otpError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cleanCode,
      type: 'email',
    });
    if (otpError) {
      setLoading(false);
      toast({
        title: 'Code did not work',
        description: otpError.message || 'Check the code and try again.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const msg = (error.message || '').toLowerCase();
      // If the new password matches the old, the account is already set up.
      // Treat as success and send them home.
      if (msg.includes('different from the old')) {
        await finalise();
        return;
      }
      toast({ title: 'Could not set password', description: error.message, variant: 'destructive' });
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
              Set your password
            </h1>
            <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-8">
              One key. The den remembers.
            </p>

            {verifying ? (
              <p className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-60">
                Loading...
              </p>
            ) : (
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
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="one-time-code"
                  className="font-cb-mono tracking-[0.5em] text-center bg-transparent border-white/30 text-white placeholder:text-white/40 placeholder:tracking-normal placeholder:font-cb-sans focus-visible:ring-0 focus-visible:border-white rounded-none h-12 text-lg"
                />
                <Input
                  type="password"
                  placeholder="New password"
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
                  {loading ? 'Saving...' : 'Save and enter'}
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
                      ? `Resend code (${resendCooldown}s)`
                      : 'Resend code'}
                </button>
                <p className="font-cb-mono text-[10px] tracking-[0.3em] uppercase opacity-60 pt-1 text-center leading-relaxed">
                  Code can take a minute. Check spam.
                  <br />
                  Still nothing? Tap resend above.
                </p>
              </form>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default SetPassword;
