import React, { useState, useMemo, useCallback } from 'react';
import { Calendar as CalendarIcon, CheckCircle, Target, Dot, Gift, Trophy, Star, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { StreakSaveModal } from './StreakSaveModal';
import { StreakEmergencyBanner } from './StreakEmergencyBanner';
import { MissedWeekAlert } from './MissedWeekAlert';
import { supabase } from '@/integrations/supabase/client';

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
            <div className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {rewards.available_discount}%
              </div>
              <div className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Total Discount Available
              </div>
              <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-3">
                Up to 4 people dining in The Kitchens
              </div>
              
              <Button 
                onClick={handleClaimReward}
                disabled={claiming}
                size="sm"
                className="bg-yellow-500 hover:bg-yellow-600 text-white"
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
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [selectedMissedWeek, setSelectedMissedWeek] = useState<any>(null);
  const { toast } = useToast();

  // Move all hooks before any early returns to ensure consistent hook calls
  // Streak save logic - detect missed weeks and current week risks
  const streakSaveData = useMemo(() => {
    if (!dashboardData) return null;
    
    const { calendar_weeks, current_week, opportunities } = dashboardData;
    
    // Find any incomplete past weeks (missed opportunities)
    const missedWeeks = calendar_weeks?.filter((week: any) => 
      !week.is_current && !week.is_complete && !week.is_future && week.receipts_count < 2
    ).map((week: any) => ({
      week_start: week.week_start,
      week_end: week.week_end,
      receipts_count: week.receipts_count,
      is_complete: week.is_complete
    })) || [];

    // Current week risk assessment
    const currentWeekDaysLeft = current_week ? (() => {
      const today = new Date();
      const weekEnd = new Date(current_week.week_end);
      const diffTime = weekEnd.getTime() - today.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    })() : 0;

    // Show emergency banner if current week needs receipts and has time left
    const isCurrentWeekAtRisk = current_week && current_week.receipts_count < 2 && currentWeekDaysLeft > 0;

    return {
      missedWeeks,
      isCurrentWeekAtRisk,
      currentWeekDaysLeft,
      graceWeeksAvailable: opportunities?.grace_weeks_available || 0,
      makeupOpportunity: opportunities?.makeup_available ? opportunities.makeup_details : {
        receipts_needed: 3,
        deadline: current_week?.week_end,
        broken_week: missedWeeks[0]?.week_start
      },
    };
  }, [dashboardData]);

  // Handlers for streak save actions
  const handleSaveStreak = useCallback((missedWeek: any) => {
    setSelectedMissedWeek(missedWeek);
    setSaveModalOpen(true);
  }, []);

  const handleRequestGrace = useCallback(async () => {
    if (!selectedMissedWeek) {
      toast({
        title: "Error",
        description: "No missed week selected.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('apply-grace-week', {
        body: { missedWeekStart: selectedMissedWeek.week_start }
      });

      if (error) throw error;

      toast({
        title: "🛡️ Grace Week Applied!",
        description: "Your streak has been protected using a grace week.",
      });
      
      setSaveModalOpen(false);
      await refetch();
    } catch (error) {
      console.error('Grace week application failed:', error);
      toast({
        title: "Error",
        description: "Failed to apply grace week. Please try again.",
        variant: "destructive",
      });
    }
  }, [selectedMissedWeek, toast, refetch]);

  const handleTripleChallenge = useCallback(() => {
    // This would start tracking the triple visit challenge
    toast({
      title: "🎯 Challenge Started!",
      description: "Get 3 receipts this week to recover your missed week!",
    });
    setSaveModalOpen(false);
  }, [toast]);

  const handleUploadReceipt = useCallback(() => {
    // This would navigate to receipt upload
    toast({
      title: "📷 Upload Receipt",
      description: "Please upload your receipt to continue your streak.",
    });
  }, [toast]);

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

  const { current_week, current_set, calendar_weeks, recent_activity, opportunities } = dashboardData;

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

  // Create week completion map
  const weekCompletions = new Map();
  calendar_weeks.forEach((week: any) => {
    const weekEnd = new Date(week.week_end);
    weekCompletions.set(weekEnd.toISOString().split('T')[0], week.is_complete);
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
      {/* Streak Emergency Banner - Show when current week needs receipts */}
      {streakSaveData?.isCurrentWeekAtRisk && current_week && (
        <StreakEmergencyBanner
          currentWeek={{
            week_start: current_week.week_start,
            week_end: current_week.week_end,
            receipts_count: current_week.receipts_count,
            receipts_needed: 2
          }}
          daysLeft={streakSaveData.currentWeekDaysLeft}
          onUploadReceipt={handleUploadReceipt}
        />
      )}

      {/* Missed Week Alert - Show for any incomplete past weeks */}
      {streakSaveData?.missedWeeks && streakSaveData.missedWeeks.length > 0 && (
        <MissedWeekAlert
          missedWeeks={streakSaveData.missedWeeks}
          graceWeeksAvailable={streakSaveData.graceWeeksAvailable}
          makeupOpportunityAvailable={true}
          onSaveStreak={handleSaveStreak}
        />
      )}

      {/* Streak Save Modal */}
      <StreakSaveModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        missedWeek={selectedMissedWeek}
        graceWeeksAvailable={streakSaveData?.graceWeeksAvailable || 0}
        makeupOpportunity={streakSaveData?.makeupOpportunity}
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