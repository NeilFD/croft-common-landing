import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, AlertTriangle, Star, Clock } from 'lucide-react';
import { EnhancedMemberAnalytics } from './MemberAnalyticsTable';

interface EnhancedAnalyticsStatsProps {
  members: EnhancedMemberAnalytics[];
  isLoading?: boolean;
}

export const EnhancedAnalyticsStats: React.FC<EnhancedAnalyticsStatsProps> = ({
  members,
  isLoading = false
}) => {
  const stats = React.useMemo(() => {
    if (!members.length) {
      return {
        totalSpend: 0,
        totalTransactions: 0,
        avgSpendPerMember: 0,
        avgLifetimeValue: 0,
        highRiskMembers: 0,
        highValueMembers: 0,
        activeThisMonth: 0,
        avgVisitFrequency: 0
      };
    }

    const totalSpend = members.reduce((sum, member) => sum + member.total_spend, 0);
    const totalTransactions = members.reduce((sum, member) => sum + member.total_transactions, 0);
    const totalLTV = members.reduce((sum, member) => sum + member.lifetime_value, 0);
    const highRiskMembers = members.filter(m => m.retention_risk_score >= 70).length;
    const highValueMembers = members.filter(m => m.lifetime_value > 500).length;
    const activeThisMonth = members.filter(m => m.current_month_spend > 0).length;
    const totalVisitFrequency = members.reduce((sum, member) => sum + member.visit_frequency, 0);

    return {
      totalSpend,
      totalTransactions,
      avgSpendPerMember: totalSpend / members.length,
      avgLifetimeValue: totalLTV / members.length,
      highRiskMembers,
      highValueMembers,
      activeThisMonth,
      avgVisitFrequency: totalVisitFrequency / members.length
    };
  }, [members]);

  if (isLoading) {
    return (
      <div className="grid md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="border-2 border-black">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-4 gap-4">
      {/* Total Spend */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Total Spend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{stats.totalSpend.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Avg: £{stats.avgSpendPerMember.toFixed(2)} per member
          </p>
        </CardContent>
      </Card>

      {/* Lifetime Value */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Avg Lifetime Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">£{stats.avgLifetimeValue.toFixed(0)}</div>
          <p className="text-xs text-muted-foreground">
            Projected annual value
          </p>
        </CardContent>
      </Card>

      {/* Active This Month */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            Active This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.activeThisMonth / members.length) * 100).toFixed(1)}% of total members
          </p>
        </CardContent>
      </Card>

      {/* Visit Frequency */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-600" />
            Avg Visit Frequency
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgVisitFrequency.toFixed(1)}/week</div>
          <p className="text-xs text-muted-foreground">
            Average visits per week
          </p>
        </CardContent>
      </Card>

      {/* High Risk Members */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            High Risk Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.highRiskMembers}</div>
          <p className="text-xs text-muted-foreground">
            {((stats.highRiskMembers / members.length) * 100).toFixed(1)}% at risk of churning
          </p>
        </CardContent>
      </Card>

      {/* High Value Members */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-600" />
            High Value Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.highValueMembers}</div>
          <p className="text-xs text-muted-foreground">
            LTV over £500
          </p>
        </CardContent>
      </Card>

      {/* Total Transactions */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
            Total Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          <p className="text-xs text-muted-foreground">
            All recorded transactions
          </p>
        </CardContent>
      </Card>

      {/* Member Count */}
      <Card className="border-2 border-black">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-600" />
            Total Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{members.length}</div>
          <p className="text-xs text-muted-foreground">
            In current filter
          </p>
        </CardContent>
      </Card>
    </div>
  );
};