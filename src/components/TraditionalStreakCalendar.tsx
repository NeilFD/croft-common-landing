import React, { useState, useMemo } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Target, Dot, Gift, Trophy, Star, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';
import { useWeekCompletion } from '@/hooks/useWeekCompletion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { StreakEmergencyBanner } from '@/components/StreakEmergencyBanner';
import { MissedWeekAlert } from '@/components/MissedWeekAlert';
import { StreakSaveModal } from '@/components/StreakSaveModal';

// Component to render the streak reward sections
const StreakRewardsSections: React.FC<{ dashboardData: any }> = ({ dashboardData }) => {
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();
  const { claimReward, refetch } = useStreakDashboard();
  
  const { rewards, statistics } = dashboardData;
  const hasActiveRewards = rewards.active_rewards.length > 0;

  const handleClaimReward = async () => {
    if (!rewards.active_rewards.length) return;

    try {
      setClaiming(true);
      const result = await claimReward();
      
      toast({
        title: "🎉 Reward Claimed!",
        description: `You've claimed your ${result.claimed_reward.discount_percentage}% discount! Your streak has been reset.`,
      });

      await refetch();
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: "Error",
        description: "Failed to claim reward. Please try again.",
        variant: "destructive",
      });
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-4">
      {/* Available Rewards Section */}
      <div className="border border-border rounded-lg p-4 bg-background">
        <h3 className="flex items-center gap-2 font-semibold mb-3">
          <Gift className="h-4 w-4" />
          Available Rewards
        </h3>
        {hasActiveRewards ? (
          <div className="space-y-3">
            <div className="text-center p-4 bg-white dark:bg-gray-900 rounded-lg border border-border">
              <div className="text-2xl font-bold text-foreground mb-1">
                {rewards.available_discount}%
              </div>
              <div className="text-sm font-semibold text-foreground mb-2">
                Total Discount Available
              </div>
              <div className="text-xs text-muted-foreground mb-3">
                Up to 4 people dining in The Kitchens
              </div>
              
              <Button 
                onClick={handleClaimReward}
                disabled={claiming}
                size="sm"
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                {claiming ? (
                  <>
                    <Clock className="h-3 w-3 mr-2 animate-spin" />
                    Claiming...
                  </>
                ) : (
                  <>
                    <Gift className="h-3 w-3 mr-2" />
                    Claim {rewards.available_discount}% Discount
                  </>
                )}
              </Button>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Claiming your reward will reset your streak progress.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium text-xs text-muted-foreground">Earned Rewards</h4>
              {rewards.active_rewards.map((reward: any) => (
                <div key={reward.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {reward.tier}
                    </div>
                    <div>
                      <div className="font-medium">{reward.discount_percentage}% Discount</div>
                      <div className="text-xs text-muted-foreground">
                        Earned {formatDate(reward.earned_date)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="text-xs">
                      Set #{reward.tier}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-2">
              Complete your first 4-week streak to earn your first 25% discount!
            </p>
            {rewards.next_reward_at && (
              <Badge variant="outline" className="text-xs">
                Next reward: {rewards.next_reward_at}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Reward History & Progress */}
      <div className="border border-border rounded-lg p-4 bg-background">
        <h3 className="flex items-center gap-2 font-semibold mb-3">
          <Trophy className="h-4 w-4" />
          Reward History & Progress
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-primary mb-1">
              {statistics.total_rewards_earned}
            </div>
            <div className="text-xs text-muted-foreground">
              Rewards Earned
            </div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-primary mb-1">
              {statistics.total_rewards_claimed}
            </div>
            <div className="text-xs text-muted-foreground">
              Rewards Claimed
            </div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-primary mb-1">
              {statistics.total_sets_completed}
            </div>
            <div className="text-xs text-muted-foreground">
              4-Week Sets
            </div>
          </div>
          
          <div className="text-center p-2 bg-muted/50 rounded-lg">
            <div className="text-lg font-bold text-primary mb-1">
              {statistics.total_weeks_completed}
            </div>
            <div className="text-xs text-muted-foreground">
              Weeks Completed
            </div>
          </div>
        </div>
      </div>

      {/* How Rewards Work */}
      <div className="border border-border rounded-lg p-4 bg-background">
        <h3 className="flex items-center gap-2 font-semibold mb-3">
          <Star className="h-4 w-4" />
          How Streak Rewards Work
        </h3>
        <div className="space-y-3 text-xs">
          <div className="flex items-start gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <div className="font-medium">Complete 4-Week Sets</div>
              <div className="text-muted-foreground">
                Get 2+ receipts per week for 4 consecutive weeks
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <div className="font-medium">Accumulative Discounts</div>
              <div className="text-muted-foreground">
                1st set = 25%, 2nd set = 50%, 3rd set = 75%, 4th set = 100%
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <div className="font-medium">Claim & Reset</div>
              <div className="text-muted-foreground">
                Use your discount anytime, but claiming resets progress
              </div>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <div className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
              4
            </div>
            <div>
              <div className="font-medium">Grace Weeks & Makeup</div>
              <div className="text-muted-foreground">
                Earn grace weeks every 16 weeks, or make up missed weeks with 3 receipts
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TraditionalStreakCalendar: React.FC = () => {
  const { dashboardData, loading, refetch } = useStreakDashboard();
  const { weekCompletions } = useWeekCompletion();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedMissedWeek, setSelectedMissedWeek] = useState<any>(null);
  const { toast } = useToast();

  // Current week data
  const currentWeek = useMemo(() => {
    if (!dashboardData?.current_week) return null;
    return dashboardData.current_week;
  }, [dashboardData]);

  // Calculate missed weeks and streak save data
  const streakSaveData = useMemo(() => {
    if (!weekCompletions || !dashboardData) {
      return {
        missedWeeks: [],
        isCurrentWeekAtRisk: false,
        graceWeeksAvailable: 0,
        makeupOpportunity: null
      };
    }

    // Find incomplete weeks that are in the past
    const today = new Date();
    const missedWeeks = weekCompletions.filter(week => {
      const weekEnd = new Date(week.weekEnd);
      return !week.isComplete && weekEnd < today;
    }).slice(-3); // Show last 3 missed weeks

    // Check if current week is at risk (Sunday-Wednesday with no receipts)
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const isCurrentWeekAtRisk = currentWeek && !currentWeek.is_complete && 
                               dayOfWeek >= 0 && dayOfWeek <= 3 && 
                               currentWeek.receipts_count === 0;

    // Grace weeks available - always show at least 1 if there are missed weeks
    const graceWeeksAvailable = missedWeeks.length > 0 ? 
      Math.max(1, dashboardData.opportunities?.grace_weeks_available || 0) : 0;

    // Makeup opportunity - always available for missed weeks
    const makeupOpportunity = missedWeeks.length > 0 ? {
      broken_week: missedWeeks[0]?.weekStart || '',
      receipts_needed: 3,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
    } : null;

    return {
      missedWeeks,
      isCurrentWeekAtRisk,
      graceWeeksAvailable,
      makeupOpportunity
    };
  }, [weekCompletions, dashboardData, currentWeek]);

  // Handlers for streak save actions
  const handleSaveStreak = (missedWeek?: any) => {
    if (missedWeek) {
      setSelectedMissedWeek(missedWeek);
    }
    setSaveModalOpen(true);
  };

  const handleRequestGrace = async () => {
    // Simulate grace week application
    toast({
      title: "🛡️ Grace Week Applied!",
      description: "Your streak has been saved using a grace week.",
    });
    await refetch();
  };

  const handleTripleChallenge = () => {
    toast({
      title: "🎯 Challenge Started!",
      description: "Get 3 receipts this week to save your streak!",
    });
  };

  const handleUploadReceipt = () => {
    toast({
      title: "📱 Upload Receipt",
      description: "Opening receipt upload interface...",
    });
  };

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

  // DEBUG: Log the recent activity data
  console.log('🔍 TRADITIONAL CALENDAR: recent_activity data:', recent_activity);
  console.log('🔍 TRADITIONAL CALENDAR: recent_activity length:', recent_activity?.length || 0);
  if (recent_activity?.length > 0) {
    console.log('🔍 TRADITIONAL CALENDAR: First activity:', recent_activity[0]);
    console.log('🔍 TRADITIONAL CALENDAR: All activity dates:', recent_activity.map((a: any) => a.date));
  }

  // Create a map of receipt dates for easier lookup
  const receiptDates = new Set(
    recent_activity?.map((activity: any) => activity.date) || []
  );

  // DEBUG: Log the receipt dates set
  console.log('🔍 TRADITIONAL CALENDAR: receiptDates Set:', Array.from(receiptDates));
  console.log('🔍 TRADITIONAL CALENDAR: Looking for 2025-08-27:', receiptDates.has('2025-08-27'));
  console.log('🔍 TRADITIONAL CALENDAR: Has any August dates:', Array.from(receiptDates).filter(d => d.includes('2025-08')));

  // Create week completion map from calendar_weeks
  const weekCompletionsMap = new Map();
  calendar_weeks.forEach((week: any) => {
    const weekEnd = new Date(week.week_end);
    weekCompletionsMap.set(weekEnd.toISOString().split('T')[0], week.is_complete);
  });

  // Custom day renderer for calendar
  const dayRenderer = (day: Date) => {
    // Use local timezone formatting instead of UTC to avoid date shifting
    const dateStr = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    const hasReceipt = receiptDates.has(dateStr);
    const isToday = day.toDateString() === new Date().toDateString();
    
    // DEBUG: Log specific dates we're checking
    if (dateStr === '2025-08-27' || dateStr.includes('2025-08-2')) {
      console.log(`🔍 DAY RENDERER: Checking ${dateStr}:`, {
        hasReceipt,
        isInSet: receiptDates.has(dateStr),
        allDatesInSet: Array.from(receiptDates),
        originalDay: day,
        localDateStr: dateStr
      });
    }
    
    // Check if this day is at the end of a completed week (Sunday)
    const isWeekEnd = day.getDay() === 0; // Sunday
    const isWeekComplete = weekCompletionsMap.get(dateStr);

    return (
      <div className="relative w-full h-full flex items-center justify-center">
        <span className={cn(
          "text-sm",
          isToday && "font-bold"
        )}>
          {day.getDate()}
        </span>
        {hasReceipt && (
          <div 
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center animate-pulse"
            style={{
              backgroundColor: '#ef4444',
              border: '3px solid #facc15',
              boxShadow: '0 0 15px rgba(239, 68, 68, 0.9)',
              zIndex: 20
            }}
          >
            <span className="text-white text-xs font-bold">●</span>
          </div>
        )}
        {isWeekEnd && isWeekComplete && (
          <CheckCircle className="absolute -bottom-1 -right-1 h-3 w-3 text-green-500" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Emergency Banner for current week at risk */}
      {streakSaveData.isCurrentWeekAtRisk && (
        <StreakEmergencyBanner
          currentWeek={currentWeek}
          daysLeft={7 - new Date().getDay()}
          onUploadReceipt={handleUploadReceipt}
        />
      )}

      {/* Missed Week Alert */}
      {streakSaveData.missedWeeks.length > 0 && (
        <MissedWeekAlert
          missedWeeks={streakSaveData.missedWeeks.map(week => ({
            week_start: week.weekStart,
            week_end: week.weekEnd,
            receipts_count: week.receiptCount
          }))}
          graceWeeksAvailable={streakSaveData.graceWeeksAvailable}
          makeupOpportunityAvailable={!!streakSaveData.makeupOpportunity}
          onSaveStreak={() => handleSaveStreak(streakSaveData.missedWeeks[0])}
        />
      )}

      {/* Streak Save Modal */}
      <StreakSaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        missedWeek={selectedMissedWeek ? {
          week_start: selectedMissedWeek.weekStart,
          week_end: selectedMissedWeek.weekEnd,
          receipts_count: selectedMissedWeek.receiptCount
        } : undefined}
        graceWeeksAvailable={streakSaveData.graceWeeksAvailable}
        makeupOpportunity={streakSaveData.makeupOpportunity}
        onRequestGrace={handleRequestGrace}
        onStartTripleChallenge={handleTripleChallenge}
      />

      <Card className="w-full bg-background border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Week Summary */}
          <div className={cn(
            "p-3 rounded-lg border-2 transition-all",
            current_week.is_complete 
              ? "bg-white border-green-400 shadow-md" 
              : "bg-white border-pink-200"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">This Week</span>
                {current_week.is_complete && (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              <Badge variant={current_week.is_complete ? 'default' : 'secondary'}>
                {current_week.receipts_count}/2
              </Badge>
            </div>
            {current_week.is_complete && (
              <div className="mt-2 text-xs text-green-700 font-medium">
                Week completed. Great work. See you next week
              </div>
            )}
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
                <div className="bg-white border-2 border-pink-200 p-3 rounded-lg">
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
              
              {/* Reward Sections moved from StreakRewardsDashboard */}
              <StreakRewardsSections dashboardData={dashboardData} />
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </div>
  );
};

export default TraditionalStreakCalendar;