import React, { useState } from 'react';
import { Gift, Trophy, Star, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';
import { useToast } from '@/hooks/use-toast';

const StreakRewardsDashboard: React.FC = () => {
  const { dashboardData, loading, claimReward, refetch } = useStreakDashboard();
  const [claiming, setClaiming] = useState(false);
  const { toast } = useToast();

  const handleClaimReward = async () => {
    if (!dashboardData?.rewards.active_rewards.length) return;

    try {
      setClaiming(true);
      const result = await claimReward();
      
      toast({
        title: "🎉 Reward Claimed!",
        description: `You've claimed your ${result.claimed_reward.discount_percentage}% discount! Your streak has been reset.`,
      });

      // Refresh the dashboard
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

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Streak Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
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
            <Gift className="h-5 w-5" />
            Streak Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No reward data available</p>
        </CardContent>
      </Card>
    );
  }

  const { rewards, statistics } = dashboardData;
  const hasActiveRewards = rewards.active_rewards.length > 0;

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
    <div className="space-y-6">
      {/* Main Reward Display */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Available Rewards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasActiveRewards ? (
            <div className="space-y-4">
              {/* Total Available Discount */}
              <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="text-4xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">
                  {rewards.available_discount}%
                </div>
                <div className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Total Discount Available
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
                  Up to 4 people dining in The Kitchens
                </div>
                
                <Button 
                  onClick={handleClaimReward}
                  disabled={claiming}
                  size="lg"
                  className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {claiming ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Claim {rewards.available_discount}% Discount
                    </>
                  )}
                </Button>
              </div>

              {/* Warning about reset */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Important:</strong> Claiming your reward will reset your entire streak progress. 
                  You'll start fresh from week 1, but you'll keep all your badges and statistics!
                </AlertDescription>
              </Alert>

              {/* Individual Rewards Breakdown */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Earned Rewards</h3>
                {rewards.active_rewards.map((reward, index) => (
                  <div key={reward.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
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
                      <Badge variant="secondary">
                        Set #{reward.tier}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        Expires in {getDaysUntilExpiry(reward.expires_date)} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Rewards Yet</h3>
              <p className="text-muted-foreground mb-4">
                Complete your first 4-week streak to earn your first 25% discount!
              </p>
              {rewards.next_reward_at && (
                <Badge variant="outline">
                  Next reward: {rewards.next_reward_at}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reward Progress & Statistics */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Reward History & Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {statistics.total_rewards_earned}
              </div>
              <div className="text-xs text-muted-foreground">
                Rewards Earned
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {statistics.total_rewards_claimed}
              </div>
              <div className="text-xs text-muted-foreground">
                Rewards Claimed
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {statistics.total_sets_completed}
              </div>
              <div className="text-xs text-muted-foreground">
                4-Week Sets
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {statistics.total_weeks_completed}
              </div>
              <div className="text-xs text-muted-foreground">
                Weeks Completed
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How Rewards Work */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            How Streak Rewards Work
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </div>
              <div>
                <div className="font-medium">Complete 4-Week Sets</div>
                <div className="text-muted-foreground">
                  Get 2+ receipts per week for 4 consecutive weeks to earn rewards
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </div>
              <div>
                <div className="font-medium">Accumulative Discounts</div>
                <div className="text-muted-foreground">
                  1st set = 25%, 2nd set = 50%, 3rd set = 75%, 4th set = 100%
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </div>
              <div>
                <div className="font-medium">Claim & Reset</div>
                <div className="text-muted-foreground">
                  Use your discount anytime, but claiming resets your streak progress
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
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
        </CardContent>
      </Card>
    </div>
  );
};

export default StreakRewardsDashboard;