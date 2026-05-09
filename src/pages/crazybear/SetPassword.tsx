import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import CBTopNav from '@/components/crazybear/CBTopNav';

type Stage = 'verifying' | 'set-password' | 'expired' | 'manual-code';

const REDIRECT = 'https://www.crazybear.dev/set-password';

const SetPassword = () => {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<Stage>('verifying');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Strip auth params from the URL once handled.
  const cleanUrl = () => {
    try {
      const url = new URL(window.location.href);
      ['access_token','refresh_token','code','token_hash','token','type','error','error_description','expires_in','expires_at','provider_token','refresh','message']
        .forEach((p) => url.searchParams.delete(p));
      url.hash = '';
      window.history.replaceState({}, document.title, url.pathname + url.search);
    } catch {}
  };

  // On mount: try to consume any auth payload in the URL or use an existing session.
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Pre-fill email from URL.
      let emailFromUrl = '';
      try {
        const params = new URLSearchParams(window.location.search);
        emailFromUrl = params.get('email') || '';
        if (emailFromUrl) setEmail(emailFromUrl);
      } catch {}

      const search = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));

      const errorParam = search.get('error') || hash.get('error');
      const errorCode = search.get('error_code') || hash.get('error_code');
      const errorDesc = search.get('error_description') || hash.get('error_description');

      if (errorParam || errorCode) {
        const expired = /expired|invalid|otp/i.test(`${errorCode} ${errorDesc} ${errorParam}`);
        cleanUrl();
        if (!cancelled) setStage(expired ? 'expired' : 'manual-code');
        return;
      }

      const codeParam = search.get('code');
      const tokenHash = search.get('token_hash') || hash.get('token_hash');
      const accessToken = hash.get('access_token');
      const refreshToken = hash.get('refresh_token');
      const type = (search.get('type') || hash.get('type') || '') as
        | 'signup' | 'recovery' | 'magiclink' | 'invite' | 'email_change' | '';

      try {
        // 1. PKCE / OAuth-style ?code= flow
        if (codeParam) {
          const { error } = await supabase.auth.exchangeCodeForSession(codeParam);
          if (error) throw error;
          cleanUrl();
          if (!cancelled) setStage('set-password');
          return;
        }

        // 2. token_hash flow (Supabase email links)
        if (tokenHash) {
          const verifyType: any = type || 'signup';
          const { error } = await supabase.auth.verifyOtp({
            type: verifyType,
            token_hash: tokenHash,
          });
          if (error) throw error;
          cleanUrl();
          if (!cancelled) setStage('set-password');
          return;
        }

        // 3. Implicit flow #access_token / #refresh_token
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          cleanUrl();
          if (!cancelled) setStage('set-password');
          return;
        }

        // 4. Already signed in? Verify the session is still valid (user not deleted).
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          const { data: userData, error: userError } = await supabase.auth.getUser();
          if (userError || !userData?.user) {
            // Stale session — purge it.
            await supabase.auth.signOut().catch(() => {});
            try { localStorage.removeItem('membershipLinked'); } catch {}
            if (!cancelled) setStage('manual-code');
            return;
          }
          if (!cancelled) setStage('set-password');
          return;
        }

        // 5. Nothing to consume — show manual code entry.
        if (!cancelled) setStage('manual-code');
      } catch (err: any) {
        const msg = (err?.message || '').toLowerCase();
        const expired = /expired|invalid|already used/.test(msg);
        cleanUrl();
        if (!cancelled) setStage(expired ? 'expired' : 'manual-code');
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

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
    toast({ title: 'Fresh link sent', description: 'Check your inbox. Tap the button.' });
    setStage('manual-code');
  };

  const finalise = async () => {
    try { await supabase.functions.invoke('cb-send-welcome'); } catch {}
    try { sessionStorage.removeItem('recovery'); } catch {}
    cleanUrl();
    toast({ title: 'You are in', description: 'Welcome to the den.' });
    window.location.assign('https://www.crazybear.dev/');
  };

  const handleVerifyManualCode = async () => {
    const cleanCode = code.replace(/\s/g, '');
    if (!email || !cleanCode || (cleanCode.length !== 6 && cleanCode.length !== 8)) {
      toast({
        title: 'Enter your code',
        description: 'Add the email and the code from your inbox.',
        variant: 'destructive',
      });
      return false;
    }
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: cleanCode,
      type: 'email',
    });
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (/expired/.test(msg)) {
        setStage('expired');
        toast({ title: 'Code expired', description: 'Send a fresh link below.', variant: 'destructive' });
      } else {
        toast({ title: 'Code did not work', description: error.message, variant: 'destructive' });
      }
      return false;
    }
    return true;
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

    if (stage === 'manual-code') {
      const ok = await handleVerifyManualCode();
      if (!ok) { setLoading(false); return; }
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      const msg = (error.message || '').toLowerCase();
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
              {stage === 'expired' ? 'Link expired' : 'Set your password'}
            </h1>
            <p className="font-cb-mono text-[10px] tracking-[0.45em] uppercase opacity-60 mb-8">
              {stage === 'expired' ? 'Send a fresh one' : 'One key. The den remembers.'}
            </p>

            {stage === 'verifying' && (
              <p className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-60">
                Opening the door...
              </p>
            )}

            {stage === 'expired' && (
              <div className="space-y-4">
                <p className="font-cb-sans text-base opacity-80">
                  That link is no longer valid. Tap below and we'll send a fresh one.
                </p>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="font-cb-sans bg-transparent border-white/30 text-white placeholder:text-white/50 focus-visible:ring-0 focus-visible:border-white rounded-none h-12"
                />
                <Button
                  type="button"
                  onClick={handleResend}
                  disabled={resending || resendCooldown > 0}
                  className="w-full h-12 rounded-none bg-white text-black hover:bg-white/90 font-cb-mono text-xs tracking-[0.4em] uppercase"
                >
                  {resending ? 'Sending...' : resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Send a fresh link'}
                </Button>
              </div>
            )}

            {(stage === 'set-password' || stage === 'manual-code') && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {stage === 'manual-code' && (
                  <>
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
                    <p className="font-cb-mono text-[10px] tracking-[0.3em] uppercase opacity-60 text-center leading-relaxed -mt-1">
                      Easier: tap the button in the email instead.
                    </p>
                  </>
                )}
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
                {stage === 'manual-code' && (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || resendCooldown > 0}
                    className="w-full font-cb-mono text-[10px] tracking-[0.4em] uppercase opacity-70 hover:opacity-100 disabled:opacity-40 pt-2"
                  >
                    {resending
                      ? 'Sending...'
                      : resendCooldown > 0
                        ? `Send a fresh link (${resendCooldown}s)`
                        : 'Send a fresh link'}
                  </button>
                )}
              </form>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default SetPassword;
