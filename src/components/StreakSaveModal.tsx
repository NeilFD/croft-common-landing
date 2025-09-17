import React, { useState } from 'react';
import { AlertTriangle, Clock, Target, Gift, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';

interface StreakSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  missedWeek?: {
    week_start: string;
    week_end: string;
    receipts_count: number;
  };
  graceWeeksAvailable: number;
  makeupOpportunity?: {
    broken_week: string;
    receipts_needed: number;
    deadline: string;
  };
  onRequestGrace: () => Promise<void>;
  onStartTripleChallenge: () => void;
}

export const StreakSaveModal: React.FC<StreakSaveModalProps> = ({
  isOpen,
  onClose,
  missedWeek,
  graceWeeksAvailable,
  makeupOpportunity,
  onRequestGrace,
  onStartTripleChallenge,
}) => {
  const [requesting, setRequesting] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatWeekRange = (start: string, end: string) => {
    return `${formatDate(start)} - ${formatDate(end)}`;
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleRequestGrace = async () => {
    try {
      setRequesting(true);
      await onRequestGrace();
      toast({
        title: "🛡️ Grace Week Applied!",
        description: "Your streak has been saved using a grace week.",
      });
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply grace week. Please try again.",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
    }
  };

  const handleTripleChallenge = () => {
    onStartTripleChallenge();
    toast({
      title: "🎯 Challenge Started!",
      description: "Get 3 receipts this week to save your streak!",
    });
    onClose();
  };

  if (!missedWeek) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Save Your Streak
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Missed Week Info */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Week Missed:</strong> {formatWeekRange(missedWeek.week_start, missedWeek.week_end)}
              <br />
              Only {missedWeek.receipts_count} receipt{missedWeek.receipts_count !== 1 ? 's' : ''} uploaded
            </AlertDescription>
          </Alert>

          {/* Grace Week Option */}
          {graceWeeksAvailable > 0 && (
            <div className="p-4 border-2 border-primary rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-2">
                <Gift className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-primary">
                  Use Grace Week
                </h3>
              </div>
              <p className="text-sm text-foreground mb-3">
                Apply one of your {graceWeeksAvailable} earned grace weeks to protect this streak.
              </p>
              <Button
                onClick={handleRequestGrace}
                disabled={requesting}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white border-2 border-primary"
              >
                {requesting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Gift className="h-4 w-4 mr-2" />
                    Use Grace Week
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Triple Visit Challenge */}
          {makeupOpportunity && (
            <div className="p-4 border-2 border-primary rounded-lg bg-background">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-primary">
                  Win Back Week Challenge
                </h3>
              </div>
              <p className="text-sm text-foreground mb-2">
                Get {makeupOpportunity.receipts_needed} receipts this week to recover your missed week.
              </p>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="text-primary border-primary">
                  {getDaysUntilDeadline(makeupOpportunity.deadline)} days left
                </Badge>
              </div>
              <Button
                onClick={handleTripleChallenge}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white border-2 border-primary"
              >
                <Target className="h-4 w-4 mr-2" />
                Start Challenge
              </Button>
            </div>
          )}

          {/* No Options Available */}
          {graceWeeksAvailable === 0 && !makeupOpportunity && (
            <div className="p-4 border-2 border-primary rounded-lg bg-background text-center">
              <AlertTriangle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <h3 className="font-semibold text-primary mb-1">
                No Save Options Available
              </h3>
              <p className="text-sm text-muted-foreground">
                Your streak has been broken. Start fresh with your next visit!
              </p>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};