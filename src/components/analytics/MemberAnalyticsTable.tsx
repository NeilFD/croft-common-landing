import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, TrendingUp, AlertTriangle, Clock } from 'lucide-react';

export interface EnhancedMemberAnalytics {
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  age?: number;
  interests: string[];
  tier_badge: string;
  total_transactions: number;
  total_spend: number;
  avg_transaction: number;
  first_transaction_date: string;
  last_transaction_date: string;
  active_months: number;
  active_days: number;
  categories: string[];
  payment_methods: string[];
  currency: string;
  current_month_spend: number;
  current_week_spend: number;
  current_month_transactions: number;
  favorite_venues: string[];
  visit_frequency: number;
  last_visit_date: string;
  preferred_visit_times: string[];
  retention_risk_score: number;
  lifetime_value: number;
}

interface MemberAnalyticsTableProps {
  members: EnhancedMemberAnalytics[];
  onViewMember: (memberId: string) => void;
  isLoading?: boolean;
}

export const MemberAnalyticsTable: React.FC<MemberAnalyticsTableProps> = ({
  members,
  onViewMember,
  isLoading = false
}) => {
  const getRiskBadgeColor = (score: number) => {
    if (score >= 70) return 'destructive';
    if (score >= 40) return 'default';
    return 'secondary';
  };

  const getRiskLabel = (score: number) => {
    if (score >= 70) return 'High Risk';
    if (score >= 40) return 'Medium Risk';
    return 'Low Risk';
  };

  if (isLoading) {
    return (
      <Card className="border-2 border-black">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-black">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Active Member Database ({members.length} members)</span>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              High Risk: {members.filter(m => (m.retention_risk_score || 0) >= 70).length}
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              High Value: {members.filter(m => (m.lifetime_value || 0) > 500).length}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Member</th>
                <th className="text-right p-3">Total Spend</th>
                <th className="text-right p-3">LTV</th>
                <th className="text-center p-3">Risk</th>
                <th className="text-center p-3">Frequency</th>
                <th className="text-left p-3">Interests</th>
                <th className="text-left p-3">Venues</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.user_id} className="border-b hover:bg-muted/50 transition-colors">
                  <td className="p-3">
                    <div className="space-y-1">
                      <div className="font-medium">
                        {member.display_name || `${member.first_name} ${member.last_name}`}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {member.age && <span>Age: {member.age}</span>}
                        <span>•</span>
                        <span>{member.active_months} months active</span>
                        <span>•</span>
                        <span>{member.total_transactions} transactions</span>
                      </div>
                      {member.last_visit_date && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last visit: {new Date(member.last_visit_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-3">
                    <div className="space-y-1">
                      <div className="font-medium">£{(member.total_spend || 0).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground">
                        Avg: £{(member.avg_transaction || 0).toFixed(2)}
                      </div>
                      <div className="text-xs text-green-600">
                        This month: £{(member.current_month_spend || 0).toFixed(2)}
                      </div>
                    </div>
                  </td>
                  <td className="text-right p-3">
                    <div className="font-medium">£{(member.lifetime_value || 0).toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Projected</div>
                  </td>
                  <td className="text-center p-3">
                    <Badge variant={getRiskBadgeColor(member.retention_risk_score || 0)}>
                      {getRiskLabel(member.retention_risk_score || 0)}
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Score: {member.retention_risk_score || 0}
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <div className="font-medium">{(member.visit_frequency || 0).toFixed(1)}/week</div>
                    <div className="text-xs text-muted-foreground">
                      {member.active_days || 0} days active
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm max-w-40 truncate" title={member.interests?.join(', ')}>
                      {member.interests?.join(', ') || 'None'}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="text-sm max-w-40 truncate" title={member.favorite_venues?.map(venue => venue.replace('-', ' ')).join(', ')}>
                      {member.favorite_venues?.map(venue => venue.replace('-', ' ')).join(', ') || 'None'}
                    </div>
                  </td>
                  <td className="text-center p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onViewMember(member.user_id)}
                      className="flex items-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};