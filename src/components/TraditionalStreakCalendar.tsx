import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, CalendarIcon } from 'lucide-react';
import { useReceiptDots } from '@/hooks/useReceiptDots';
import { useWeekCompletion } from '@/hooks/useWeekCompletion';
import { ReceiptDotsLayer } from '@/components/ReceiptDotsLayer';
import { format, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, getWeek, isToday } from 'date-fns';

const TraditionalStreakCalendar: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { receiptDots, loading: dotsLoading } = useReceiptDots();
  const { weekCompletions, loading: weekLoading } = useWeekCompletion();
  const [showDetails, setShowDetails] = useState(false);

  // Get current week
  const currentWeek = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }); // Sunday
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    return { start: weekStart, end: weekEnd };
  }, []);

  // Get month days
  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Check if day is in current week
  const isInCurrentWeek = (date: Date) => {
    return date >= currentWeek.start && date <= currentWeek.end;
  };

  // Check if week is complete
  const isWeekComplete = (date: Date) => {
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekStartStr = weekStart.toISOString().split('T')[0];
    
    const weekData = weekCompletions.find(w => w.weekStart === weekStartStr);
    return weekData?.isComplete || false;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
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
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-lg font-semibold">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-sm font-medium text-muted-foreground">
              <div>Su</div>
              <div>Mo</div>
              <div>Tu</div>
              <div>We</div>
              <div>Th</div>
              <div>Fr</div>
              <div>Sa</div>
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day, index) => {
                const dateStr = day.toISOString().split('T')[0];
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const inCurrentWeek = isInCurrentWeek(day);
                const weekComplete = isWeekComplete(day);
                
                return (
                  <div
                    key={index}
                    className={`
                      relative h-10 flex items-center justify-center text-sm
                      ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}
                      ${inCurrentWeek ? 'bg-blue-100 dark:bg-blue-900/30 rounded' : ''}
                      ${isToday(day) ? 'bg-primary text-primary-foreground rounded font-semibold' : ''}
                      ${weekComplete && !isToday(day) ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded' : ''}
                    `}
                  >
                    {day.getDate()}
                    
                    {/* Receipt Dots */}
                    {isCurrentMonth && (
                      <ReceiptDotsLayer 
                        date={dateStr} 
                        receiptDots={receiptDots} 
                        className="pointer-events-none" 
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* This Week Indicator */}
          {currentMonth.getMonth() === new Date().getMonth() && (
            <div className="flex justify-center">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 border-blue-200">
                This Week
              </Badge>
            </div>
          )}

          {/* Show Streak Details Button */}
          <div className="flex justify-center">
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(!showDetails)}
              className="w-full max-w-xs"
            >
              {showDetails ? 'Hide' : 'Show'} Streak Details
            </Button>
          </div>

          {/* Legend */}
          <div className="bg-muted/20 rounded-lg p-3">
            <h4 className="text-sm font-medium mb-2">Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Receipt uploaded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 dark:bg-green-900/30 border border-green-200 rounded"></div>
                <span>Week completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 rounded"></div>
                <span>Current week</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary text-primary-foreground rounded text-center leading-none">•</div>
                <span>Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TraditionalStreakCalendar;