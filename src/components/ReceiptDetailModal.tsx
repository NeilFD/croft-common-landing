import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface Receipt {
  id: string;
  receipt_image_url: string;
  venue_location?: string;
  items: ReceiptItem[];
  total_amount: number;
}

interface ReceiptDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: Receipt | null;
  receiptDate: string;
}

const ReceiptDetailModal: React.FC<ReceiptDetailModalProps> = ({
  isOpen,
  onClose,
  receipt,
  receiptDate
}) => {
  if (!receipt) return null;

  console.log('Receipt data in modal:', receipt);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receipt Details</DialogTitle>
          <div className="flex gap-2 text-sm text-muted-foreground">
            <span>{format(new Date(receiptDate), 'dd MMM yyyy')}</span>
            {receipt.venue_location && (
              <>
                <span>•</span>
                <span>{receipt.venue_location}</span>
              </>
            )}
            <span>•</span>
            <span>£{receipt.total_amount.toFixed(2)}</span>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Receipt Image */}
          <div className="flex justify-center">
            {receipt.receipt_image_url ? (
              <img
                src={receipt.receipt_image_url}
                alt="Receipt"
                className="max-w-full h-auto rounded-lg border"
                style={{ maxHeight: '400px' }}
                onError={(e) => {
                  console.error('Failed to load receipt image:', receipt.receipt_image_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-48 bg-muted rounded-lg border">
                <p className="text-muted-foreground">Receipt image not available</p>
              </div>
            )}
          </div>

          {/* Items List */}
          {receipt.items && receipt.items.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {receipt.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × £{item.price.toFixed(2)}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      £{(item.quantity * item.price).toFixed(2)}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-between items-center pt-3 mt-3 border-t">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-lg">£{receipt.total_amount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReceiptDetailModal;