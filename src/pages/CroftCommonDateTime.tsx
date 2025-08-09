import React, { useEffect, useMemo, useState } from "react";
import CroftLogo from "@/components/CroftLogo";
import { supabase } from "@/integrations/supabase/client";

const CroftCommonDateTime: React.FC = () => {
  const [now, setNow] = useState(new Date());
  const [cgTotal, setCgTotal] = useState<number | null>(null);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // SEO: title, description, canonical
  useEffect(() => {
    const title = "Croft Common Date & Time – Live Clock";
    document.title = title;

    const descContent = "Live Croft Common date and HH:MM:SS time on a clean, mobile‑first page.";
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = descContent;

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.href;
  }, []);

  // Fetch Common Good running total
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
        // silent
      }
    };
    fetchTotals();
    const id = setInterval(fetchTotals, 60_000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const dateStr = useMemo(() => now.toLocaleDateString(undefined, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }), [now]);

  const timeStr = useMemo(() => now.toLocaleTimeString(undefined, {
    hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'
  }), [now]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="w-full px-6 pt-8 pb-4 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <CroftLogo size="lg" />
          <span className="font-brutalist text-xl tracking-wider">CROFT COMMON</span>
        </div>
      </header>
      <div className="w-full border-t border-border/60" />

      <main className="flex-1 px-6 pb-12 flex flex-col items-center justify-center text-center">
        <h1 className="sr-only">Croft Common Live Date and Time</h1>
        <section aria-label="Current date and time" className="space-y-6 w-full max-w-md">
          <div className="h-px w-24 bg-border/60 mx-auto" aria-hidden="true" />
          <p className="font-industrial text-lg sm:text-xl md:text-2xl opacity-80">{dateStr}</p>
          <div className="h-px w-16 bg-border/60 mx-auto" aria-hidden="true" />
          <p className="font-brutalist tracking-widest text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
            {timeStr}
          </p>
          <div className="h-px w-24 bg-border/60 mx-auto" aria-hidden="true" />
        </section>
      </main>

      <footer className="bg-void text-background py-8">
        <div className="container mx-auto px-6 text-center">
          <div className="font-industrial text-xs uppercase tracking-wide mb-1">The Common Good</div>
          <div className="font-brutalist text-3xl">
            {cgTotal !== null ? (cgTotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CroftCommonDateTime;
