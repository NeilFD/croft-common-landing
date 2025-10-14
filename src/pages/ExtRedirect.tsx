import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { openExternal } from '@/utils/openExternal';

export default function ExtRedirect() {
  const [params] = useSearchParams();
  const [showFallback, setShowFallback] = useState(false);
  const { toast } = useToast();
  const url = params.get('u');

  useEffect(() => {
    if (!url) {
      console.error('ExtRedirect: No URL provided');
      setShowFallback(true);
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      console.error('ExtRedirect: Invalid URL', url);
      setShowFallback(true);
      return;
    }

    console.info('ExtRedirect: Attempting to open', url);

    const attemptOpen = async () => {
      // Use native-aware helper to open external URL
      try {
        await openExternal(url);
        console.info('ExtRedirect: Opened via openExternal');
        return true;
      } catch (e) {
        console.warn('ExtRedirect: openExternal failed', e);
        setShowFallback(true);
        return false;
      }
    };

    // Try to open, if all fail, show fallback UI
    attemptOpen().then(success => {
      if (!success) {
        setShowFallback(true);
      }
    });
  }, [url]);

  const handleRetry = () => {
    if (url) {
      openExternal(url);
    }
  };

  const handleCopy = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copied',
        description: 'The link has been copied to your clipboard',
      });
    }
  };

  if (!url || showFallback) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-lg p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <ExternalLink className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Open External Link</h1>
          </div>
          
          {url ? (
            <>
              <p className="text-muted-foreground mb-4">
                Click below to open this link in a new tab:
              </p>
              <div className="bg-muted rounded p-3 mb-4 break-all text-sm text-foreground">
                {url}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleRetry} className="flex-1">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Link
                </Button>
                <Button onClick={handleCopy} variant="outline">
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </>
          ) : (
            <p className="text-destructive">Invalid or missing link</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-muted-foreground">Opening link...</div>
    </div>
  );
}
