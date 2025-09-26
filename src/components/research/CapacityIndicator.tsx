import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CapacityIndicatorProps {
  currentCount: number;
  maxCapacity?: number | null;
  capacityPercentage?: number | null;
  showDetails?: boolean;
}

export const CapacityIndicator: React.FC<CapacityIndicatorProps> = ({
  currentCount,
  maxCapacity,
  capacityPercentage,
  showDetails = true
}) => {
  // Use calculated percentage if available, otherwise calculate from current values
  const percentage = capacityPercentage ?? (maxCapacity && maxCapacity > 0 
    ? Math.min((currentCount / maxCapacity) * 100, 100) 
    : null);

  if (!percentage && !maxCapacity) {
    return showDetails ? (
      <div className="text-sm text-muted-foreground">
        {currentCount} people • No capacity set
      </div>
    ) : null;
  }

  const getCapacityColor = (pct: number) => {
    if (pct >= 90) return 'destructive';
    if (pct >= 70) return 'default';
    return 'secondary';
  };

  const getProgressColor = (pct: number) => {
    if (pct >= 90) return 'bg-destructive';
    if (pct >= 70) return 'bg-yellow-500';
    return 'bg-primary';
  };

  return (
    <div className="space-y-2">
      {showDetails && (
        <div className="flex items-center justify-between text-sm">
          <span>{currentCount} people</span>
          {maxCapacity && (
            <Badge variant={getCapacityColor(percentage || 0)}>
              {Math.round(percentage || 0)}% capacity
            </Badge>
          )}
        </div>
      )}
      
      {maxCapacity && percentage !== null && (
        <Progress 
          value={percentage} 
          className="h-2"
        />
      )}
      
      {maxCapacity && showDetails && (
        <div className="text-xs text-muted-foreground">
          Max: {maxCapacity} people
        </div>
      )}
    </div>
  );
};