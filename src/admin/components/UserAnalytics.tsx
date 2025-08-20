import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Clock, MousePointer, Users, Eye, TrendingUp } from 'lucide-react';

type TimeRange = '24h' | '7d' | '30d' | 'all';

interface AnalyticsData {
  pageViews: any[];
  userSessions: any[];
  userInteractions: any[];
  userJourneys: any[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const UserAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  
  const getDateFilter = (range: TimeRange) => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return null;
    }
  };

  const { data: analyticsData, isLoading, error } = useQuery({
    queryKey: ['userAnalytics', timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      const dateFilter = getDateFilter(timeRange);
      
      const [pageViewsRes, userSessionsRes, userInteractionsRes, userJourneysRes] = await Promise.all([
        supabase
          .from('page_views')
          .select('*')
          .gte('viewed_at', dateFilter || '1970-01-01')
          .order('viewed_at', { ascending: false }),
        supabase
          .from('user_sessions')
          .select('*')
          .gte('started_at', dateFilter || '1970-01-01')
          .order('started_at', { ascending: false }),
        supabase
          .from('user_interactions')
          .select('*')
          .gte('occurred_at', dateFilter || '1970-01-01')
          .order('occurred_at', { ascending: false }),
        supabase
          .from('user_journeys')
          .select('*')
          .gte('occurred_at', dateFilter || '1970-01-01')
          .order('occurred_at', { ascending: false })
      ]);

      if (pageViewsRes.error) throw pageViewsRes.error;
      if (userSessionsRes.error) throw userSessionsRes.error;
      if (userInteractionsRes.error) throw userInteractionsRes.error;
      if (userJourneysRes.error) throw userJourneysRes.error;

      return {
        pageViews: pageViewsRes.data || [],
        userSessions: userSessionsRes.data || [],
        userInteractions: userInteractionsRes.data || [],
        userJourneys: userJourneysRes.data || []
      };
    },
    refetchInterval: 60000 // Refetch every minute
  });

  const metrics = useMemo(() => {
    if (!analyticsData) return null;

    const { pageViews, userSessions, userInteractions } = analyticsData;
    
    const totalPageViews = pageViews.length;
    const totalSessions = userSessions.length;
    const totalInteractions = userInteractions.length;
    const uniqueUsers = new Set(pageViews.map(pv => pv.user_id).filter(Boolean)).size;
    
    const avgSessionDuration = userSessions.reduce((acc, session) => {
      if (session.ended_at) {
        const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
        return acc + duration;
      }
      return acc;
    }, 0) / Math.max(userSessions.filter(s => s.ended_at).length, 1);

    const bounceRate = pageViews.filter(pv => pv.is_bounce).length / Math.max(totalPageViews, 1) * 100;

    return {
      totalPageViews,
      totalSessions,
      totalInteractions,
      uniqueUsers,
      avgSessionDuration: Math.round(avgSessionDuration / 1000 / 60), // in minutes
      bounceRate: Math.round(bounceRate)
    };
  }, [analyticsData]);

  const chartData = useMemo(() => {
    if (!analyticsData) return { pageViewsChart: [], topPages: [], deviceTypes: [], interactions: [] };

    const { pageViews, userSessions, userInteractions } = analyticsData;

    // Page views over time
    const pageViewsByDate = pageViews.reduce((acc: Record<string, number>, pv) => {
      const date = new Date(pv.viewed_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});

    const pageViewsChart = Object.entries(pageViewsByDate)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Top pages
    const pagesByViews = pageViews.reduce((acc: Record<string, number>, pv) => {
      acc[pv.page_path] = (acc[pv.page_path] || 0) + 1;
      return acc;
    }, {});

    const topPages = Object.entries(pagesByViews)
      .map(([path, views]) => ({ path, views }))
      .sort((a: any, b: any) => b.views - a.views)
      .slice(0, 10);

    // Device types
    const devicesByType = userSessions.reduce((acc: Record<string, number>, session) => {
      const device = session.device_type || 'unknown';
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {});

    const deviceTypes = Object.entries(devicesByType)
      .map(([device, count]) => ({ device, count }));

    // Interaction types
    const interactionsByType = userInteractions.reduce((acc: Record<string, number>, interaction) => {
      acc[interaction.interaction_type] = (acc[interaction.interaction_type] || 0) + 1;
      return acc;
    }, {});

    const interactions = Object.entries(interactionsByType)
      .map(([type, count]) => ({ type, count }))
      .sort((a: any, b: any) => b.count - a.count);

    return { pageViewsChart, topPages, deviceTypes, interactions };
  }, [analyticsData]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">User Analytics</h2>
          <div className="h-10 w-32 bg-muted animate-pulse rounded"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted animate-pulse rounded mb-2"></div>
                <div className="h-8 bg-muted animate-pulse rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-destructive">Failed to load analytics data: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">User Analytics</h2>
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">Last 24h</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Page Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalPageViews.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSessions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.uniqueUsers.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Session</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgSessionDuration}m</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interactions</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalInteractions.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.bounceRate}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <Tabs defaultValue="traffic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="traffic">Traffic</TabsTrigger>
          <TabsTrigger value="pages">Top Pages</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
              <CardDescription>Daily page view trends</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.pageViewsChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="hsl(var(--primary))" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Pages</CardTitle>
              <CardDescription>Pages ranked by view count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.topPages}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="path" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Device Types</CardTitle>
              <CardDescription>Session distribution by device type</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.deviceTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ device, percent }) => `${device} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {chartData.deviceTypes.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Interactions</CardTitle>
              <CardDescription>Types of user interactions tracked</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {chartData.interactions.map((interaction: any, index: number) => (
                  <div key={interaction.type} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{interaction.type}</Badge>
                    </div>
                    <span className="font-semibold">{interaction.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};