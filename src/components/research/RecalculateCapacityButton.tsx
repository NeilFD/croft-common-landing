import React from 'react';
import { Button } from '@/components/ui/button';
import { Calculator, Loader } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';

interface RecalculateCapacityButtonProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const RecalculateCapacityButton: React.FC<RecalculateCapacityButtonProps> = ({ 
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const { recalculateAllCapacityPercentages, loading } = useResearch();

  return (
    <Button 
      variant={variant} 
      size={size}
      onClick={recalculateAllCapacityPercentages}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Calculator className="mr-2 h-4 w-4" />
      )}
      {loading ? 'Calculating...' : 'Recalculate Capacity %'}
    </Button>
  );
};