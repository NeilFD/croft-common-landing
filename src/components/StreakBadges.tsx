import React from 'react';
import { Trophy, Award, Star, Crown, Medal, Target, Gift, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStreakDashboard } from '@/hooks/useStreakDashboard';

const StreakBadges: React.FC = () => {
  const { dashboardData, loading } = useStreakDashboard();

  const getBadgeIcon = (iconName: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      trophy: <Trophy className="h-6 w-6" />,
      award: <Award className="h-6 w-6" />,
      star: <Star className="h-6 w-6" />,
      crown: <Crown className="h-6 w-6" />,
      medal: <Medal className="h-6 w-6" />,
      target: <Target className="h-6 w-6" />,
      gift: <Gift className="h-6 w-6" />,
      calendar: <Calendar className="h-6 w-6" />,
    };
    return iconMap[iconName] || <Trophy className="h-6 w-6" />;
  };

  const getBadgeColor = (badgeType: string) => {
    const colorMap: { [key: string]: string } = {
      first_week: 'bg-blue-500',
      first_set: 'bg-green-500',
      week_milestone: 'bg-purple-500',
      set_milestone: 'bg-orange-500',
      reward_claimed: 'bg-yellow-500',
      loyalty_champion: 'bg-red-500',
      consistent_member: 'bg-teal-500',
    };
    return colorMap[badgeType] || 'bg-primary';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getRecentBadges = () => {
    if (!dashboardData?.badges) return [];
    return dashboardData.badges
      .sort((a, b) => new Date(b.earned_date).getTime() - new Date(a.earned_date).getTime())
      .slice(0, 6); // Show last 6 badges
  };

  const getMilestoneBadges = () => {
    if (!dashboardData?.badges) return [];
    return dashboardData.badges
      .filter(badge => badge.milestone_value)
      .sort((a, b) => (b.milestone_value || 0) - (a.milestone_value || 0))
      .slice(0, 3); // Show top 3 milestone badges
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Streak Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!dashboardData?.badges || dashboardData.badges.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Streak Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Badges Yet</h3>
            <p className="text-muted-foreground">
              Complete your first week to start earning badges!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentBadges = getRecentBadges();
  const milestoneBadges = getMilestoneBadges();

  return (
    <div className="space-y-6">
      {/* Recent Badges */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Recent Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentBadges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentBadges.map((badge, index) => (
                <div 
                  key={`${badge.type}-${badge.earned_date}-${index}`}
                  className="flex items-center gap-3 p-4 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg hover:shadow-md transition-all duration-200"
                >
                  <div className={`${getBadgeColor(badge.type)} text-white rounded-full p-2 flex-shrink-0`}>
                    {getBadgeIcon(badge.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {badge.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {badge.description}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      {formatDate(badge.earned_date)}
                    </div>
                  </div>
                  {badge.milestone_value && (
                    <Badge variant="secondary" className="flex-shrink-0">
                      {badge.milestone_value}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground">No recent badges</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Milestone Badges */}
      {milestoneBadges.length > 0 && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Top Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {milestoneBadges.map((badge, index) => (
                <div 
                  key={`milestone-${badge.type}-${badge.milestone_value}-${index}`}
                  className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 hover:shadow-lg transition-all duration-200"
                >
                  <div className={`${getBadgeColor(badge.type)} text-white rounded-full p-4 inline-flex mb-3`}>
                    {getBadgeIcon(badge.icon)}
                  </div>
                  <h3 className="font-bold text-lg mb-1">
                    {badge.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {badge.description}
                  </p>
                  <Badge variant="default" className="font-semibold">
                    {badge.milestone_value}
                  </Badge>
                  <div className="text-xs text-muted-foreground mt-2">
                    Earned {formatDate(badge.earned_date)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badge Statistics */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Medal className="h-5 w-5" />
            Badge Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {dashboardData.badges.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Total Badges
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {milestoneBadges.length}
              </div>
              <div className="text-xs text-muted-foreground">
                Milestones
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {Math.max(...dashboardData.badges.map(b => b.milestone_value || 0))}
              </div>
              <div className="text-xs text-muted-foreground">
                Highest Milestone
              </div>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary mb-1">
                {dashboardData.badges.filter(b => 
                  new Date(b.earned_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                ).length}
              </div>
              <div className="text-xs text-muted-foreground">
                This Month
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StreakBadges;