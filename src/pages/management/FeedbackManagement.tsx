import { useState, useMemo } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, TrendingUp, TrendingDown, MessageSquare, Mail, Share2, Calendar, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FeedbackTable } from '@/components/management/feedback/FeedbackTable';
import { FeedbackAnalytics } from '@/components/management/feedback/FeedbackAnalytics';
import { FeedbackReports } from '@/components/management/feedback/FeedbackReports';

export default function FeedbackManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [selectedView, setSelectedView] = useState<'table' | 'analytics' | 'reports'>('table');

  const { data: feedbackData, isLoading } = useQuery({
    queryKey: ['feedback-submissions', dateRange],
    queryFn: async () => {
      let query = supabase
        .from('feedback_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply date range filter
      if (dateRange !== 'all') {
        const now = new Date();
        let startDate = new Date();
        
        switch (dateRange) {
          case '7d':
            startDate.setDate(now.getDate() - 7);
            break;
          case '30d':
            startDate.setDate(now.getDate() - 30);
            break;
          case '90d':
            startDate.setDate(now.getDate() - 90);
            break;
        }
        
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  const filteredData = useMemo(() => {
    if (!feedbackData) return [];
    
    return feedbackData.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return (
        item.message?.toLowerCase().includes(searchLower) ||
        item.name?.toLowerCase().includes(searchLower)
      );
    });
  }, [feedbackData, searchTerm]);

  // Calculate aggregate statistics
  const stats = useMemo(() => {
    if (!filteredData.length) return null;

    const totalFeedback = filteredData.length;
    
    const avgScores = {
      hospitality: filteredData.reduce((sum, f) => sum + (f.hospitality_rating || 0), 0) / totalFeedback,
      food: filteredData.reduce((sum, f) => sum + (f.food_rating || 0), 0) / totalFeedback,
      drink: filteredData.reduce((sum, f) => sum + (f.drink_rating || 0), 0) / totalFeedback,
      team: filteredData.reduce((sum, f) => sum + (f.team_rating || 0), 0) / totalFeedback,
      venue: filteredData.reduce((sum, f) => sum + (f.venue_rating || 0), 0) / totalFeedback,
      price: filteredData.reduce((sum, f) => sum + (f.price_rating || 0), 0) / totalFeedback,
      overall: filteredData.reduce((sum, f) => sum + (f.overall_rating || 0), 0) / totalFeedback,
    };

    return {
      totalFeedback,
      avgScores,
      anonymousCount: filteredData.filter(f => f.is_anonymous).length,
      withComments: filteredData.filter(f => f.message?.trim()).length
    };
  }, [filteredData]);

  return (
    <ManagementLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feedback Management</h1>
          <p className="text-muted-foreground">
            Monitor customer feedback with AI-powered sentiment analysis
          </p>
        </div>

        {/* View Selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedView === 'table' ? 'default' : 'outline'}
            onClick={() => setSelectedView('table')}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Feedback
          </Button>
          <Button
            variant={selectedView === 'analytics' ? 'default' : 'outline'}
            onClick={() => setSelectedView('analytics')}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </Button>
          <Button
            variant={selectedView === 'reports' ? 'default' : 'outline'}
            onClick={() => setSelectedView('reports')}
          >
            <Download className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalFeedback}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.withComments} with comments
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.avgScores.overall.toFixed(1)}
                  <span className="text-sm text-muted-foreground">/5</span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {stats.avgScores.overall >= 4 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs text-muted-foreground">Average rating</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.entries(stats.avgScores)
                    .filter(([key]) => key !== 'overall')
                    .sort(([, a], [, b]) => b - a)[0]?.[0]?.toUpperCase() || 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Object.entries(stats.avgScores)
                    .filter(([key]) => key !== 'overall')
                    .sort(([, a], [, b]) => b - a)[0]?.[1]?.toFixed(1) || '0'}/5 average
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Anonymous</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.anonymousCount}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((stats.anonymousCount / stats.totalFeedback) * 100).toFixed(0)}% of total
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search feedback..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Content based on selected view */}
        {selectedView === 'table' && (
          <FeedbackTable data={filteredData} isLoading={isLoading} />
        )}
        
        {selectedView === 'analytics' && (
          <FeedbackAnalytics data={filteredData} dateRange={dateRange} />
        )}
        
        {selectedView === 'reports' && (
          <FeedbackReports data={filteredData} dateRange={dateRange} />
        )}
      </div>
    </ManagementLayout>
  );
}
