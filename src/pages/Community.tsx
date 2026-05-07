import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommunityHeroCarousel from "@/components/CommunityHeroCarousel";
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { CMSText } from '@/components/cms/CMSText';
import { useCMSMode } from '@/contexts/CMSModeContext';

interface CommonGoodRow { message: string; posted_at: string; }

const Community = () => {
  const [messages, setMessages] = useState<CommonGoodRow[]>([]);
  const { isCMSMode } = useCMSMode();

  useEffect(() => {
    document.title = 'Community | Croft Common';
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await ((supabase as any).from('common_good_messages' as any)
        .select('message, posted_at')
        .order('posted_at', { ascending: false }) as any);
      if (!error && data) setMessages(data as CommonGoodRow[]);
    })();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, CommonGoodRow[]>();
    for (const m of messages) {
      const d = new Date(m.posted_at);
      const key = format(d, 'MMMM yyyy');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    return Array.from(map.entries());
  }, [messages]);

  return (
    <div className="min-h-screen">
      {!isCMSMode && <Navigation />}
      <CommunityHeroCarousel />
      <section className="pb-24 bg-background" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 140px)' }}>
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="community" 
            section="hero" 
            contentKey="title" 
            fallback="COMMON GROUND"
            as="h1"
            className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground"
          />
          <CMSText 
            page="community" 
            section="hero" 
            contentKey="description" 
            fallback="We didn't land here by accident.\n\nCroft Common was built in the heart of it all - the murals, the music, the noise, it has roots.\n\nStokes Croft isn't a backdrop, it's part of the fabric. We're here for more than trade. We give back in time, space, and support.\n\nAlways add, never subtract."
            as="p"
            className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed whitespace-pre-line"
          />
        </div>
      </section>


      {!isCMSMode && <Footer />}
    </div>
  );
};

export default Community;