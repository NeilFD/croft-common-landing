import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import CBTopNav from '@/components/crazybear/CBTopNav';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // The link from the auth email lands here with an active recovery/signup
  // session. We just need to wait for the session to settle before letting
  // the user set their password.
  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, sess) => {
      if (mounted && sess) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted && session) setReady(true);
      if (mounted) setTimeout(() => setReady((r) => r || !!session), 600);
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: 'Could not set password', description: error.message, variant: 'destructive' });
      return;
    }
    // Fire branded welcome email (idempotent server-side, safe to await briefly).
    try {
      await supabase.functions.invoke('cb-send-welcome');
    } catch (err) {
      console.warn('cb-send-welcome invoke failed', err);
    }
    // Clear recovery state so RecoveryGuard does not bounce us back here.
    try { sessionStorage.removeItem('recovery'); } catch {}
    // Strip any auth tokens left in the URL hash/query before leaving.
    try {
      const url = new URL(window.location.href);
      ['access_token','refresh_token','code','token_hash','token','type','error','error_description']
        .forEach((p) => url.searchParams.delete(p));
      url.hash = '';
      window.history.replaceState({}, document.title, url.pathname + (url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''));
    } catch {}
    toast({ title: 'Password set', description: 'You are signed in.' });
    // Hard navigate to the Crazy Bear landing so nothing can re-trigger
    // recovery routing on this tab.
    window.location.assign('https://www.crazybeartest.com/');
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
            {!ready ? (
              <p className="font-cb-mono text-xs tracking-[0.3em] uppercase opacity-60">
                Verifying link...
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
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
              </form>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default SetPassword;
