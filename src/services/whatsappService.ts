import { WalkCard } from '@/hooks/useResearch';

export const downloadPDF = (blob: Blob, walkCard: WalkCard) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${walkCard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const shareViaWhatsApp = async (blob: Blob, walkCard: WalkCard): Promise<boolean> => {
  const fileName = `${walkCard.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
  
  // Check if Web Share API is available and supports files (mostly mobile)
  if (navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], fileName, { type: 'application/pdf' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Field Research Report: ${walkCard.title}`,
          text: `Here's the field research report for ${walkCard.title} from ${new Date(walkCard.created_at).toLocaleDateString('en-GB')}`,
          files: [file]
        });
        return true;
      }
    } catch (error) {
      console.log('Web Share API failed, falling back to WhatsApp Web', error);
    }
  }

  // Fallback: Download file and use WhatsApp Web with pre-composed message
  downloadPDF(blob, walkCard);
  
  const message = `Field Research Report: ${walkCard.title}\n\nCompleted on ${new Date(walkCard.created_at).toLocaleDateString('en-GB')}\n\nI've downloaded the PDF report - sharing it with you now.`;
  const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  
  // Open WhatsApp Web in a new window/tab
  window.open(whatsappUrl, '_blank');
  
  return true;
};