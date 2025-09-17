import React from 'react';
import { AlertTriangle, Clock, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StreakEmergencyBannerProps {
  currentWeek: {
    receipts_count: number;
    receipts_needed: number;
    week_start: string;
    week_end: string;
  };
  daysLeft: number;
  onUploadReceipt?: () => void;
}

export const StreakEmergencyBanner: React.FC<StreakEmergencyBannerProps> = ({
  currentWeek,
  daysLeft,
  onUploadReceipt,
}) => {
  const receiptsNeeded = currentWeek.receipts_needed - currentWeek.receipts_count;
  
  if (receiptsNeeded <= 0) return null;

  const urgencyLevel = daysLeft <= 1 ? 'critical' : daysLeft <= 3 ? 'warning' : 'info';
  
  const getUrgencyStyles = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
      case 'warning':
        return 'border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800';
      default:
        return 'border-border bg-background';
    }
  };

  const getUrgencyIcon = () => {
    switch (urgencyLevel) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return <Clock className="h-4 w-4 text-accent-pink" />;
    }
  };

  const getUrgencyText = () => {
    switch (urgencyLevel) {
      case 'critical':
        return 'Critical: Your streak is at risk!';
      case 'warning':
        return 'Warning: Don\'t lose your streak!';
      default:
        return 'Keep your streak going!';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <Alert className={`${getUrgencyStyles()} border-l-4`}>
      {getUrgencyIcon()}
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold mb-1">
              {getUrgencyText()}
            </div>
            <div className="text-sm">
              You need <strong>{receiptsNeeded} more receipt{receiptsNeeded > 1 ? 's' : ''}</strong> before{' '}
              <strong>{formatDate(currentWeek.week_end)}</strong> to complete this week.
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={urgencyLevel === 'critical' ? 'destructive' : 'secondary'}>
                <Clock className="h-3 w-3 mr-1" />
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
              </Badge>
              <Badge variant="outline">
                {currentWeek.receipts_count}/{currentWeek.receipts_needed} receipts
              </Badge>
            </div>
          </div>
          
          {onUploadReceipt && (
            <div className="ml-4">
              <Button 
                onClick={onUploadReceipt} 
                size="sm"
                variant={urgencyLevel === 'critical' ? 'destructive' : 'default'}
              >
                <Camera className="h-4 w-4 mr-2" />
                Upload Receipt
              </Button>
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};