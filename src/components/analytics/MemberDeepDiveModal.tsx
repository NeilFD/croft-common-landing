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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
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
  
  if (!isOpen || !memberId) return null;

  // Debug logging to see what's in individual_items
  console.log('MemberDeepDiveModal memberData:', memberData);
  console.log('Individual items:', memberData?.individual_items);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'diamond': return 'bg-gradient-to-r from-blue-400 to-purple-600 text-white';
      case 'platinum': return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'silver': return 'bg-gradient-to-r from-gray-200 to-gray-400 text-gray-800';
      default: return 'bg-gradient-to-r from-amber-600 to-amber-800 text-white';
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

  // Sort individual items based on current sort preference
  const sortedIndividualItems = useMemo(() => {
    if (!memberData?.individual_items) return [];
    
    const items = [...memberData.individual_items];
    return items.sort((a, b) => {
      if (sortBy === 'spend') {
        return Number(b.total_spent) - Number(a.total_spent);
      } else {
        return Number(b.times_ordered) - Number(a.times_ordered);
      }
    }).slice(0, 10);
  }, [memberData?.individual_items, sortBy]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <User className="h-6 w-6" />
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
                    <User className="h-4 w-4" />
                    Profile Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {memberData.profile.age && (
                    <div className="text-sm">Age: {memberData.profile.age}</div>
                  )}
                  <div className="text-sm">Member since: {new Date(memberData.profile.member_since).toLocaleDateString()}</div>
                  {memberData.profile.favorite_venue && (
                    <div className="text-sm">Favorite venue: {memberData.profile.favorite_venue}</div>
                  )}
                  {memberData.profile.favorite_drink && (
                    <div className="text-sm">Favorite drink: {memberData.profile.favorite_drink}</div>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {memberData.profile.interests?.map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
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
                  Visit Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                      className="text-xs"
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      By Spend
                    </Button>
                    <Button
                      variant={sortBy === 'count' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSortBy('count')}
                      className="text-xs"
                    >
                      <ArrowUpDown className="h-3 w-3 mr-1" />
                      By Count
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 font-medium">Item Name</th>
                        <th className="text-right py-2 font-medium">Times Ordered</th>
                        <th className="text-right py-2 font-medium">Total Spent</th>
                        <th className="text-right py-2 font-medium">Avg Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedIndividualItems.map((item: any, index: number) => (
                          <tr key={item.item_name} className="border-b hover:bg-muted/50">
                            <td className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-destructive">#{index + 1}</span>
                                <span className="text-sm font-medium">{item.item_name}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 font-medium">{item.times_ordered}</td>
                            <td className="text-right py-3 font-bold text-destructive">£{Number(item.total_spent).toFixed(2)}</td>
                            <td className="text-right py-3 text-sm text-muted-foreground">
                              £{Number(item.avg_price).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {sortedIndividualItems.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
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
  );
};