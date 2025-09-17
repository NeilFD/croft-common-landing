import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, CheckCircle, AlertCircle, Clock, Gift, Flame, Star, Trophy } from 'lucide-react';
import { useWeekCompletion } from '@/hooks/useWeekCompletion';
import { useReceiptDots } from '@/hooks/useReceiptDots';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';
import { ReceiptDotsLayer } from '@/components/ReceiptDotsLayer';
import { WeekCompletionLayer } from '@/components/WeekCompletionLayer';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StreakEmergencyBanner } from '@/components/StreakEmergencyBanner';
import { MissedWeekAlert } from '@/components/MissedWeekAlert';
import { StreakSaveModal } from '@/components/StreakSaveModal';

const TraditionalStreakCalendar: React.FC = () => {
  const { weekCompletions, loading: weekLoading } = useWeekCompletion();
  const { receiptDots, loading: dotsLoading } = useReceiptDots();
  const { dashboardData, loading: dashboardLoading, claimReward } = useStreakDashboard();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedMissedWeek, setSelectedMissedWeek] = useState<string | null>(null);

  const loading = weekLoading || dotsLoading || dashboardLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <Card className="w-full bg-background border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Streak Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 text-center text-muted-foreground">
              Loading streak calendar...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (weekCompletions.length === 0) {
    return (
      <div className="space-y-4">
        <Card className="w-full bg-background border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Streak Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No streak data available yet.</p>
              <p className="text-sm mt-2">Upload some receipts to start your streak!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get current week data
  const currentWeek = useMemo(() => {
    return weekCompletions.find(week => week.isCurrent);
  }, [weekCompletions]);

  // Destructure dashboard data
  const {
    current_week,
    current_set,
    rewards,
    opportunities,
    calendar_weeks = []
  } = dashboardData || {};

  // Helper functions
  const getWeekIcon = (week: any) => {
    if (week.is_future) return Clock;
    if (week.is_complete) return CheckCircle;
    if (week.is_current) return Flame;
    return AlertCircle;
  };

  const getWeekStatus = (week: any) => {
    if (week.is_future) return 'Future';
    if (week.is_complete) return 'Complete';
    if (week.is_current) return 'Current';
    return 'Incomplete';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatWeekRange = (startStr: string, endStr: string) => {
    const start = formatDate(startStr);
    const end = formatDate(endStr);
    return `${start} - ${end}`;
  };

  const generateWeekCalendar = (weekStart: string) => {
    const start = new Date(weekStart);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      const dateStr = day.toISOString().split('T')[0];
      
      days.push(
        <div 
          key={dateStr} 
          className="relative w-8 h-8 bg-muted rounded border text-xs flex items-center justify-center"
        >
          {day.getDate()}
          <ReceiptDotsLayer date={dateStr} receiptDots={receiptDots} />
        </div>
      );
    }
    
    return days;
  };

  // Streak saving logic
  const streakSaveData = useMemo(() => {
    const incompleteWeeks = weekCompletions.filter(week => 
      !week.isComplete && !week.isCurrent && new Date(week.weekStart) < new Date()
    );
    
    const currentWeekAtRisk = currentWeek && currentWeek.receiptCount < 2;
    
    return {
      hasIncompleteWeeks: incompleteWeeks.length > 0,
      incompleteWeeks,
      currentWeekAtRisk,
      graceWeeksAvailable: opportunities?.grace_weeks_available || 1,
      makeupAvailable: opportunities?.makeup_available || true,
      hasRecoveryOptions: (opportunities?.grace_weeks_available || 1) > 0 || opportunities?.makeup_available
    };
  }, [weekCompletions, currentWeek, opportunities]);

  const handleSaveStreak = (weekStart: string) => {
    setSelectedMissedWeek(weekStart);
    setModalOpen(true);
  };

  const handleRequestGrace = async () => {
    console.log('Requesting grace week...');
    setModalOpen(false);
    // Refetch data to show updated state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  const handleTripleChallenge = () => {
    console.log('Starting triple challenge...');
    setModalOpen(false);
  };

  const handleUploadReceipt = () => {
    console.log('Opening receipt upload...');
    setModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Emergency Banner for current week at risk */}
      {streakSaveData.currentWeekAtRisk && currentWeek && (
        <StreakEmergencyBanner 
          currentWeek={{
            receipts_count: currentWeek.receiptCount,
            receipts_needed: 2,
            week_start: currentWeek.weekStart,
            week_end: currentWeek.weekEnd
          }}
          daysLeft={7 - new Date().getDay()}
          onUploadReceipt={handleUploadReceipt}
        />
      )}

      {/* Alert for past incomplete weeks */}
      {streakSaveData.hasIncompleteWeeks && (
        <MissedWeekAlert
          missedWeeks={streakSaveData.incompleteWeeks.map(week => ({
            week_start: week.weekStart,
            week_end: week.weekEnd,
            receipts_count: week.receiptCount
          }))}
          graceWeeksAvailable={streakSaveData.graceWeeksAvailable}
          makeupOpportunityAvailable={streakSaveData.makeupAvailable}
          onSaveStreak={handleSaveStreak}
        />
      )}

      {/* Streak Save Modal */}
      <StreakSaveModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        missedWeek={selectedMissedWeek ? {
          week_start: selectedMissedWeek,
          week_end: streakSaveData.incompleteWeeks.find(w => w.weekStart === selectedMissedWeek)?.weekEnd || '',
          receipts_count: streakSaveData.incompleteWeeks.find(w => w.weekStart === selectedMissedWeek)?.receiptCount || 0
        } : undefined}
        graceWeeksAvailable={streakSaveData.graceWeeksAvailable}
        makeupOpportunity={streakSaveData.makeupAvailable ? {
          broken_week: selectedMissedWeek || '',
          receipts_needed: 3,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        } : undefined}
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
        <CardContent className="space-y-6">
          {/* Current Week Progress */}
          {currentWeek && (
            <div className="p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">This Week</h3>
                <Badge variant={currentWeek.isComplete ? "default" : "secondary"}>
                  {currentWeek.receiptCount}/2 receipts
                </Badge>
              </div>
              <div className="space-y-2">
                <Progress value={(currentWeek.receiptCount / 2) * 100} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {formatWeekRange(currentWeek.weekStart, currentWeek.weekEnd)}
                  {currentWeek.isComplete ? " - Complete! 🎉" : ` - ${2 - currentWeek.receiptCount} more receipt${2 - currentWeek.receiptCount !== 1 ? 's' : ''} needed`}
                </p>
              </div>
            </div>
          )}

          {/* Current Set Progress */}
          {current_set && (
            <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Set {current_set.set_number} Progress
                </h3>
                <Badge variant="outline">
                  {current_set.weeks_completed}/4 weeks
                </Badge>
              </div>
              <div className="space-y-2">
                <Progress value={current_set.progress_percentage} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {current_set.weeks_remaining} week{current_set.weeks_remaining !== 1 ? 's' : ''} remaining
                  {current_set.is_complete && " - Ready for rewards! 🏆"}
                </p>
              </div>
            </div>
          )}

          {/* Available Rewards */}
          {rewards && rewards.available_discount > 0 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-700">
                    {rewards.available_discount}% Discount Available!
                  </span>
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => claimReward()}
                >
                  Claim Reward
                </Button>
              </div>
            </div>
          )}

          {/* Weekly Calendar Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Weekly Progress</h3>
            
            {/* Group weeks into sets of 4 */}
            {Array.from({ length: Math.ceil(weekCompletions.length / 4) }, (_, setIndex) => {
              const setWeeks = weekCompletions.slice(setIndex * 4, (setIndex + 1) * 4);
              const setNumber = setIndex + 1;
              const completedWeeksInSet = setWeeks.filter(w => w.isComplete).length;
              
              return (
                <div key={setIndex} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">
                      Set {setNumber}
                    </h4>
                    <Badge variant={completedWeeksInSet === 4 ? "default" : "secondary"}>
                      {completedWeeksInSet}/4 weeks
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {setWeeks.map((week, weekIndex) => (
                      <div
                        key={week.weekStart}
                        className={`p-4 rounded-lg border transition-all duration-200 ${
                          week.isComplete 
                            ? 'bg-pink-50 border-pink-200 hover:border-pink-300' 
                            : week.isCurrent
                            ? 'bg-blue-50 border-blue-200 hover:border-blue-300'
                            : 'bg-muted/30 border-border hover:border-border/60'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Week Header */}
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              Week {setIndex * 4 + weekIndex + 1}
                            </span>
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                              week.isComplete ? 'bg-pink-500' : 
                              week.isCurrent ? 'bg-blue-500' : 'bg-muted'
                            }`}>
                              {week.isComplete && <CheckCircle className="w-3 h-3 text-white" />}
                              {week.isCurrent && <Flame className="w-3 h-3 text-white" />}
                            </div>
                          </div>

                          {/* Week Dates */}
                          <p className="text-xs text-muted-foreground">
                            {formatWeekRange(week.weekStart, week.weekEnd)}
                          </p>

                          {/* Receipt Count */}
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {week.receiptCount}/2 receipts
                            </span>
                            {week.totalAmount > 0 && (
                              <span className="text-xs text-muted-foreground">
                                £{week.totalAmount.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* Mini Calendar */}
                          <div className="grid grid-cols-7 gap-1">
                            {generateWeekCalendar(week.weekStart)}
                          </div>
                          
                          <WeekCompletionLayer 
                            weekStart={week.weekStart}
                            weekCompletions={weekCompletions}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 p-4 bg-muted/20 rounded-lg">
            <h4 className="text-sm font-medium mb-3">Legend</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span>Complete week (2+ receipts)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>Current week</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                <span>Receipt uploaded</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Week completed</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TraditionalStreakCalendar;