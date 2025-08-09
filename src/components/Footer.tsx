import SubscriptionForm from './SubscriptionForm';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Footer = ({ showSubscription = true }: { showSubscription?: boolean }) => {
  const [cgTotal, setCgTotal] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchTotals = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-common-good-totals', { body: {} });
        if (!mounted) return;
        if (error) throw error;
        const combined = data?.combined_total_cents ?? 0;
        setCgTotal(combined);
      } catch (e) {
        // ignore
      }
    };
    fetchTotals();
    const id = setInterval(fetchTotals, 60_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  return (
    <footer className="bg-void text-background py-16">
      <div className="container mx-auto px-6">
        {/* Newsletter subscription section */}
{showSubscription && (
          <div className="mb-16 text-center">
            <SubscriptionForm variant="footer" className="max-w-md mx-auto" />
          </div>
        )}
        
        <div className="grid md:grid-cols-3 gap-12">
          <div>
            <h3 className="font-brutalist text-2xl mb-6">CROFT COMMON</h3>
            <p className="font-industrial text-sm text-background/70 leading-relaxed">
              Stokes Croft, Bristol
              <br />
              Pure Hospitality
            </p>
          </div>
          
          <div>
            <h4 className="font-industrial text-sm uppercase tracking-wide mb-4 text-background/90">
              CONTACT
            </h4>
            <div className="space-y-2 text-sm font-industrial text-background/70">
              <div>hello@croftcommon.co.uk</div>
              <div>0117 xxx xxxx</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-industrial text-sm uppercase tracking-wide mb-4 text-background/90">
              HOURS
            </h4>
            <div className="space-y-2 text-sm font-industrial text-background/70">
              <div>SUN—THURS: 7AM—LATE</div>
              <div>FRI—SAT: 7AM—LATER</div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-12 pt-8 flex justify-between items-center">
          <div className="font-industrial text-xs text-background/50">
            © 2024 CROFT COMMON
          </div>
          <div className="w-8 h-1 bg-accent-pink"></div>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center">
          <div className="font-industrial text-sm uppercase tracking-wide text-background/80 mb-2">The Common Good</div>
          <div className="font-brutalist text-4xl md:text-5xl text-background">{cgTotal !== null ? (cgTotal / 100).toFixed(2) : '—'}</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;