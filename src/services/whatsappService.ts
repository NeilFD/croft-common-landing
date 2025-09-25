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
  const fileName = `${walkCard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
  
  // Format the walk date and time block for the welcome message
  const walkDate = new Date(walkCard.date || walkCard.created_at).toLocaleDateString('en-GB');
  const timeBlock = formatTimeBlock(walkCard.time_block);
  const welcomePrefix = `Hey, here's the Market Research report from ${walkDate}${timeBlock ? ` ${timeBlock}` : ''}`;
  
  try {
    // Always download the PDF first and wait for completion
    await downloadPDF(blob, walkCard);
    
    // Add delay to ensure blob URL is completely cleaned up
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check if Web Share API is available (mostly mobile)
    if (navigator.share) {
      try {
        const shareMessage = `${welcomePrefix}\n\nThe PDF report has been downloaded to your device - you can attach it to this message to share the complete findings.`;
        
        // Log what we're sharing for debugging
        console.log('Sharing via Web Share API:', {
          title: `Market Research Report: ${walkCard.title}`,
          text: shareMessage
        });
        
        await navigator.share({
          title: `Market Research Report: ${walkCard.title}`,
          text: shareMessage
        });
        
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
          return false;
        }
      }
    }

    // Fallback: Use WhatsApp Web with pre-composed message
    const message = `${welcomePrefix}\n\nI've downloaded the PDF report for you - you can attach it to this message to share the complete findings.`;
    const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    // Show helpful toast message
    showToast?.({
      title: "Report Downloaded & WhatsApp Opened",
      description: "The PDF has been downloaded. WhatsApp Web is opening with your message - attach the downloaded PDF file to complete the share."
    });
    
    // Open WhatsApp Web in a new window/tab
    window.open(whatsappUrl, '_blank');
    
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