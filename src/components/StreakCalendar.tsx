import React from 'react';
import { Calendar, CheckCircle, Circle, Clock, Target, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';

const StreakCalendar: React.FC = () => {
  const { dashboardData, loading } = useStreakDashboard();

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

  if (!dashboardData) {
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

  const { current_week, current_set, calendar_weeks, rewards } = dashboardData;

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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  // Group weeks into 4-week sets for visual grouping
  const weekSets = [];
  for (let i = 0; i < calendar_weeks.length; i += 4) {
    weekSets.push(calendar_weeks.slice(i, i + 4));
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Weekly Streak Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Week Progress */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">This Week's Progress</h3>
            <Badge variant={current_week.is_complete ? 'default' : 'secondary'}>
              {current_week.receipts_count}/2 Receipts
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground mb-3">
            {formatDate(current_week.week_start)} - {formatDate(current_week.week_end)}
          </div>
          <Progress 
            value={(current_week.receipts_count / 2) * 100} 
            className="h-2"
          />
          {current_week.receipts_needed > 0 && (
            <p className="text-sm text-muted-foreground mt-2">
              {current_week.receipts_needed} more receipt{current_week.receipts_needed > 1 ? 's' : ''} needed to complete this week
            </p>
          )}
        </div>

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
          {weekSets.map((setWeeks, setIndex) => (
            <div key={setIndex} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">
                Weeks {setIndex * 4 + 1}-{Math.min((setIndex + 1) * 4, calendar_weeks.length)}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {setWeeks.map((week, weekIndex) => (
                  <Card 
                    key={`${setIndex}-${weekIndex}`}
                    className={`p-3 transition-all hover:shadow-md ${
                      week.is_current 
                        ? 'ring-2 ring-primary shadow-md' 
                        : week.is_complete 
                        ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                        : week.is_future 
                        ? 'bg-muted/30'
                        : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      {getWeekIcon(week)}
                      <Badge 
                        variant={week.is_complete ? 'default' : week.is_current ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {getWeekStatus(week)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(week.week_start)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      to {formatDate(week.week_end)}
                    </div>
                    {week.completed_at && (
                      <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                        ✓ Completed
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-green-500" />
            Complete (2+ receipts)
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-yellow-500" />
            Current week
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-red-500" />
            Incomplete
          </div>
          <div className="flex items-center gap-1">
            <Circle className="h-3 w-3 text-muted-foreground" />
            Future weeks
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreakCalendar;