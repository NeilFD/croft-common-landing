import React from 'react';
import { Check } from 'lucide-react';
import { useWeekCompletion } from '@/hooks/useWeekCompletion';

interface WeekCompletionLayerProps {
  weekStart: string;
  className?: string;
}

export const WeekCompletionLayer: React.FC<WeekCompletionLayerProps> = ({ weekStart, className = "" }) => {
  const { weekCompletions } = useWeekCompletion();

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