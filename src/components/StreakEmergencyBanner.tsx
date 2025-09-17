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
        return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
    }
  };

  const getUrgencyIcon = () => {
    switch (urgencyLevel) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-accent-pink" />;
      case 'warning':
        return <Clock className="h-4 w-4 text-accent-pink" />;
      default:
        return <Clock className="h-4 w-4 text-primary" />;
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
    <Alert className="bg-background border-2 border-primary">
      {getUrgencyIcon()}
      <AlertDescription>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="font-semibold mb-1 text-primary">
              {getUrgencyText()}
            </div>
            <div className="text-sm text-foreground">
              You need <strong>{receiptsNeeded} more receipt{receiptsNeeded > 1 ? 's' : ''}</strong> before{' '}
              <strong>{formatDate(currentWeek.week_end)}</strong> to complete this week.
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={urgencyLevel === 'critical' ? 'destructive' : 'secondary'} className="border-primary">
                <Clock className="h-3 w-3 mr-1" />
                {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
              </Badge>
              <Badge variant="outline" className="border-primary">
                {currentWeek.receipts_count}/{currentWeek.receipts_needed} receipts
              </Badge>
            </div>
          </div>
          
          {onUploadReceipt && (
            <div className="ml-4">
              <Button 
                onClick={onUploadReceipt} 
                size="sm"
                className="bg-accent-pink hover:bg-accent-pink-dark text-white border-2 border-primary"
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