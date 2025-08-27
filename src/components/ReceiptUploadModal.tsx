import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useReceiptStreakIntegration } from '@/hooks/useReceiptStreakIntegration';
import { Camera, Upload, Check, Loader2 } from 'lucide-react';

interface ReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExtractedData {
  date: string;
  total: number;
  currency: string;
  venue_location: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

const ReceiptUploadModal: React.FC<ReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const { processReceiptForStreak } = useReceiptStreakIntegration();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [editedData, setEditedData] = useState<ExtractedData | null>(null);

  const resetModal = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl('');
    setExtractedData(null);
    setEditedData(null);
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

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('cms-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const extractReceiptData = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      
      // Upload image first
      const imageUrl = await uploadImage(selectedFile);

      // Call OCR function
      const { data, error } = await supabase.functions.invoke('receipt-ocr', {
        body: {
          image_url: imageUrl,
          action: 'extract'
        }
      });

      if (error) throw error;

      setExtractedData(data.extracted_data);
      setEditedData(data.extracted_data);
      setStep(3);
      
      toast({
        title: "Receipt Processed",
        description: "Receipt data extracted successfully. Please review and confirm."
      });

    } catch (error) {
      console.error('Error extracting receipt data:', error);
      toast({
        title: "Extraction Failed",
        description: "Failed to process receipt. Please try again or enter details manually.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveReceipt = async () => {
    if (!editedData || !previewUrl) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.functions.invoke('receipt-ocr', {
        body: {
          image_url: previewUrl,
          action: 'save',
          receipt_data: editedData
        }
      });

      if (error) throw error;

      // Process for streak system if receipt was saved successfully
      if (data?.receipt_id) {
        try {
          await processReceiptForStreak(
            data.receipt_id,
            editedData.date,
            editedData.total
          );
        } catch (streakError) {
          console.warn('Streak processing failed, but receipt was saved:', streakError);
          // Don't fail the entire process if streak processing fails
        }
      }

      toast({
        title: "Success",
        description: `£${editedData.total} added to your ledger. Great tracking!`
      });

      onSuccess();
      handleClose();

    } catch (error) {
      console.error('Error saving receipt:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save receipt. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateItemField = (index: number, field: string, value: any) => {
    if (!editedData) return;
    
    const newItems = [...editedData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    setEditedData({ ...editedData, items: newItems });
  };

  const addItem = () => {
    if (!editedData) return;
    
    setEditedData({
      ...editedData,
      items: [...editedData.items, { name: '', quantity: 1, price: 0 }]
    });
  };

  const removeItem = (index: number) => {
    if (!editedData) return;
    
    const newItems = editedData.items.filter((_, i) => i !== index);
    setEditedData({ ...editedData, items: newItems });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Receipt</DialogTitle>
          <DialogDescription>
            Step {step} of 4: {
              step === 1 ? 'Select receipt image' :
              step === 2 ? 'Preview and extract data' :
              step === 3 ? 'Review and edit details' :
              'Save to ledger'
            }
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: File Selection */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Upload Receipt Image</p>
              <p className="text-muted-foreground mb-4">
                Take a photo or select an image of your receipt
              </p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Choose File
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

        {/* Step 2: Preview and Extract */}
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
            
            <div className="flex gap-2">
              <Button
                onClick={() => setStep(1)}
                variant="outline"
                className="flex-1"
              >
                Change Image
              </Button>
              <Button
                onClick={extractReceiptData}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Extract Details
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Review and Edit */}
        {step === 3 && editedData && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={editedData.date}
                  onChange={(e) => setEditedData({ ...editedData, date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="total">Total Amount</Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={editedData.total}
                  onChange={(e) => setEditedData({ ...editedData, total: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue Location</Label>
              <Input
                id="venue"
                value={editedData.venue_location || ''}
                onChange={(e) => setEditedData({ ...editedData, venue_location: e.target.value })}
                placeholder="Restaurant or venue name"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Items</Label>
                <Button size="sm" variant="outline" onClick={addItem}>
                  Add Item
                </Button>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {editedData.items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Item name"
                      value={item.name}
                      onChange={(e) => updateItemField(index, 'name', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItemField(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-16"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateItemField(index, 'price', parseFloat(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeItem(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => setStep(2)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={saveReceipt}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Save Receipt
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptUploadModal;