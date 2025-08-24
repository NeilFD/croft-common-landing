import React, { useEffect, useMemo, useState } from "react";
import CroftLogo from "@/components/CroftLogo";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCMSMode } from "@/contexts/CMSModeContext";
import { CMSText } from "@/components/cms/CMSText";

const Book: React.FC = () => {
  const navigate = useNavigate();
  const [cgTotal, setCgTotal] = useState<number | null>(null);
  const { isCMSMode } = useCMSMode();

  // SEO: title, description, canonical
  useEffect(() => {
    document.title = "Book | Croft Common – Coming Soon";

    const metaDescId = "meta-desc-book";
    let metaDesc = document.getElementById(metaDescId) as HTMLMetaElement | null;
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      metaDesc.id = metaDescId;
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = "Croft Common booking – Coming soon. Mind your own business.";

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
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

  const formattedTotal = useMemo(() => (
    cgTotal !== null
      ? (cgTotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "—"
  ), [cgTotal]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {!isCMSMode && (
        <header className="container mx-auto px-6 pt-10">
          <Button
            variant="outline"
            className="absolute top-6 left-6"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            Back
          </Button>
        </header>
      )}

      <main className="flex-1 container mx-auto px-6 flex flex-col items-center justify-center text-center gap-6">
        <div className="opacity-90">
          <CroftLogo size="lg" />
        </div>
        <CMSText 
          page="book" 
          section="hero" 
          contentKey="title"
          fallback="Croft Common"
          as="h1"
          className="font-brutalist text-3xl md:text-5xl tracking-wide"
        />
        <CMSText 
          page="book" 
          section="hero" 
          contentKey="subtitle"
          fallback="Coming Soon - Mind your own business"
          as="p"
          className="font-industrial text-lg md:text-2xl opacity-80"
        />
      </main>

      <footer className="bg-void text-background py-8">
        <div className="container mx-auto px-6 text-center">
          <CMSText 
            page="book" 
            section="footer" 
            contentKey="label"
            fallback="The Common Good"
            className="font-industrial text-xs uppercase tracking-wide mb-1"
          />
          <div className="font-brutalist text-3xl">{formattedTotal}</div>
        </div>
      </footer>
    </div>
  );
};

export default Book;
