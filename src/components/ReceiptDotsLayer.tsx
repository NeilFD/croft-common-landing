import React from 'react';
import { useReceiptDots } from '@/hooks/useReceiptDots';

interface ReceiptDotsLayerProps {
  date: string;
  className?: string;
}

export const ReceiptDotsLayer: React.FC<ReceiptDotsLayerProps> = ({ date, className = "" }) => {
  const { receiptDots } = useReceiptDots();

  const dayReceipts = receiptDots.find(dot => dot.date === date);

  if (!dayReceipts || dayReceipts.count === 0) {
    return null;
  }

  return (
    <div className={`absolute top-1 right-1 ${className}`}>
      <div className="w-2 h-2 bg-pink-500 rounded-full flex items-center justify-center">
        {dayReceipts.count > 1 && (
          <span className="text-xs text-white font-bold">
            {dayReceipts.count}
          </span>
        )}
      </div>
    </div>
  );
};