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
    <Alert className="bg-background border-2 border-black hover:border-pink-500 transition-all duration-300">
      <AlertCircle className="h-4 w-4 text-primary" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-primary mb-1">
              {missedWeeks.length > 1 ? 'Weeks Missed' : 'Week Missed'}
            </div>
            <div className="text-sm text-foreground">
              {missedWeeks.length > 1 ? 'Multiple weeks' : 'One week'} in your streak {missedWeeks.length > 1 ? 'were' : 'was'} incomplete
            </div>
          </div>

          {/* Show most recent missed week */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            {missedWeeks.slice(0, 2).map((week, index) => (
              <div key={week.week_start} className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-foreground">
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
                    className="bg-pink-500 hover:bg-pink-600 text-white border-2 border-primary"
                  >
                    <LifeBuoy className="h-3 w-3 mr-1" />
                    Save Streak
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                )}
              </div>
            ))}
            
            {missedWeeks.length > 2 && (
              <div className="text-xs text-muted-foreground border-t border-primary pt-2">
                +{missedWeeks.length - 2} more missed week{missedWeeks.length - 2 !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Recovery options summary */}
          {hasRecoveryOptions && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-foreground">Recovery options:</span>
              {graceWeeksAvailable > 0 && (
                <Badge variant="outline" className="text-primary border-primary">
                  {graceWeeksAvailable} grace week{graceWeeksAvailable !== 1 ? 's' : ''}
                </Badge>
              )}
              {makeupOpportunityAvailable && (
                <Badge variant="outline" className="text-primary border-primary">
                  <Target className="h-3 w-3 mr-1" />
                  Triple challenge
                </Badge>
              )}
            </div>
          )}

          {!hasRecoveryOptions && (
            <div className="text-sm text-muted-foreground">
              No recovery options available. Start fresh with your next visit!
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};