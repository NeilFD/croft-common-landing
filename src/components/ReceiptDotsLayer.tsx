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
  // DEBUG: Log every render attempt
  console.log(`🔍 ReceiptDotsLayer: Checking date ${date}`);
  console.log(`🔍 ReceiptDotsLayer: Total receiptDots:`, receiptDots.length);
  console.log(`🔍 ReceiptDotsLayer: All receipt dates:`, receiptDots.map(d => d.date));

  const dayReceipts = receiptDots.find(dot => dot.date === date);
  
  // DEBUG: Log the search result
  console.log(`🔍 ReceiptDotsLayer: Found receipt for ${date}:`, dayReceipts);

  if (!dayReceipts || dayReceipts.count === 0) {
    console.log(`❌ ReceiptDotsLayer: No dot for ${date} - no receipts or count is 0`);
    return null;
  }

  // DEBUG: Log successful render
  console.log(`✅ ReceiptDotsLayer: RENDERING DOT for ${date} with count ${dayReceipts.count}`);

  return (
    <div className={`absolute top-0 right-0 z-50 ${className}`} style={{
      // Force visibility with inline styles for debugging
      position: 'absolute',
      top: '2px',
      right: '2px',
      zIndex: 9999,
    }}>
      <div 
        className="bg-red-500 border-2 border-yellow-400 rounded-full flex items-center justify-center"
        style={{
          // Make it VERY visible for debugging
          width: '20px',
          height: '20px',
          backgroundColor: '#ef4444',
          border: '2px solid #facc15',
          boxShadow: '0 0 10px rgba(239, 68, 68, 0.8)',
        }}
      >
        <span className="text-xs text-white font-bold" style={{ fontSize: '10px' }}>
          {dayReceipts.count}
        </span>
      </div>
    </div>
  );
};