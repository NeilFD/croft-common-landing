import React from 'react';

interface ReceiptDot {
  date: string;
  count: number;
  amount: number;
}

interface ReceiptDotsLayerProps {
  date: string;
  receiptDots: ReceiptDot[];
  className?: string;
}

export const ReceiptDotsLayer: React.FC<ReceiptDotsLayerProps> = ({ date, receiptDots, className = "" }) => {
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