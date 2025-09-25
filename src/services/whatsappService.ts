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
  
  try {
    // Check if Web Share API is available (mostly mobile)
    if (navigator.share) {
      try {
        const shareMessage = `${welcomePrefix}\n\nThe PDF report will be downloaded to your device - you can attach it to this message to share the complete findings.`;
        
        // Log what we're sharing for debugging
        console.log('Sharing via Web Share API (text-only):', {
          title: `Market Research Report: ${walkCard.title}`,
          text: shareMessage,
          platform: 'Mobile Web Share API'
        });
        
        // Share text first (no files to prevent blob URL injection)
        await navigator.share({
          title: `Market Research Report: ${walkCard.title}`,
          text: shareMessage
        });
        
        // After successful share, trigger PDF download
        console.log('Share successful, now downloading PDF...');
        await downloadPDF(blob, walkCard);
        
        showToast?.({
          title: "Message Shared & PDF Downloaded",
          description: "The message has been shared and PDF downloaded - attach the PDF file to complete the share."
        });
        return true;
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.log('Web Share API failed, falling back to WhatsApp Web', error);
        } else {
          // User cancelled the share
          console.log('User cancelled Web Share API');
          return false;
        }
      }
    }

    // Fallback: Use WhatsApp Web with pre-composed message
    const message = `${welcomePrefix}\n\nThe PDF report will be downloaded for you - you can attach it to this message to share the complete findings.`;
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    console.log('Using WhatsApp Web fallback:', {
      message,
      platform: 'Desktop WhatsApp Web'
    });
    
    // Open WhatsApp Web first
    window.open(whatsappUrl, '_blank');
    
    // Then trigger PDF download after a short delay
    setTimeout(async () => {
      console.log('WhatsApp Web opened, now downloading PDF...');
      await downloadPDF(blob, walkCard);
    }, 1000);
    
    // Show helpful toast message
    showToast?.({
      title: "WhatsApp Opened & PDF Downloading",
      description: "WhatsApp Web is opening with your message. The PDF will download shortly - attach it to complete the share."
    });
    
    return true;
  } catch (error) {
    console.error('Error in shareViaWhatsApp:', error);
    showToast?.({
      title: "Share Failed",
      description: "There was an error sharing the report. Please try again.",
      variant: "destructive"
    });
    return false;
  }
};