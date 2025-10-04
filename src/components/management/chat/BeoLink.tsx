import { supabase } from '@/integrations/supabase/client';

interface BeoLinkProps {
  fileName: string;
  children: React.ReactNode;
  className?: string;
}

export const BeoLink = ({ fileName, children, className }: BeoLinkProps) => {
  const handleClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Only intercept plain left-click (no modifiers)
    if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) {
      return; // Let browser handle modified clicks
    }

    e.preventDefault();
    e.stopPropagation();

    console.log('[BeoLink] Opening BEO with fileName:', fileName);

    // Synchronously pre-open blank tab to bypass popup blockers
    const newTab = window.open('about:blank', '_blank', 'noopener,noreferrer');

    try {
      // Fetch signed URL
      const { data, error } = await supabase.functions.invoke('get-beo-signed-url', {
        body: { fileName }
      });

      if (error) {
        console.error('[BeoLink] Error fetching signed URL:', error);
        throw error;
      }

      if (data?.signedUrl) {
        console.log('[BeoLink] Redirecting to signed URL');
        if (newTab) {
          newTab.location.href = data.signedUrl;
        } else {
          window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
        }
      } else {
        throw new Error('No signed URL returned');
      }
    } catch (err) {
      console.error('[BeoLink] Failed to open BEO, falling back to default href:', err);
      // Close the blank tab and fall back to default href behavior
      newTab?.close();
      const fallbackUrl = `/beo/view?f=${encodeURIComponent(fileName)}`;
      window.open(fallbackUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <a
      href={`/beo/view?f=${encodeURIComponent(fileName)}`}
      target="_blank"
      rel="noopener noreferrer"
      data-beo
      className={className}
      onClick={handleClick}
      role="link"
      aria-label="Open BEO PDF in new tab"
    >
      {children}
    </a>
  );
};
