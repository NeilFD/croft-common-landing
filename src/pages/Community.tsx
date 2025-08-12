import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import CommunityHeroCarousel from "@/components/CommunityHeroCarousel";
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';

interface CommonGoodRow { message: string; posted_at: string; }

const Community = () => {
  const [messages, setMessages] = useState<CommonGoodRow[]>([]);

  useEffect(() => {
    document.title = 'Community | Croft Common';
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase.from('common_good_messages' as any)
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
      <Navigation />
      <CommunityHeroCarousel />
      <section className="py-24 bg-background">
        <div className="container mx-auto px-6 text-center">
          <h1 className="font-brutalist text-4xl md:text-6xl mb-8 text-foreground">COMMON GROUND</h1>
          <p className="font-industrial text-lg text-foreground/70 max-w-2xl mx-auto leading-relaxed">
            We didn't land here by accident.
            <br /><br />
            Croft Common was built in the heart of it all - the murals, the music, the noise, the roots.
            <br /><br />
            Stokes Croft isn't a backdrop, it's part of the fabric. We’re here for more than trade. We give back in time, space, and support.
            <br /><br />
            Always add, never subtract.
          </p>
        </div>
      </section>

      <section className="pb-24 bg-background">
        <div className="container mx-auto px-6 max-w-3xl">
          <Accordion type="single" collapsible>
            <AccordionItem value="common-good-thread">
              <AccordionTrigger className="font-industrial text-sm uppercase tracking-wide inline-flex items-center gap-2 leading-none border-2 border-foreground rounded-full px-3 py-2 mb-4 no-underline hover:no-underline hover:border-[hsl(var(--accent-pink))] hover:text-[hsl(var(--accent-pink))]">Common Good thread</AccordionTrigger>
              <AccordionContent>
                <div className="max-h-[360px] overflow-y-auto pr-2">
                  {grouped.length === 0 ? (
                    <p className="font-industrial text-muted-foreground">No messages yet.</p>
                  ) : (
                    grouped.map(([month, items]) => (
                      <div key={month} className="mb-6">
                        <h3 className="inline-block font-industrial text-xs uppercase tracking-wide text-foreground/80 mb-2 border border-foreground/60 rounded-md px-2 py-1">{month}</h3>
                        <ul className="space-y-3">
                          {items.map((m, idx) => (
                            <li key={idx} className="border border-border rounded-md p-3 text-left">
                              <div className="font-industrial text-xs text-muted-foreground mb-1">{format(new Date(m.posted_at), 'dd MMM yyyy')}</div>
                              <div className="text-foreground/90 leading-relaxed">{m.message}</div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Community;
