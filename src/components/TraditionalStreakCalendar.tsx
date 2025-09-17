import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Upload } from 'lucide-react';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';
import { useWeekCompletion } from '@/hooks/useWeekCompletion';
import { MissedWeekAlert } from './MissedWeekAlert';
import { StreakEmergencyBanner } from './StreakEmergencyBanner';
import { StreakSaveModal } from './StreakSaveModal';
import { WeekCompletionLayer } from './WeekCompletionLayer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const TraditionalStreakCalendar: React.FC = () => {
  const { dashboardData, loading: dashboardLoading } = useStreakDashboard();
  const { weekCompletions, loading: weekLoading } = useWeekCompletion();
  const [showStreakSaveModal, setShowStreakSaveModal] = useState(false);
  const [selectedMissedWeek, setSelectedMissedWeek] = useState<any>(null);

  const loading = dashboardLoading || weekLoading;

  // Calculate streak save data
  const streakSaveData = React.useMemo(() => {
    if (!dashboardData) return null;

    const currentWeek = dashboardData.current_week;
    const incompleteWeeks = dashboardData.calendar_weeks?.filter(week => 
      !week.is_complete && !week.is_current && !week.is_future
    ) || [];

    const hasIncompleteWeeks = incompleteWeeks.length > 0;
    const isCurrentWeekAtRisk = currentWeek && !currentWeek.is_complete && 
      currentWeek.receipts_count < currentWeek.receipts_needed;

    return {
      hasIncompleteWeeks,
      isCurrentWeekAtRisk,
      incompleteWeeks,
      currentWeek,
      graceWeeksAvailable: dashboardData.opportunities?.grace_weeks_available || 0,
      makeupOpportunity: dashboardData.opportunities?.makeup_available ? dashboardData.opportunities.makeup_details : null
    };
  }, [dashboardData]);

  const handleSaveStreak = (missedWeek: any) => {
    setSelectedMissedWeek(missedWeek);
    setShowStreakSaveModal(true);
  };

  const handleRequestGrace = async () => {
    try {
      await supabase.functions.invoke('apply-grace-week', {
        body: { 
          week_start: selectedMissedWeek?.week_start,
          week_end: selectedMissedWeek?.week_end 
        }
      });
      toast.success('Grace week applied successfully!');
    } catch (error) {
      toast.error('Failed to apply grace week');
      throw error;
    }
  };

  const handleStartTripleChallenge = () => {
    toast.info('Triple challenge started! Upload 3 receipts this week to save your streak.');
  };

  const handleUploadReceipt = () => {
    // Navigate to receipt upload or trigger upload modal
    toast.info('Upload receipt functionality would be triggered here');
  };

  const calculateDaysLeft = (weekEnd: string) => {
    const endDate = new Date(weekEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

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

  return (
    <div className="space-y-4">
      {/* Emergency Banner for Current Week */}
      {streakSaveData?.isCurrentWeekAtRisk && streakSaveData.currentWeek && (
        <StreakEmergencyBanner
          currentWeek={streakSaveData.currentWeek}
          daysLeft={calculateDaysLeft(streakSaveData.currentWeek.week_end)}
          onUploadReceipt={handleUploadReceipt}
        />
      )}

      {/* Missed Week Alert */}
      {streakSaveData?.hasIncompleteWeeks && (
        <MissedWeekAlert
          missedWeeks={streakSaveData.incompleteWeeks}
          graceWeeksAvailable={streakSaveData.graceWeeksAvailable}
          makeupOpportunityAvailable={!!streakSaveData.makeupOpportunity}
          onSaveStreak={handleSaveStreak}
        />
      )}

      {/* Main Streak Calendar */}
      <Card className="w-full bg-background border border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Streak Calendar
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Current Week Progress */}
          {dashboardData?.current_week && (
            <div className="mb-6 p-4 bg-background border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-foreground">Current Week Progress</h3>
                <span className="text-xs text-muted-foreground">
                  {dashboardData.current_week.receipts_count} / {dashboardData.current_week.receipts_needed} receipts
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-accent-pink h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(dashboardData.current_week.receipts_count / dashboardData.current_week.receipts_needed) * 100}%` 
                  }}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(dashboardData.current_week.week_start).toLocaleDateString()} - {new Date(dashboardData.current_week.week_end).toLocaleDateString()}
                </span>
                {dashboardData.current_week.is_complete && (
                  <span className="text-xs text-accent-pink font-medium">Complete!</span>
                )}
              </div>
            </div>
          )}

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
              <div key={day} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {dashboardData?.calendar_weeks?.map((week, index) => (
              <div key={week.week_start} className="relative">
                <div className={`
                  p-3 border rounded text-center text-xs cursor-pointer transition-all duration-200
                  ${week.is_complete ? 'bg-accent-pink/10 border-accent-pink text-accent-pink' : 
                    week.is_current ? 'bg-background border-border text-foreground ring-2 ring-accent-pink' :
                    week.is_future ? 'bg-muted/50 border-muted text-muted-foreground' :
                    'bg-background border-border text-muted-foreground'
                  }
                `}>
                  <div className="font-medium">
                    {new Date(week.week_start).getDate()}-{new Date(week.week_end).getDate()}
                  </div>
                  <div className="text-[10px] mt-1">
                    {week.receipts_count || 0} receipts
                  </div>
                </div>
                
                {/* Week completion overlay */}
                <WeekCompletionLayer
                  weekStart={week.week_start}
                  weekCompletions={weekCompletions}
                  className="text-white"
                />
              </div>
            ))}
          </div>

          {/* Upload Receipt Button */}
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={handleUploadReceipt}
              className="bg-accent-pink hover:bg-accent-pink/90 text-white"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Receipt
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Streak Save Modal */}
      <StreakSaveModal
        isOpen={showStreakSaveModal}
        onClose={() => setShowStreakSaveModal(false)}
        missedWeek={selectedMissedWeek}
        graceWeeksAvailable={streakSaveData?.graceWeeksAvailable || 0}
        makeupOpportunity={streakSaveData?.makeupOpportunity}
        onRequestGrace={handleRequestGrace}
        onStartTripleChallenge={handleStartTripleChallenge}
      />
    </div>
  );
};

export default TraditionalStreakCalendar;