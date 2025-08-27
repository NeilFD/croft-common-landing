import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Target, Dot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

const TraditionalStreakCalendar: React.FC = () => {
  const { dashboardData, loading } = useStreakDashboard();
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (loading) {
    return (
      <Card className="w-full bg-background border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData) {
    return (
      <Card className="w-full bg-background border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No streak data available</p>
        </CardContent>
      </Card>
    );
  }

  const { current_week, current_set, calendar_weeks, recent_activity } = dashboardData;

  // Create a map of receipt dates for easier lookup
  const receiptDates = new Set(
    recent_activity?.map((activity: any) => activity.date) || []
  );

  // Create week completion map
  const weekCompletions = new Map();
  calendar_weeks.forEach((week: any) => {
    const weekEnd = new Date(week.week_end);
    weekCompletions.set(weekEnd.toISOString().split('T')[0], week.is_complete);
  });

  // Custom day renderer for calendar
  const dayRenderer = (day: Date) => {
    const dateStr = day.toISOString().split('T')[0];
    const hasReceipt = receiptDates.has(dateStr);
    const isToday = day.toDateString() === new Date().toDateString();
    
    // Check if this day is at the end of a completed week (Sunday)
    const isWeekEnd = day.getDay() === 0; // Sunday
    const isWeekComplete = weekCompletions.get(dateStr);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={cn(
          "text-sm",
          isToday && "font-bold"
        )}>
          {day.getDate()}
        </span>
        {hasReceipt && (
          <Dot className="absolute -top-1 -right-1 h-3 w-3 text-green-500 fill-current" />
        )}
        {isWeekEnd && isWeekComplete && (
          <CheckCircle className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card className="w-full bg-background border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Week Summary */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">This Week</span>
              <Badge variant={current_week.is_complete ? 'default' : 'secondary'}>
                {current_week.receipts_count}/2
              </Badge>
            </div>
          </div>

          {/* Calendar View */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              className="rounded-md border-0 shadow-none bg-transparent"
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4 w-full",
                caption: "flex justify-center pt-1 relative items-center mb-4",
                caption_label: "text-lg font-semibold",
                table: "w-full border-collapse",
                head_row: "flex w-full",
                head_cell: "text-muted-foreground rounded-md w-10 font-normal text-sm flex-1 text-center",
                row: "flex w-full mt-1",
                cell: "h-10 w-10 text-center text-sm p-0 relative flex-1 border border-muted/30",
                day: "h-full w-full p-0 font-normal hover:bg-accent rounded-none relative",
                day_selected: "bg-primary text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-bold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
              }}
              components={{
                Day: ({ date, ...props }) => (
                  <div {...props} className="h-full w-full p-1">
                    {dayRenderer(date)}
                  </div>
                )
              }}
            />
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
            <div className="flex items-center gap-1">
              <Dot className="h-3 w-3 text-green-500 fill-current" />
              Receipt uploaded
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Week completed
            </div>
          </div>

          {/* Collapsible Details */}
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                {detailsOpen ? 'Hide' : 'Show'} Streak Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 mt-4">
              {/* Current Set Progress */}
              {current_set && (
                <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Set #{current_set.set_number}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {current_set.weeks_completed}/4
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {current_set.weeks_remaining} weeks to next reward
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
};

export default TraditionalStreakCalendar;