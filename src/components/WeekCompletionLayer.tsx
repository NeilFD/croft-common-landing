import React from 'react';
import { Check } from 'lucide-react';

interface WeekCompletion {
  weekStart: string;
  weekEnd: string;
  receiptCount: number;
  isComplete: boolean;
  isCurrent: boolean;
  totalAmount: number;
}

interface WeekCompletionLayerProps {
  weekStart: string;
  weekCompletions: WeekCompletion[];
  className?: string;
}

export const WeekCompletionLayer: React.FC<WeekCompletionLayerProps> = ({ weekStart, weekCompletions, className = "" }) => {

  const week = weekCompletions.find(w => w.weekStart === weekStart);

  if (!week || !week.isComplete) {
    return null;
  }

  return (
    <div className={`absolute bottom-1 left-1 ${className}`}>
      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
        <Check size={10} className="text-white" />
      </div>
    </div>
  );
};