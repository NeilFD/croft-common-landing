import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, TrendingUp, Clock, MapPin, Heart, ShoppingBag, 
  AlertTriangle, Star, Calendar, Activity, X, ArrowUpDown 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

export interface MemberDeepDiveData {
  member_id: string;
  profile: {
    first_name: string;
    last_name: string;
    display_name?: string;
    age?: number;
    interests: string[];
    tier_badge: string;
    member_since: string;
    avatar_url?: string;
    favorite_venue?: string;
    favorite_drink?: string;
  };
  spend_breakdown: {
    total_spend: number;
    avg_transaction: number;
    transaction_count: number;
    by_category: Record<string, { total: number; count: number }>;
    monthly_trend: Array<{
      month: string;
      spend: number;
      transactions: number;
    }>;
  };
  visit_patterns: {
    total_visits: number;
    current_streak: number;
    longest_streak: number;
    favorite_entrances: Array<{
      entrance: string;
      visit_count: number;
    }>;
    visit_times: Array<{
      hour: number;
      count: number;
    }>;
    weekly_pattern: Array<{
      day_of_week: number;
      count: number;
    }>;
    month_period_breakdown?: Array<{
      period: string;
      visit_count: number;
      percentage: number;
    }>;
    time_period_breakdown?: Array<{
      time_period: string;
      visit_count: number;
      percentage: number;
    }>;
    visit_consistency?: {
      avg_gap_days: number;
      consistency_score: number;
      last_gap_days: number;
      is_overdue: boolean;
    };
    behavioral_insights?: {
      most_likely_day: string;
      most_likely_day_count: number;
      most_likely_day_percentage: number;
    };
  };
  engagement_metrics: {
    push_subscriptions: number;
    moments_shared: number;
    last_activity_date: string;
  };
  recent_activity: Array<{
    date: string;
    type: string;
    description: string;
    amount?: number;
    metadata?: any;
  }>;
  predictive_insights: {
    churn_risk: 'low' | 'medium' | 'high';
    predicted_monthly_spend: number;
    recommendations: string[];
  };
  individual_items: Array<{
    item_name: string;
    total_quantity: number;
    total_spent: number;
    avg_price: number;
    times_ordered: number;
  }>;
}

interface MemberDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberId: string | null;
  memberData?: MemberDeepDiveData | null;
  isLoading?: boolean;
  onSendNotification?: (memberId: string) => void;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MemberDeepDiveModal: React.FC<MemberDeepDiveModalProps> = ({
  isOpen,
  onClose,
  memberId,
  memberData,
  isLoading = false,
  onSendNotification
}) => {
  const [sortBy, setSortBy] = useState<'spend' | 'count'>('spend');
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Debug logging to see what's in individual_items
  console.log('MemberDeepDiveModal memberData:', memberData);
  console.log('Individual items:', memberData?.individual_items);

  // Sort individual items based on current sort preference
  const sortedIndividualItems = useMemo(() => {
    if (!memberData || !memberData.individual_items || !Array.isArray(memberData.individual_items)) {
      return [];
    }
    
    const items = [...memberData.individual_items];
    return items.sort((a, b) => {
      if (sortBy === 'spend') {
        return Number(b.total_spent || 0) - Number(a.total_spent || 0);
      } else {
        return Number(b.times_ordered || 0) - Number(a.times_ordered || 0);
      }
    }).slice(0, 10);
  }, [memberData, sortBy]);

  // Early returns after all hooks are called
  if (!isOpen || !memberId) return null;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'diamond': 
      case 'platinum': 
      case 'gold': 
      case 'silver': 
      default: return 'bg-primary text-primary-foreground';
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Loading Member Profile...</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            <div className="animate-pulse space-y-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!memberData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member Not Found</DialogTitle>
          </DialogHeader>
          <div className="p-8 text-center">
            <p className="text-muted-foreground">Unable to load member data. Please try again.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const categoryData = Object.entries(memberData.spend_breakdown.by_category || {}).map(([name, data]) => ({
    name,
    value: data.total,
    count: data.count
  }));

  const weeklyData = memberData.visit_patterns.weekly_pattern?.map(day => ({
    day: DAY_NAMES[day.day_of_week],
    visits: day.count
  })) || [];

  const hourlyData = memberData.visit_patterns.visit_times?.map(time => ({
    hour: time.hour,
    visits: time.count
  })) || [];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              {memberData.profile.avatar_url ? (
                <img 
                  src={memberData.profile.avatar_url} 
                  alt="Profile avatar" 
                  className="h-6 w-6 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => setShowAvatarModal(true)}
                />
              ) : (
                <User className="h-6 w-6" />
              )}
              {memberData.profile.display_name || `${memberData.profile.first_name} ${memberData.profile.last_name}`}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {onSendNotification && (
                <Button size="sm" onClick={() => onSendNotification(memberId)}>
                  Send Notification
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="max-h-[75vh] overflow-y-auto">
          <div className="space-y-6 p-1">
            {/* Profile Overview */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {memberData.profile.avatar_url ? (
                      <img 
                        src={memberData.profile.avatar_url} 
                        alt="Profile avatar" 
                        className="h-4 w-4 rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowAvatarModal(true)}
                      />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    Profile Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">Member since: {new Date(memberData.profile.member_since).toLocaleDateString()}</div>
                  {memberData.profile.favorite_venue && (
                    <div className="text-sm">Favorite venue: {memberData.profile.favorite_venue}</div>
                  )}
                  {memberData.profile.favorite_drink && (
                    <div className="text-sm">Favorite drink: {memberData.profile.favorite_drink}</div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {memberData.profile.interests?.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Spend Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">£{memberData.spend_breakdown.total_spend.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">
                    {memberData.spend_breakdown.transaction_count} transactions
                  </div>
                  <div className="text-sm">
                    Avg: £{memberData.spend_breakdown.avg_transaction.toFixed(2)}
                  </div>
                  <div className="text-sm">
                    Predicted monthly: £{memberData.predictive_insights.predicted_monthly_spend.toFixed(0)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant={getRiskColor(memberData.predictive_insights.churn_risk)} className="mb-2">
                    {memberData.predictive_insights.churn_risk.toUpperCase()} RISK
                  </Badge>
                  <div className="space-y-1">
                    {memberData.predictive_insights.recommendations.map((rec, index) => (
                      <div key={index} className="text-xs text-muted-foreground">• {rec}</div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visit Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Visit Patterns & Behavioral Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Core Visit Stats */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{memberData.visit_patterns.total_visits}</div>
                    <div className="text-sm text-muted-foreground">Total Visits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{memberData.visit_patterns.current_streak}</div>
                    <div className="text-sm text-muted-foreground">Current Streak</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{memberData.visit_patterns.longest_streak}</div>
                    <div className="text-sm text-muted-foreground">Longest Streak</div>
                  </div>
                </div>

                {/* Behavioral Insights */}
                {memberData.visit_patterns.behavioral_insights && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Most Likely Visit Pattern
                    </h4>
                    <p className="text-sm">
                      <span className="font-medium">{memberData.visit_patterns.behavioral_insights.most_likely_day}</span>
                      {memberData.visit_patterns.behavioral_insights.most_likely_day_percentage && (
                        <span className="text-muted-foreground ml-1">
                          ({memberData.visit_patterns.behavioral_insights.most_likely_day_percentage}% of visits)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Time Period Preferences */}
                {memberData.visit_patterns.time_period_breakdown && memberData.visit_patterns.time_period_breakdown.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time of Day Preferences
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {memberData.visit_patterns.time_period_breakdown.map((period: any) => (
                        <div key={period.time_period} className="text-center p-4 border rounded-lg">
                          <div className="font-semibold capitalize">{period.time_period}</div>
                          <div className="text-sm text-muted-foreground mt-1">{period.visit_count} visits</div>
                          <div className="text-xs font-medium mt-1 text-primary">{period.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Month Period Analysis */}
                {memberData.visit_patterns.month_period_breakdown && memberData.visit_patterns.month_period_breakdown.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Month Period Preferences
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {memberData.visit_patterns.month_period_breakdown.map((period: any) => (
                        <div key={period.period} className="text-center p-4 border rounded-lg">
                          <div className="font-semibold capitalize">{period.period} of Month</div>
                          <div className="text-sm text-muted-foreground mt-1">{period.visit_count} visits</div>
                          <div className="text-xs font-medium mt-1 text-primary">{period.percentage}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Visit Consistency Insights */}
                {memberData.visit_patterns.visit_consistency && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Visit Consistency Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Average gap:</span>
                        <span className="font-medium px-2 py-1 rounded border">
                          {memberData.visit_patterns.visit_consistency.avg_gap_days} days
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Consistency score:</span>
                        <span className="font-medium px-2 py-1 rounded border">
                          {memberData.visit_patterns.visit_consistency.consistency_score}%
                        </span>
                      </div>
                      {memberData.visit_patterns.visit_consistency.last_gap_days && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Days since last visit:</span>
                          <span className="font-medium px-2 py-1 rounded border">
                            {memberData.visit_patterns.visit_consistency.last_gap_days}
                          </span>
                        </div>
                      )}
                      {memberData.visit_patterns.visit_consistency.is_overdue && (
                        <div className="col-span-2">
                          <span className="font-medium px-3 py-2 rounded border border-destructive text-destructive">⚠️ Overdue for next visit</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Weekly Pattern */}
                {memberData.visit_patterns.weekly_pattern && memberData.visit_patterns.weekly_pattern.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Weekly Pattern
                    </h4>
                    <div className="flex gap-3 overflow-x-auto p-3 border rounded-lg">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                        const dayData = memberData.visit_patterns.weekly_pattern.find((d: any) => d.day_of_week === index);
                        const count = dayData?.count || 0;
                        const maxCount = Math.max(...memberData.visit_patterns.weekly_pattern.map((d: any) => d.count));
                        const height = maxCount > 0 ? Math.max(20, (count / maxCount) * 60) : 20;
                        const isHighest = count === maxCount && count > 0;
                        
                        return (
                          <div key={day} className="flex flex-col items-center min-w-16">
                            <div 
                              className={`w-12 rounded-t border-b-2 ${isHighest ? 'bg-primary' : 'bg-muted'}`}
                              style={{ height: `${height}px` }}
                            />
                            <div className="text-xs mt-2 font-medium">{day}</div>
                            <div className="text-xs font-medium px-1 rounded border">{count}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Purchased Items */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" />
                    Top Purchased Items
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={sortBy === 'spend' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('spend')}
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      By Spend
                    </Button>
                    <Button
                      variant={sortBy === 'count' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('count')}
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      By Count
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedIndividualItems.map((item: any, index: number) => (
                    <div key={item.item_name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold px-2 py-1 rounded border">#{index + 1}</span>
                          <span className="font-medium">{item.item_name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-2 flex gap-2">
                          <span className="px-2 py-1 rounded border text-xs">{item.times_ordered} orders</span>
                          <span className="px-2 py-1 rounded border text-xs">£{Number(item.avg_price).toFixed(2)} avg</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg px-3 py-2 rounded border">
                          £{Number(item.total_spent).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {sortedIndividualItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border rounded-lg">
                      No individual item data available
                      {memberData?.individual_items && (
                        <div className="text-xs mt-2">
                          Raw data length: {memberData.individual_items.length}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Spending Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5" />
                  Spending Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Spending by Category</h4>
                    <div className="space-y-2">
                      {categoryData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <span className="text-sm">{item.name}</span>
                          <span className="font-medium">£{item.value.toFixed(0)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Monthly Spend Summary</h4>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">£{memberData.spend_breakdown.total_spend.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        Total lifetime spend
                      </div>
                      <div className="text-sm">
                        Average: £{memberData.spend_breakdown.avg_transaction.toFixed(2)} per transaction
                      </div>
                      <div className="text-sm">
                        Predicted monthly: £{memberData.predictive_insights.predicted_monthly_spend.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {memberData.recent_activity?.slice(0, 10).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{activity.description}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()} • {activity.type}
                        </div>
                      </div>
                      {activity.amount && (
                        <div className="font-medium">£{activity.amount.toFixed(2)}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Engagement Metrics */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Push Notifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberData.engagement_metrics.push_subscriptions}</div>
                  <div className="text-xs text-muted-foreground">Active subscriptions</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Moments Shared</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{memberData.engagement_metrics.moments_shared}</div>
                  <div className="text-xs text-muted-foreground">Photos uploaded</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Last Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium">
                    {new Date(memberData.engagement_metrics.last_activity_date).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-muted-foreground">Most recent interaction</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>

      {/* Avatar Modal */}
      {memberData.profile.avatar_url && (
        <Dialog open={showAvatarModal} onOpenChange={setShowAvatarModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center">
                {memberData.profile.display_name || `${memberData.profile.first_name} ${memberData.profile.last_name}`}
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 p-4">
              <img 
                src={memberData.profile.avatar_url} 
                alt="Profile avatar" 
                className="w-64 h-64 rounded-full object-cover"
              />
              <div className="text-center space-y-2">
                <p className="font-medium">
                  {memberData.profile.first_name} {memberData.profile.last_name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(memberData.profile.member_since).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};