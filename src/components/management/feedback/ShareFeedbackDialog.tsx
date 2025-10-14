import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { openExternal } from '@/utils/openExternal';

interface ShareFeedbackDialogProps {
  feedback: any;
  open: boolean;
  onClose: () => void;
  isReport?: boolean;
}

export function ShareFeedbackDialog({ feedback, open, onClose, isReport = false }: ShareFeedbackDialogProps) {
  if (!feedback) return null;

  const shareViaWhatsApp = () => {
    const message = isReport
      ? `Feedback Report: ${feedback.title}\n${feedback.period}\n\nView full report: ${window.location.origin}/management/feedback`
      : `Customer Feedback from ${format(new Date(feedback.created_at), 'MMM dd, yyyy')}\n\nOverall: ${feedback.overall_rating}/5\n${feedback.message ? `\nComment: ${feedback.message}` : ''}\n\nView more: ${window.location.origin}/management/feedback`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    openExternal(whatsappUrl);
    toast.success('Opening WhatsApp');
  };

  const shareViaEmail = () => {
    const subject = isReport
      ? `Feedback Report: ${feedback.title}`
      : `Customer Feedback - ${format(new Date(feedback.created_at), 'MMM dd, yyyy')}`;

    const body = isReport
      ? `${feedback.title}\n\n${feedback.period}\n\nFull report available at: ${window.location.origin}/management/feedback`
      : `Customer Feedback Details\n\nDate: ${format(new Date(feedback.created_at), 'MMM dd, yyyy HH:mm')}\nCustomer: ${feedback.is_anonymous ? 'Anonymous' : feedback.name || 'Unknown'}\n\nOverall Rating: ${feedback.overall_rating}/5\n\nCategory Ratings:\nhospitality: ${feedback.hospitality_rating}/5\nfood: ${feedback.food_rating}/5\ndrink: ${feedback.drink_rating}/5\nteam: ${feedback.team_rating}/5\nvenue: ${feedback.venue_rating}/5\nprice: ${feedback.price_rating}/5\n\n${feedback.message ? `Comment:\n${feedback.message}` : 'No comment provided'}`;

    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    openExternal(mailtoUrl);
    toast.success('Opening email client');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share {isReport ? 'Report' : 'Feedback'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {isReport
              ? 'Share this report via WhatsApp or email'
              : 'Share this feedback via WhatsApp or email'}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={shareViaWhatsApp} variant="outline" className="w-full">
              <Share2 className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={shareViaEmail} variant="outline" className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
