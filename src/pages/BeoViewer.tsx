import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Download, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const BeoViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileName = searchParams.get('f');

  useEffect(() => {
    if (!fileName) {
      setError('No file specified');
      setIsLoading(false);
      return;
    }

    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the PDF as a Blob from the edge function and render via blob: URL
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        // Build full edge function URL (public) and send auth for verify_jwt
        // Note: We import SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY from the client
        const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = await import('@/integrations/supabase/client');
        const functionUrl = `${SUPABASE_URL}/functions/v1/proxy-beo-pdf?fileName=${encodeURIComponent(fileName)}`;

        const res = await fetch(functionUrl, {
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Accept: 'application/pdf'
          }
        });

        if (!res.ok) throw new Error(`Function fetch failed: ${res.status}`);

        const blob = await res.blob();
        if (blob.type !== 'application/pdf') {
          // Still set but warn; Chrome viewer expects correct type
          console.warn('Unexpected blob type from proxy-beo-pdf:', blob.type);
        }
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        setError('Failed to load PDF document');
        toast.error('Failed to load PDF');
      } finally {
        setIsLoading(false);
      }
    };

    loadPdf();

    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [fileName]);

  const handleDownload = () => {
    if (!pdfUrl) return;
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName?.split('/').pop() || 'beo.pdf';
    link.click();
  };

  if (!fileName) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-brutalist mb-4">No File Specified</h1>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-foreground" />
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-brutalist mb-4 text-destructive">Error</h1>
          <p className="text-muted-foreground mb-4">{error || 'Failed to load PDF'}</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-brutalist">BEO Document</h1>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          src={pdfUrl}
          className="w-full h-full border-0"
          title="BEO PDF Viewer"
        />
      </div>
    </div>
  );
};

export default BeoViewer;
