import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

// Branded redirect page: croftcommontest.com/proposal/:code
// Immediately redirects to the Supabase Edge Function which then 302s to the latest PDF

const SUPABASE_URL = "https://xccidvoxhpgcnwinnyin.supabase.co"; // From our Supabase client

const ProposalRedirect: React.FC = () => {
  const { code } = useParams<{ code: string }>();

  useEffect(() => {
    if (!code) return;
    // Send the user to the public Edge Function which issues a 302 to the PDF
    const target = `${SUPABASE_URL}/functions/v1/proposal-redirect/${code}`;
    // Use replace so the branded URL isn't left in history as a dead page
    window.location.replace(target);
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

      <main className="min-h-screen flex items-center justify-center p-8">
        <section className="text-center space-y-4">
          <p className="text-muted-foreground">Redirecting to your proposal…</p>
          {code && (
            <p className="text-sm">
              If you are not redirected, <a className="underline" href={`${SUPABASE_URL}/functions/v1/proposal-redirect/${code}`}>click here</a>.
            </p>
          )}
        </section>
      </main>
    </>
  );
};

export default ProposalRedirect;
