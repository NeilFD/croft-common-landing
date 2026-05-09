import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useReceiptStreakIntegration } from '@/hooks/useReceiptStreakIntegration';
import { Camera, Upload, Check, Loader2, ShieldAlert } from 'lucide-react';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RejectionInfo {
  code: string;
  message: string;
}

const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const { processReceiptForStreak } = useReceiptStreakIntegration();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [rejection, setRejection] = useState<RejectionInfo | null>(null);

  const resetModal = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl('');
    setRejection(null);
    setLoading(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setRejection(null);
      setStep(2);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `receipts/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('cms-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('cms-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const verifyAndSave = async () => {
    if (!selectedFile) return;
    setRejection(null);
    setLoading(true);

    try {
      const imageUrl = await uploadImage(selectedFile);

      // Call edge function directly via fetch so we can read 422 body
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      const projectId = (import.meta as any).env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.functions.supabase.co/receipt-ocr`;

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ image_url: imageUrl, action: 'save' }),
      });

      const payload = await res.json().catch(() => ({}));

      if (res.status === 422) {
        setRejection({
          code: payload.code || 'rejected',
          message: payload.message || 'Receipt rejected.',
        });
        return;
      }

      if (!res.ok) {
        toast({
          title: 'Upload failed',
          description: payload.error || 'Something went wrong. Try again.',
          variant: 'destructive',
        });
        return;
      }

      // Success — fire streak processing (best effort)
      if (payload?.receipt?.id) {
        try {
          await processReceiptForStreak(
            payload.receipt.id,
            payload.receipt.receipt_date,
            Number(payload.receipt.total_amount) || 0,
          );
        } catch (e) {
          console.warn('Streak processing failed', e);
        }
      }

      toast({
        title: 'Receipt logged',
        description: `£${Number(payload.receipt?.total_amount || 0).toFixed(2)} added to your ledger.`,
      });

      onSuccess();
      handleClose();
    } catch (e) {
      console.error('verifyAndSave failed', e);
      toast({
        title: 'Upload failed',
        description: 'Something went wrong. Try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Receipt</DialogTitle>
          <DialogDescription>
            We check for the Crazy Bear logo, the date and the time. Photos of screens won't count.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: file picker */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Photograph your receipt</p>
              <p className="text-muted-foreground text-sm mb-4">
                Lay it flat. Make sure the bear logo, date and time are clear.
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose photo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Step 2: preview + verify */}
        {step === 2 && (
          <div className="space-y-4">
            {previewUrl && (
              <div className="text-center">
                <img
                  src={previewUrl}
                  alt="Receipt preview"
                  className="max-w-full max-h-64 mx-auto rounded-lg border"
                />
              </div>
            )}

            {rejection && (
              <div className="border border-destructive/50 bg-destructive/10 p-4 rounded-lg flex gap-3 items-start">
                <ShieldAlert className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-destructive mb-1">Receipt rejected</p>
                  <p className="text-foreground">{rejection.message}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={() => { resetModal(); }}
                variant="outline"
                className="flex-1"
                disabled={loading}
              >
                Choose another
              </Button>
              <Button
                onClick={verifyAndSave}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking</>
                ) : (
                  <><Check className="h-4 w-4 mr-2" /> Verify & save</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptUploadModal;
