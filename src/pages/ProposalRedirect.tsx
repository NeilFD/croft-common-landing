import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from "@/integrations/supabase/client";

// Branded proposal preview page: croftcommontest.com/proposal/:code
// Loads the latest PDF via an Edge Function and previews it inline

const ProposalRedirect: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('proposal-latest', { body: { code } });
        if (error) throw error as any;
        if (!cancelled) {
          if (data && (data as any).public_url) {
            setPdfUrl((data as any).public_url as string);
          } else {
            setError('PDF not found');
          }
        }
      } catch (err) {
        console.error('Error loading proposal PDF:', err);
        if (!cancelled) setError('We could not load the proposal.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [code]);

  const pageTitle = code ? `View Proposal ${code} | Croft Common` : 'View Proposal | Croft Common';
  const canonical = code ? `https://www.croftcommontest.com/proposal/${code}` : 'https://www.croftcommontest.com/proposal';

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={`View the latest proposal PDF${code ? ` for ${code}` : ''} from Croft Common.`} />
        <link rel="canonical" href={canonical} />
      </Helmet>

      <header className="sr-only">
        <h1>View Proposal PDF {code ? `(${code})` : ''}</h1>
      </header>

      <main className="min-h-screen p-6 md:p-8">
        <section className="mx-auto max-w-6xl space-y-4">
          {loading && (
            <p className="text-muted-foreground">Loading your proposal…</p>
          )}
          {!loading && error && (
            <p className="text-destructive">Sorry, we couldn’t load the proposal. Please try again later.</p>
          )}
          {pdfUrl && (
            <>
              <article className="rounded-md border bg-card shadow-sm overflow-hidden">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=0`}
                  title={`Proposal PDF ${code ?? ''}`}
                  className="w-full h-[80vh]"
                  loading="lazy"
                />
              </article>
              <div className="flex items-center gap-4">
                <a href={pdfUrl} className="underline">Open directly</a>
                <a href={pdfUrl} download className="underline">Download PDF</a>
              </div>
            </>
          )}
        </section>
      </main>
    </>
  );
};

export default ProposalRedirect;
