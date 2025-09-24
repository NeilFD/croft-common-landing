import SubscriptionForm from './SubscriptionForm';
import MembershipLinkModal from './MembershipLinkModal';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CMSText } from './cms/CMSText';
const Footer = ({
  showSubscription = true
}: {
  showSubscription?: boolean;
}) => {
  const [cgTotal, setCgTotal] = useState<number | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const { toast } = useToast();
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
  return (
    <footer className="bg-void text-background py-16">
      <div className="container mx-auto px-6">
        {/* Newsletter subscription section */}
      {showSubscription && <div className="mb-16 text-center">
            <SubscriptionForm variant="footer" className="max-w-md mx-auto" />
          </div>}
        
        {/* Uncommon Standards section */}
        <div className="mb-16 text-center border-b border-background/20 pb-12">
          <h3 className="font-brutalist text-3xl mb-4 text-background">
            Our Uncommon Standards
          </h3>
          <p className="font-industrial text-lg text-background/80 mb-6 max-w-2xl mx-auto leading-relaxed">
            We believe hospitality should be felt, not just promised. These are the standards we hold ourselves to, written plainly and lived every shift.
          </p>
          <button
            onClick={() => window.location.href = '/uncommon-standards'}
            className="inline-flex items-center px-8 py-3 border-2 border-background text-background font-industrial text-lg hover:bg-background hover:text-void transition-all duration-200 rounded-lg"
          >
            Read Our Standards
          </button>
        </div>
        
         <div className="grid md:grid-cols-3 gap-12">
          <div>
            <CMSText
              page="global"
              section="footer"
              contentKey="title"
              fallback="CROFT COMMON"
              className="font-brutalist text-2xl mb-6"
              as="h3"
            />
            <CMSText
              page="global"
              section="footer"
              contentKey="description"
              fallback="Stokes Croft, Bristol<br />Pure Hospitality"
              className="font-industrial text-sm text-background/70 leading-relaxed"
              as="p"
            />
          </div>
          
          <div>
            <CMSText
              page="global"
              section="footer"
              contentKey="contact_title"
              fallback="CONTACT"
              className="font-industrial text-sm uppercase tracking-wide mb-4 text-background/90"
              as="h4"
            />
            <div className="flex flex-col md:flex-row md:gap-3 gap-3 text-sm font-industrial">
              <a 
                href="mailto:hello@croftcommon.co.uk"
                className="w-fit border-2 border-background text-background px-3 py-1 rounded-lg transition-colors duration-200 hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]"
              >
                <CMSText
                  page="global"
                  section="footer"
                  contentKey="email"
                  fallback="hello@croftcommon.co.uk"
                  className=""
                  as="div"
                />
              </a>
              <a 
                href="tel:01171234567"
                className="w-fit border-2 border-background text-background px-3 py-1 rounded-lg transition-colors duration-200 hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]"
              >
                <CMSText
                  page="global"
                  section="footer"
                  contentKey="phone"
                  fallback="0117 123 4567"
                  className=""
                  as="div"
                />
              </a>
            </div>
          </div>
          
          <div>
            <CMSText
              page="global"
              section="footer"
              contentKey="hours_title"
              fallback="HOURS"
              className="font-industrial text-sm uppercase tracking-wide mb-4 text-background/90"
              as="h4"
            />
            <div className="space-y-2 text-sm font-industrial">
              <CMSText
                page="global"
                section="footer"
                contentKey="hours_weekday"
                fallback="SUN—THURS: 7AM—LATE"
                className="w-fit border-2 border-background text-background px-3 py-1 rounded-lg mb-2"
                as="div"
              />
              <CMSText
                page="global"
                section="footer"
                contentKey="hours_weekend"
                fallback="FRI—SAT: 7AM—LATER"
                className="w-fit border-2 border-background text-background px-3 py-1 rounded-lg"
                as="div"
              />
            </div>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-12 pt-8 flex justify-between items-center">
          <CMSText
            page="global"
            section="footer"
            contentKey="copyright"
            fallback="© 2025 CROFT COMMON LTD"
            className="font-industrial text-xs text-background/50"
            as="div"
          />
          <button 
            onClick={() => setLinkModalOpen(true)}
            className="font-industrial text-xs text-background/70 hover:text-background transition-colors duration-200 underline underline-offset-2"
          >
            <CMSText
              page="global"
              section="footer"
              contentKey="membership_link_text"
              fallback="Link Membership"
              className=""
              as="div"
            />
          </button>
        </div>

        <div className="border-t border-background/20 mt-8 pt-8 text-center">
          <div className="text-left mb-2">
            <CMSText
              page="global"
              section="footer"
              contentKey="common_good_title"
              fallback="The Common Good"
              className="font-industrial text-sm uppercase tracking-wide text-background/80 hover:text-background transition-colors duration-200 cursor-pointer"
              as="div"
              href="/common-good"
            />
          </div>
          <div className="inline-block px-4 py-2 border-2 border-background rounded-full font-brutalist text-4xl md:text-5xl text-background transition-colors duration-200">{cgTotal !== null ? (cgTotal / 100).toFixed(2) : "—"}</div>
        </div>

        <MembershipLinkModal 
          open={linkModalOpen}
          onClose={() => setLinkModalOpen(false)}
          onSuccess={(email) => {
            setLinkModalOpen(false);
            toast({
              title: "Membership Linked",
              description: `Successfully linked to ${email}. You'll now receive personalized notifications.`,
            });
          }}
        />
      </div>
    </footer>
  );
};

export default Footer;