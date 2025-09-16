import React from 'react';
import { AlertCircle, LifeBuoy, Target, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MissedWeekAlertProps {
  missedWeeks: Array<{
    week_start: string;
    week_end: string;
    receipts_count: number;
  }>;
  graceWeeksAvailable: number;
  makeupOpportunityAvailable: boolean;
  onSaveStreak: (missedWeek: any) => void;
}

export const MissedWeekAlert: React.FC<MissedWeekAlertProps> = ({
  missedWeeks,
  graceWeeksAvailable,
  makeupOpportunityAvailable,
  onSaveStreak,
}) => {
  if (missedWeeks.length === 0) return null;

  const formatWeekRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`;
  };

  const hasRecoveryOptions = graceWeeksAvailable > 0 || makeupOpportunityAvailable;

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
      <AlertCircle className="h-4 w-4 text-orange-600" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-orange-800 dark:text-orange-200 mb-1">
              {missedWeeks.length > 1 ? 'Weeks Missed' : 'Week Missed'}
            </div>
            <div className="text-sm text-orange-700 dark:text-orange-300">
              {missedWeeks.length > 1 ? 'Multiple weeks' : 'One week'} in your streak {missedWeeks.length > 1 ? 'were' : 'was'} incomplete
            </div>
          </div>

          {/* Show most recent missed week */}
          <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-3 space-y-2">
            {missedWeeks.slice(0, 2).map((week, index) => (
              <div key={week.week_start} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {formatWeekRange(week.week_start, week.week_end)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {week.receipts_count} receipt{week.receipts_count !== 1 ? 's' : ''} uploaded
                  </div>
                </div>
                
                {hasRecoveryOptions && index === 0 && (
                  <Button
                    onClick={() => onSaveStreak(week)}
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <LifeBuoy className="h-3 w-3 mr-1" />
                    Save Streak
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            ))}
            
            {missedWeeks.length > 2 && (
              <div className="text-xs text-muted-foreground border-t pt-2">
                +{missedWeeks.length - 2} more missed week{missedWeeks.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Recovery options summary */}
          {hasRecoveryOptions && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-orange-700 dark:text-orange-300">Recovery options:</span>
              {graceWeeksAvailable > 0 && (
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  {graceWeeksAvailable} grace week{graceWeeksAvailable !== 1 ? 's' : ''}
                </Badge>
              )}
              {makeupOpportunityAvailable && (
                <Badge variant="outline" className="text-orange-700 border-orange-300">
                  <Target className="h-3 w-3 mr-1" />
                  Triple challenge
                </Badge>
              )}
            </div>
          )}

          {!hasRecoveryOptions && (
            <div className="text-sm text-orange-700 dark:text-orange-300">
              No recovery options available. Start fresh with your next visit!
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};