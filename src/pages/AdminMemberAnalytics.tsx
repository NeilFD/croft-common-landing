import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Download, Users, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface MemberAnalytics {
  user_id: string;
  first_name: string;
  last_name: string;
  display_name: string;
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
}

const AdminMemberAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<MemberAnalytics[]>([]);
  const [filteredAnalytics, setFilteredAnalytics] = useState<MemberAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('total_spend');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCategory, setFilterCategory] = useState('all');
  const [minSpend, setMinSpend] = useState('');
  const [maxSpend, setMaxSpend] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [analytics, searchTerm, sortBy, sortOrder, filterCategory, minSpend, maxSpend]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast.error('Authentication required');
        return;
      }

      const { data, error } = await supabase.functions.invoke('member-analytics', {
        headers: {
          Authorization: `Bearer ${session.session.access_token}`
        }
      });

      if (error) throw error;
      
      setAnalytics(data.analytics || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load member analytics');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...analytics];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(member =>
        member.display_name?.toLowerCase().includes(term) ||
        member.first_name?.toLowerCase().includes(term) ||
        member.last_name?.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(member =>
        member.categories?.includes(filterCategory)
      );
    }

    // Spend range filter
    if (minSpend) {
      const min = parseFloat(minSpend);
      filtered = filtered.filter(member => member.total_spend >= min);
    }
    if (maxSpend) {
      const max = parseFloat(maxSpend);
      filtered = filtered.filter(member => member.total_spend <= max);
    }

    // Sort
    filtered.sort((a, b) => {
      const aVal = a[sortBy as keyof MemberAnalytics];
      const bVal = b[sortBy as keyof MemberAnalytics];
      
      const comparison = aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredAnalytics(filtered);
  };

  const exportToCSV = () => {
    const headers = [
      'Name', 'Total Spend', 'Transactions', 'Average Transaction',
      'Active Days', 'Active Months', 'Current Month Spend',
      'First Transaction', 'Last Transaction', 'Categories', 'Payment Methods'
    ];

    const rows = filteredAnalytics.map(member => [
      member.display_name || `${member.first_name} ${member.last_name}`,
      member.total_spend.toFixed(2),
      member.total_transactions,
      member.avg_transaction?.toFixed(2) || '0',
      member.active_days,
      member.active_months,
      member.current_month_spend.toFixed(2),
      member.first_transaction_date,
      member.last_transaction_date,
      member.categories?.join('; ') || '',
      member.payment_methods?.join('; ') || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `member-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getTotalStats = () => {
    const totalSpend = filteredAnalytics.reduce((sum, member) => sum + member.total_spend, 0);
    const totalTransactions = filteredAnalytics.reduce((sum, member) => sum + member.total_transactions, 0);
    const avgSpendPerMember = filteredAnalytics.length > 0 ? totalSpend / filteredAnalytics.length : 0;

    return { totalSpend, totalTransactions, avgSpendPerMember };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Member Analytics | Admin</title>
        <meta name="description" content="Comprehensive member spending analysis and transaction patterns" />
      </Helmet>

      <div className="min-h-screen bg-background p-4">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <Card className="border-2 border-black shadow-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-brutalist flex items-center gap-3">
                <Users className="h-8 w-8" />
                Member Analytics Dashboard
              </CardTitle>
              <p className="text-muted-foreground">
                Comprehensive database of member spending habits and transaction patterns
              </p>
            </CardHeader>
          </Card>

          {/* Summary Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-2 border-black">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Total Spend
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{stats.totalSpend.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  From {filteredAnalytics.length} members
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-black">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
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

            <Card className="border-2 border-black">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Avg per Member
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">£{stats.avgSpendPerMember.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Average spend per member
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-6 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total_spend">Total Spend</SelectItem>
                    <SelectItem value="total_transactions">Transactions</SelectItem>
                    <SelectItem value="avg_transaction">Avg Transaction</SelectItem>
                    <SelectItem value="active_days">Active Days</SelectItem>
                    <SelectItem value="current_month_spend">This Month</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">High to Low</SelectItem>
                    <SelectItem value="asc">Low to High</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Min spend"
                  type="number"
                  value={minSpend}
                  onChange={(e) => setMinSpend(e.target.value)}
                />

                <Input
                  placeholder="Max spend"
                  type="number"
                  value={maxSpend}
                  onChange={(e) => setMaxSpend(e.target.value)}
                />

                <Button onClick={exportToCSV} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Analytics Table */}
          <Card className="border-2 border-black">
            <CardHeader>
              <CardTitle>Member Database ({filteredAnalytics.length} members)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Member</th>
                      <th className="text-right p-2">Total Spend</th>
                      <th className="text-right p-2">Transactions</th>
                      <th className="text-right p-2">Avg Transaction</th>
                      <th className="text-right p-2">Active Days</th>
                      <th className="text-right p-2">This Month</th>
                      <th className="text-left p-2">Categories</th>
                      <th className="text-left p-2">Payment Methods</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAnalytics.map((member) => (
                      <tr key={member.user_id} className="border-b hover:bg-muted/50">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">
                              {member.display_name || `${member.first_name} ${member.last_name}`}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {member.active_months} months active
                            </div>
                          </div>
                        </td>
                        <td className="text-right p-2 font-medium">
                          £{member.total_spend.toFixed(2)}
                        </td>
                        <td className="text-right p-2">
                          {member.total_transactions}
                        </td>
                        <td className="text-right p-2">
                          £{member.avg_transaction?.toFixed(2) || '0.00'}
                        </td>
                        <td className="text-right p-2">
                          {member.active_days}
                        </td>
                        <td className="text-right p-2">
                          £{member.current_month_spend.toFixed(2)}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {member.categories?.slice(0, 3).map((category) => (
                              <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                            {member.categories?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{member.categories.length - 3}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1">
                            {member.payment_methods?.map((method) => (
                              <Badge key={method} variant="outline" className="text-xs">
                                {method}
                              </Badge>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AdminMemberAnalytics;