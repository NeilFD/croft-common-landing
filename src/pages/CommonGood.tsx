import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const CommonGood = () => {
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState<{ people: number; croft: number; combined: number } | null>(null);

  useEffect(() => {
    document.title = 'The Common Good | Croft Common';
  }, []);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-common-good-totals', { body: {} });
        if (error) throw error;
        const people = data?.common_people_total_cents ?? 0;
        setTotals({ people, croft: people, combined: people * 2 });
      } catch (e) {
        console.error('Failed to load totals', e);
      }
    };
    fetchTotals();
    const id = setInterval(fetchTotals, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleCheckout = async () => {
    const value = parseFloat(amount);
    const cents = Math.round((isNaN(value) ? 0 : value) * 100);
    if (cents < 100) {
      toast({ title: 'Amount too small', description: 'Minimum is £1.00', duration: 2500 });
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-common-good-payment', {
        body: { amount_cents: cents },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (e: any) {
      toast({ title: 'Checkout failed', description: e.message || 'Please try again', duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <section className="relative pt-40 md:pt-56 pb-24 bg-background">
          <div className="container mx-auto px-6 max-w-4xl">
            <h1 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">The Common Good</h1>
            <p className="font-industrial text-lg text-foreground/80 leading-relaxed mb-12 max-w-3xl">
              For the Common Good. No names. No noise. Add what you can, when you can. We match it. It goes to local groups keeping Stokes Croft on its feet. No heroes. Just the Common, doing good.
            </p>
            <div className="grid gap-4 md:gap-6 md:grid-cols-[2fr_auto] items-end">
              <div>
                <label className="font-industrial text-sm text-muted-foreground">Amount (GBP)</label>
                <div className="flex items-center gap-3 mt-1">
                  <span className="font-industrial text-foreground/70">£</span>
                  <Input
                    type="number"
                    min={1}
                    step={0.5}
                    placeholder="10"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="h-12 text-base"
                  />
                </div>
              </div>
              <Button onClick={handleCheckout} disabled={loading} className="w-full md:w-auto h-12">
                {loading ? 'Preparing checkout…' : 'Add to the Common Good'}
              </Button>
            </div>
          </div>
          <aside aria-live="polite" className="absolute right-6 top-16 md:top-32 z-10 text-right">
            <div>
              <div className="font-industrial text-sm text-muted-foreground mb-1">Common People Total</div>
              <div className="font-brutalist text-2xl text-foreground">{totals ? (totals.people / 100).toFixed(2) : '—'}</div>
            </div>
            <div className="mt-4">
              <div className="font-industrial text-sm text-muted-foreground mb-1">Croft Common Total</div>
              <div className="font-brutalist text-2xl text-foreground">{totals ? (totals.croft / 100).toFixed(2) : '—'}</div>
            </div>
            <div className="mt-4">
              <div className="font-industrial text-sm text-muted-foreground mb-1">Combined Total</div>
              <div className="font-brutalist text-2xl text-foreground">{totals ? (totals.combined / 100).toFixed(2) : '—'}</div>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CommonGood;
