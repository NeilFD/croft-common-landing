import { WalkCard } from '@/hooks/useResearch';

const formatTimeBlock = (timeBlock?: string): string => {
  if (!timeBlock) return '';
  
  const timeBlockMap: Record<string, string> = {
    'EarlyMorning': 'Early Morning',
    'MidMorning': 'Mid Morning',
    'MidAfternoon': 'Mid Afternoon',
    'EarlyEvening': 'Early Evening',
    'Evening': 'Evening',
    'Late': 'Late',
    'Lunch': 'Lunch'
  };
  
  return timeBlockMap[timeBlock] || timeBlock;
};

export const downloadPDF = (blob: Blob, walkCard: WalkCard): Promise<void> => {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${walkCard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up blob URL immediately and resolve after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve();
    }, 100);
  });
};

export const shareViaWhatsApp = async (
  blob: Blob, 
  walkCard: WalkCard, 
  showToast?: (message: { title: string; description: string; variant?: string }) => void
): Promise<boolean> => {
  // Format the walk date and time block for the welcome message
  const walkDate = new Date(walkCard.date || walkCard.created_at).toLocaleDateString('en-GB');
  const timeBlock = formatTimeBlock(walkCard.time_block);
  const welcomePrefix = `Hey, here's the Market Research report from ${walkDate}${timeBlock ? ` ${timeBlock}` : ''}`;

  // Helpers
  const safeTitle = walkCard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && (navigator as any).maxTouchPoints > 1);

  try {
    // Prefer Web Share Level 2 (files) — this attaches the PDF directly in WhatsApp (iOS Safari supports this)
    const file = new File([blob], `${safeTitle}_report.pdf`, { type: 'application/pdf' });
    // On iOS, skip canShare check due to platform quirks and share directly
    const canShareFiles = typeof navigator !== 'undefined'
      && 'share' in navigator
      && (isIOS ? true : ('canShare' in navigator && (navigator as any).canShare?.({ files: [file] })));

    if (canShareFiles && navigator.share) {
      try {
        console.log('Sharing via Web Share API with FILE attachment');
        if (isIOS) {
          await navigator.share({ files: [file], title: welcomePrefix });
        } else {
          await navigator.share({ files: [file], text: welcomePrefix });
        }
        showToast?.({
          title: 'Shared to WhatsApp',
          description: 'The PDF was attached automatically.'
        });
        return true;
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          console.log('User cancelled Web Share dialog');
          return false;
        }
        console.log('Web Share with files failed, falling back', error);
        // Continue to fallbacks below
      }
    }

    // If Web Share with files is unavailable
    const message = `${welcomePrefix}`;

    /* Skipped text-only Web Share fallback to ensure PDF attachment reliability */

    // URL fallbacks
    if (isMobile) {
      // Mobile: open wa.me text composer (no auto-download to prevent blob URLs in the thread)
      const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      console.log('Using mobile WhatsApp fallback (wa.me):', { platform: 'Mobile', waUrl });
      window.open(waUrl, '_blank');
      showToast?.({
        title: 'WhatsApp Opened',
        description: 'Composer opened without attachment due to device support.'
      });
      return true;
    } else {
      // Desktop: WhatsApp Web + then download for manual attach
      const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
      console.log('Using desktop WhatsApp Web fallback:', { platform: 'Desktop', whatsappUrl });
      window.open(whatsappUrl, '_blank');

      setTimeout(async () => {
        console.log('WhatsApp Web opened, now downloading PDF for manual attach...');
        await downloadPDF(blob, walkCard);
      }, 1000);

      showToast?.({
        title: 'WhatsApp Web Opened',
        description: 'The PDF will download so you can attach it to the message.'
      });
      return true;
    }
  } catch (error) {
    console.error('Error in shareViaWhatsApp:', error);
    showToast?.({
      title: 'Share Failed',
      description: 'There was an error sharing the report. Please try again.',
      variant: 'destructive'
    });
    return false;
  }
};