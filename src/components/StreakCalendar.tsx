import React, { useMemo, useCallback } from 'react';
import { Calendar, CheckCircle, Circle, Clock, Target, Gift, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';
import { useWeekCompletion } from '@/hooks/useWeekCompletion';
import { useReceiptDots } from '@/hooks/useReceiptDots';
import { ReceiptDotsLayer } from './ReceiptDotsLayer';
import { WeekCompletionLayer } from './WeekCompletionLayer';
import { StreakCalendarDebug } from './StreakCalendarDebug';

const StreakCalendar: React.FC = () => {
  const { dashboardData, loading: dashboardLoading } = useStreakDashboard();
  const { weekCompletions, loading: weekLoading } = useWeekCompletion();
  const { receiptDots, loading: receiptLoading } = useReceiptDots();

  const loading = dashboardLoading || weekLoading || receiptLoading;

  // Debug logging
  console.log('CALENDAR RENDER: Receipt dots:', receiptDots);
  console.log('CALENDAR RENDER: Week completions:', weekCompletions);

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (weekCompletions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No streak data available</p>
        </CardContent>
      </Card>
    );
  }

  // Memoized current week calculation
  const currentWeek = useMemo(() => 
    weekCompletions.find(week => week.isCurrent), 
    [weekCompletions]
  );

  // Memoized dashboard data destructuring
  const { current_week, current_set, rewards } = useMemo(() => 
    dashboardData || { current_week: null, current_set: null, rewards: { available_discount: 0 } }, 
    [dashboardData]
  );

  const getWeekIcon = (week: any) => {
    if (week.is_future) return <Circle className="h-4 w-4 text-muted-foreground" />;
    if (week.is_complete) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (week.is_current) return <Clock className="h-4 w-4 text-yellow-500" />;
    return <Circle className="h-4 w-4 text-red-500" />;
  };

  const getWeekStatus = (week: any) => {
    if (week.is_future) return 'Future';
    if (week.is_complete) return 'Complete';
    if (week.is_current) return `${week.receipts_count}/2`;
    return 'Incomplete';
  };

  // Memoized format functions to prevent re-creation
  const formatDate = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  }, []);

  const formatWeekRange = useCallback((weekStart: string, weekEnd: string) => {
    const start = new Date(weekStart);
    const end = new Date(weekEnd);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  }, []);

  // Memoized calendar generation to prevent infinite re-renders
  const generateWeekCalendar = useCallback((weekStart: string) => {
    const start = new Date(weekStart);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push(
        <div key={dateStr} className="relative h-8 w-8 border border-border rounded flex items-center justify-center text-xs">
          <span className="text-muted-foreground">{date.getDate()}</span>
          <ReceiptDotsLayer date={dateStr} receiptDots={receiptDots} />
        </div>
      );
    }
    
    return days;
  }, [receiptDots]);

  return (
    <div className="space-y-4">{/* Container for multiple cards */}
    <Card className="w-full bg-background border border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Streak Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Week Progress */}
        {currentWeek && (
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">This Week's Progress</h3>
              <Badge variant={currentWeek.isComplete ? 'default' : 'secondary'}>
                {currentWeek.receiptCount}/2 Receipts
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              {formatDate(currentWeek.weekStart)} - {formatDate(currentWeek.weekEnd)}
            </div>
            <Progress 
              value={(currentWeek.receiptCount / 2) * 100} 
              className="h-2"
            />
            {currentWeek.receiptCount < 2 && (
              <p className="text-sm text-muted-foreground mt-2">
                {2 - currentWeek.receiptCount} more receipt{2 - currentWeek.receiptCount > 1 ? 's' : ''} needed to complete this week
              </p>
            )}
          </div>
        )}

        {/* Current Set Progress */}
        {current_set && (
          <div className="bg-gradient-to-r from-secondary/10 to-secondary/5 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Target className="h-4 w-4" />
                4-Week Set #{current_set.set_number}
              </h3>
              <Badge variant="outline">
                {current_set.weeks_completed}/4 Weeks
              </Badge>
            </div>
            <Progress 
              value={current_set.progress_percentage} 
              className="h-2 mb-2"
            />
            <p className="text-sm text-muted-foreground">
              {current_set.weeks_remaining} week{current_set.weeks_remaining !== 1 ? 's' : ''} remaining to earn your next reward
            </p>
          </div>
        )}

        {/* Available Rewards */}
        {rewards.available_discount > 0 && (
          <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 dark:from-yellow-900/20 dark:to-yellow-800/10 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="h-4 w-4 text-yellow-600" />
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Reward Available!
              </h3>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You have a {rewards.available_discount}% discount ready to claim
            </p>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="space-y-6">
          {weekCompletions.length > 0 ? (
            Array.from({ length: Math.ceil(weekCompletions.length / 4) }, (_, setIndex) => {
              const setWeeks = weekCompletions.slice(setIndex * 4, (setIndex + 1) * 4);
              const completedWeeks = setWeeks.filter(week => week.isComplete).length;
              const isSetComplete = completedWeeks === 4;
              
              return (
                <div key={setIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">
                      4-Week Set {setIndex + 1}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {completedWeeks}/4 weeks
                      </span>
                      {isSetComplete && (
                        <Badge variant="default" className="text-xs">
                          <Trophy className="w-3 h-3 mr-1" />
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {setWeeks.map((week, weekIndex) => (
                      <Card 
                        key={week.weekStart}
                        className={`p-3 relative ${
                          week.isComplete ? 'bg-green-50 border-green-200' : 
                          week.isCurrent ? 'bg-blue-50 border-blue-200' : 
                          'bg-background border-border'
                        }`}
                      >
                        <WeekCompletionLayer weekStart={week.weekStart} weekCompletions={weekCompletions} />
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xl">
                              {week.isCurrent ? '🎯' : week.isComplete ? '✅' : week.receiptCount > 0 ? '📝' : '⬜'}
                            </span>
                            {week.isComplete && (
                              <Badge variant="secondary">✓</Badge>
                            )}
                          </div>
                          
                          <div>
                            <div className="text-xs font-medium">
                              Week {setIndex * 4 + weekIndex + 1}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatWeekRange(week.weekStart, week.weekEnd)}
                            </div>
                          </div>
                          
                          <div className="text-xs">
                            {week.isCurrent ? `${week.receiptCount}/2` : 
                             week.isComplete ? 'Complete' :
                             week.receiptCount > 0 ? `${week.receiptCount} visit${week.receiptCount > 1 ? 's' : ''}` : 'No visits'}
                          </div>

                          {/* Mini calendar for the week */}
                          <div className="grid grid-cols-7 gap-0.5 mt-2">
                            {generateWeekCalendar(week.weekStart)}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No calendar data available</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
            Receipt uploaded
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Week complete (2+ receipts)
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-yellow-500" />
            Current week
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-muted-foreground" />
            No visits yet
          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Debug Component - Remove this after fixing */}
    <StreakCalendarDebug />
    </div>
  );
};

export default StreakCalendar;