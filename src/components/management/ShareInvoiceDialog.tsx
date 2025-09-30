import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ShareInvoiceDialogProps {
  invoice: any;
  eventData: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const ShareInvoiceDialog: React.FC<ShareInvoiceDialogProps> = ({
  invoice,
  eventData,
  open,
  onOpenChange,
  onSuccess
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(eventData?.client_email || '');
  const [emailSubject, setEmailSubject] = useState(
    `Invoice ${invoice?.number} - ${eventData?.event_code || 'Event'}`
  );
  const [emailBody, setEmailBody] = useState(
    `Dear ${eventData?.client_name || 'Client'},\n\nPlease find attached invoice ${invoice?.number} for ${eventData?.event_name || 'your event'}.\n\nInvoice Details:\n- Amount: £${invoice?.total ? parseFloat(invoice.total).toFixed(2) : '0.00'}\n- Due Date: ${invoice?.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : 'N/A'}\n\nYou can download the invoice PDF using the link in this email.\n\nFor payment, please contact us for a secure payment link or make a bank transfer.\n\nBest regards,\nCroft Common Team`
  );

  const handleShareViaEmail = async () => {
    if (!recipientEmail) {
      toast({
        title: "Error",
        description: "Please enter a recipient email address",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);

    try {
      // Generate PDF
      toast({
        title: "Generating invoice PDF...",
        description: "Please wait while we prepare your invoice"
      });

      const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId: invoice.id }
      });

      if (pdfError) throw pdfError;

      // Get signed URL for the PDF (valid for 1 hour)
      const fileName = `invoice-${invoice.number.replace(/\//g, '-')}.pdf`;
      const { data: signedUrlData } = await supabase
        .storage
        .from('invoice-documents')
        .createSignedUrl(fileName, 3600);

      const pdfUrl = signedUrlData?.signedUrl || pdfData.pdfUrl;

      // Update invoice status to sent with metadata
      await supabase
        .from('invoices')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sent_to: recipientEmail
        })
        .eq('id', invoice.id);

      // Prepare email content with PDF link
      const emailBodyWithLink = `${emailBody}\n\n---\nInvoice PDF: ${pdfUrl}\n(This link is valid for 1 hour)`;

      // Open email client with pre-filled content
      const mailtoLink = `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBodyWithLink)}`;
      
      window.location.href = mailtoLink;

      toast({
        title: "Success",
        description: "Invoice PDF generated and email client opened"
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice PDF",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-brutalist uppercase tracking-wider flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Share Invoice via Email
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Invoice Preview */}
          <div className="bg-muted p-4 rounded-lg border-2 border-black">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 mt-1 text-muted-foreground" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-lg">Invoice {invoice?.number}</p>
                    <p className="text-sm text-muted-foreground">
                      {eventData?.event_name || 'Event'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl">£{invoice?.total ? parseFloat(invoice.total).toFixed(2) : '0.00'}</p>
                    <p className="text-sm text-muted-foreground">
                      Due: {invoice?.due_date ? format(new Date(invoice.due_date), 'dd/MM/yyyy') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Email Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient">Recipient Email *</Label>
              <Input
                id="recipient"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="client@example.com"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Auto-populated from event client email
              </p>
            </div>

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="body">Email Body</Label>
              <Textarea
                id="body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={8}
                className="mt-1 font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A secure PDF download link will be automatically added to the email
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleShareViaEmail}
              disabled={isGenerating || !recipientEmail}
              className="flex-1 font-industrial uppercase tracking-wider"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Open Email Client
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
              className="font-industrial uppercase tracking-wider"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
