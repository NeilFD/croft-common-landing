import SubscriptionForm from './SubscriptionForm';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
const Footer = ({
  showSubscription = true
}: {
  showSubscription?: boolean;
}) => {
  const [cgTotal, setCgTotal] = useState<number | null>(null);
  useEffect(() => {
    let mounted = true;
    const fetchTotals = async () => {
      try {
        const {
          data,
          error
        } = await supabase.functions.invoke('get-common-good-totals', {
          body: {}
        });
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
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);
  return <footer className="bg-void text-background py-16">
      <div className="container mx-auto px-6">
        {/* Newsletter subscription section */}
      {showSubscription && <div className="mb-16 text-center">
            <SubscriptionForm variant="footer" className="max-w-md mx-auto" />
          </div>}
        
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
            <div className="flex flex-col md:flex-row md:gap-3 gap-3 text-sm font-industrial">
              <a href="mailto:hello@croftcommon.co.uk" className="w-fit border-2 border-background text-background px-3 py-1 rounded-lg transition-colors duration-200 hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]">
                hello@croftcommon.co.uk
              </a>
              <a href="tel:0117xxxxxxx" className="w-fit border-2 border-background text-background px-3 py-1 rounded-lg transition-colors duration-200 hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]">
                0117 xxx xxxx
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="font-industrial text-sm uppercase tracking-wide mb-4 text-background/90">
              HOURS
            </h4>
            <div className="space-y-2 text-sm font-industrial">
              <div className="block border-2 border-background text-background px-3 py-1 rounded-lg mb-2">SUN—THURS: 7AM—LATE</div>
              <div className="block border-2 border-background text-background px-3 py-1 rounded-lg">FRI—SAT: 7AM—LATER</div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-12 pt-8 flex justify-between items-center">
          <div className="font-industrial text-xs text-background/50">© 2025 CROFT COMMON LTD</div>
          
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center">
          <div className="font-industrial text-sm uppercase tracking-wide text-background/80 mb-2">The Common Good</div>
          <div className="inline-block px-4 py-2 border-2 border-background rounded-full font-brutalist text-4xl md:text-5xl text-background transition-colors duration-200">{cgTotal !== null ? (cgTotal / 100).toFixed(2) : '—'}</div>
        </div>
      </div>
    </footer>;
};
export default Footer;