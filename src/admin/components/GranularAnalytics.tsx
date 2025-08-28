import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown, ChevronUp, Filter, Search, Download } from 'lucide-react';

type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'all';
type SortOrder = 'asc' | 'desc';

interface DetailedButtonClick {
  id: string;
  created_at: string;
  page_path: string;
  element_id?: string;
  element_text?: string;
  element_class?: string;
  button_type?: string;
  coordinates?: { x: number; y: number };
  session_id: string;
  user_id?: string;
  className?: string;
  tagName?: string;
  href?: string;
}

interface DetailedGesture {
  id: string;
  created_at: string;
  page_path: string;
  interaction_type: string;
  gesture_name: string;
  gesture_data?: {
    points?: Array<{ x: number; y: number; timestamp: number }>;
    duration?: number;
    accuracy?: number;
    attempts?: number;
  };
  session_id: string;
  user_id?: string;
}

interface UserJourney {
  session_id: string;
  user_id?: string;
  journey_sequence: Array<{
    page_path: string;
    timestamp: string;
    time_spent?: number;
    interactions_count?: number;
  }>;
  total_pages: number;
  total_time: number;
  device_type?: string;
  browser?: string;
}

export const GranularAnalytics: React.FC = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [selectedPage, setSelectedPage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const getDateFilter = (range: TimeRange): string | null => {
    if (range === 'all') return null;
    const hours = { '1h': 1, '6h': 6, '24h': 24, '7d': 168, '30d': 720 };
    return new Date(Date.now() - hours[range] * 60 * 60 * 1000).toISOString();
  };

  // Fetch detailed button clicks
  const { data: buttonClicksData, isLoading: buttonClicksLoading } = useQuery({
    queryKey: ['detailed-button-clicks', timeRange, selectedPage, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('user_interactions')
        .select('*')
        .eq('interaction_type', 'button_click');
      
      const dateFilter = getDateFilter(timeRange);
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      if (selectedPage !== 'all') {
        query = query.eq('page_path', selectedPage);
      }
      
      if (searchTerm) {
        query = query.or(`element_text.ilike.%${searchTerm}%,element_id.ilike.%${searchTerm}%`);
      }
      
      query = query.order(sortBy, { ascending: sortOrder === 'asc' }).limit(500);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch detailed secret gestures
  const { data: gesturesData, isLoading: gesturesLoading } = useQuery({
    queryKey: ['detailed-gestures', timeRange, selectedPage],
    queryFn: async () => {
      let query = supabase
        .from('user_interactions')
        .select('*')
        .like('interaction_type', 'secret_gesture_%');
      
      const dateFilter = getDateFilter(timeRange);
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      if (selectedPage !== 'all') {
        query = query.eq('page_path', selectedPage);
      }
      
      query = query.order('created_at', { ascending: false }).limit(200);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000,
  });

  // Fetch user journeys
  const { data: journeysData, isLoading: journeysLoading } = useQuery({
    queryKey: ['user-journeys', timeRange],
    queryFn: async () => {
      const dateFilter = getDateFilter(timeRange);
      
      // Get page views with sessions  
      let pageViewQuery = supabase
        .from('page_views')
        .select('*');
      
      if (dateFilter) {
        pageViewQuery = pageViewQuery.gte('viewed_at', dateFilter);
      }
      
      const { data: pageViews, error } = await pageViewQuery
        .order('viewed_at', { ascending: true })
        .limit(1000);
      
      if (error) throw error;
      
      // Group by session to create journey sequences
      const journeyMap = new Map<string, UserJourney>();
      
      pageViews?.forEach(view => {
        const sessionId = view.session_id;
        if (!journeyMap.has(sessionId)) {
          journeyMap.set(sessionId, {
            session_id: sessionId,
            user_id: view.user_id,
            journey_sequence: [],
            total_pages: 0,
            total_time: 0,
            device_type: 'unknown',
            browser: 'unknown'
          });
        }
        
        const journey = journeyMap.get(sessionId)!;
        journey.journey_sequence.push({
          page_path: view.page_path,
          timestamp: view.viewed_at,
          time_spent: view.time_spent_seconds || 0
        });
        journey.total_pages++;
        journey.total_time += view.time_spent_seconds || 0;
      });
      
      return Array.from(journeyMap.values())
        .sort((a, b) => b.total_time - a.total_time)
        .slice(0, 50);
    },
    refetchInterval: 60000,
  });

  // Get unique pages for filtering
  const uniquePages = useMemo(() => {
    const pages = new Set<string>();
    buttonClicksData?.forEach(click => pages.add(click.page_path));
    gesturesData?.forEach(gesture => pages.add(gesture.page_path));
    return Array.from(pages).sort();
  }, [buttonClicksData, gesturesData]);

  // Process button analytics
  const buttonAnalytics = useMemo(() => {
    if (!buttonClicksData) return [];
    
    const analytics = new Map<string, {
      element_text: string;
      element_id?: string;
      button_type?: string;
      count: number;
      pages: Set<string>;
      recent_clicks: Array<{ timestamp: string; page: string; coordinates?: { x: number; y: number } }>;
    }>();
    
    buttonClicksData.forEach(click => {
      const key = `${click.element_text || 'unnamed'}_${click.element_id || 'no-id'}`;
      const additional = click.additional_data as any;
      
      if (!analytics.has(key)) {
        analytics.set(key, {
          element_text: click.element_text || 'Unnamed Button',
          element_id: click.element_id,
          button_type: additional?.button_type || 'unknown',
          count: 0,
          pages: new Set(),
          recent_clicks: []
        });
      }
      
      const item = analytics.get(key)!;
      item.count++;
      item.pages.add(click.page_path);
      item.recent_clicks.push({
        timestamp: click.created_at,
        page: click.page_path,
        coordinates: click.coordinates as { x: number; y: number } | undefined
      });
      
      // Keep only last 5 clicks
      if (item.recent_clicks.length > 5) {
        item.recent_clicks = item.recent_clicks.slice(-5);
      }
    });
    
    return Array.from(analytics.entries())
      .map(([key, data]) => ({
        ...data,
        pages_count: data.pages.size,
        avg_x: data.recent_clicks.reduce((sum, click) => sum + (click.coordinates?.x || 0), 0) / data.recent_clicks.length,
        avg_y: data.recent_clicks.reduce((sum, click) => sum + (click.coordinates?.y || 0), 0) / data.recent_clicks.length
      }))
      .sort((a, b) => b.count - a.count);
  }, [buttonClicksData]);

  // Process gesture analytics
  const gestureAnalytics = useMemo(() => {
    if (!gesturesData) return [];
    
    const analytics = new Map<string, {
      gesture_name: string;
      attempts: number;
      completions: number;
      failures: number;
      avg_duration: number;
      avg_accuracy: number;
      recent_attempts: Array<{
        timestamp: string;
        type: string;
        page: string;
        duration?: number;
        accuracy?: number;
      }>;
    }>();
    
    gesturesData.forEach(gesture => {
      const additional = gesture.additional_data as any;
      const gestureName = additional?.gesture_name || 'Unknown Gesture';
      
      if (!analytics.has(gestureName)) {
        analytics.set(gestureName, {
          gesture_name: gestureName,
          attempts: 0,
          completions: 0,
          failures: 0,
          avg_duration: 0,
          avg_accuracy: 0,
          recent_attempts: []
        });
      }
      
      const item = analytics.get(gestureName)!;
      
      if (gesture.interaction_type === 'secret_gesture_attempt') {
        item.attempts++;
      } else if (gesture.interaction_type === 'secret_gesture_complete') {
        item.completions++;
        const gestureData = additional?.gesture_data;
        if (gestureData?.duration) {
          item.avg_duration = (item.avg_duration * (item.completions - 1) + gestureData.duration) / item.completions;
        }
        if (gestureData?.accuracy) {
          item.avg_accuracy = (item.avg_accuracy * (item.completions - 1) + gestureData.accuracy) / item.completions;
        }
      } else if (gesture.interaction_type === 'secret_gesture_failed') {
        item.failures++;
      }
      
      item.recent_attempts.push({
        timestamp: gesture.created_at,
        type: gesture.interaction_type,
        page: gesture.page_path,
        duration: additional?.gesture_data?.duration,
        accuracy: additional?.gesture_data?.accuracy
      });
      
      // Keep only last 10 attempts
      if (item.recent_attempts.length > 10) {
        item.recent_attempts = item.recent_attempts.slice(-10);
      }
    });
    
    return Array.from(analytics.values())
      .map(item => ({
        ...item,
        success_rate: item.attempts > 0 ? (item.completions / item.attempts) * 100 : 0
      }))
      .sort((a, b) => b.attempts - a.attempts);
  }, [gesturesData]);

  const exportData = (data: any[], filename: string) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      [
        Object.keys(data[0] || {}).join(','),
        ...data.map(row => Object.values(row).map(val => 
          typeof val === 'object' ? JSON.stringify(val) : val
        ).join(','))
      ].join('\n');
    
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (buttonClicksLoading || gesturesLoading || journeysLoading) {
    return <div className="p-4">Loading granular analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Granular Analytics</h2>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="6h">Last 6 Hours</SelectItem>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedPage} onValueChange={setSelectedPage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Pages</SelectItem>
              {uniquePages.map(page => (
                <SelectItem key={page} value={page}>{page}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="buttons" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="buttons">Button Analysis</TabsTrigger>
          <TabsTrigger value="gestures">Secret Gestures</TabsTrigger>
          <TabsTrigger value="journeys">User Journeys</TabsTrigger>
          <TabsTrigger value="raw-data">Raw Data</TabsTrigger>
        </TabsList>

        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detailed Button Analysis</CardTitle>
                  <CardDescription>Granular button click data with coordinates and context</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportData(buttonAnalytics, 'button_analytics')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search buttons..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Button Text</TableHead>
                      <TableHead>Element ID</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Clicks</TableHead>
                      <TableHead>Pages</TableHead>
                      <TableHead>Avg Position</TableHead>
                      <TableHead>Recent Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buttonAnalytics.map((button, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {button.element_text}
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-1 rounded">
                            {button.element_id || 'no-id'}
                          </code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            button.button_type === 'cta' ? 'default' :
                            button.button_type === 'primary' ? 'secondary' :
                            'outline'
                          }>
                            {button.button_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{button.count}</TableCell>
                        <TableCell>{button.pages_count}</TableCell>
                        <TableCell>
                          {button.avg_x > 0 && button.avg_y > 0 ? (
                            <span className="text-xs">
                              ({Math.round(button.avg_x)}, {Math.round(button.avg_y)})
                            </span>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {button.recent_clicks.slice(-3).map((click, i) => (
                              <div key={i} className="text-muted-foreground">
                                {new Date(click.timestamp).toLocaleTimeString()} - {click.page}
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gestures" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Secret Gesture Deep Dive</CardTitle>
                  <CardDescription>Detailed gesture performance and failure analysis</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportData(gestureAnalytics, 'gesture_analytics')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Gesture Name</TableHead>
                      <TableHead>Attempts</TableHead>
                      <TableHead>Success Rate</TableHead>
                      <TableHead>Avg Duration</TableHead>
                      <TableHead>Avg Accuracy</TableHead>
                      <TableHead>Recent Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gestureAnalytics.map((gesture, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {gesture.gesture_name}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div>Total: {gesture.attempts}</div>
                            <div className="text-xs text-muted-foreground">
                              ✓ {gesture.completions} ✗ {gesture.failures}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            gesture.success_rate > 70 ? 'default' :
                            gesture.success_rate > 40 ? 'secondary' :
                            'destructive'
                          }>
                            {gesture.success_rate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {gesture.avg_duration > 0 ? 
                            `${(gesture.avg_duration / 1000).toFixed(1)}s` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          {gesture.avg_accuracy > 0 ? 
                            `${(gesture.avg_accuracy * 100).toFixed(1)}%` : 
                            '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            {gesture.recent_attempts.slice(-3).map((attempt, i) => (
                              <div key={i} className="text-muted-foreground">
                                {new Date(attempt.timestamp).toLocaleTimeString()} - 
                                <Badge variant="outline" className="ml-1 text-xs">
                                  {attempt.type.replace('secret_gesture_', '')}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journeys" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>User Journey Analysis</CardTitle>
                  <CardDescription>Complete user paths through the application</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => exportData(journeysData || [], 'user_journeys')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {journeysData?.map((journey, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Session: {journey.session_id.slice(-8)}
                          </Badge>
                          {journey.device_type && (
                            <Badge variant="secondary">
                              {journey.device_type}
                            </Badge>
                          )}
                          {journey.browser && (
                            <Badge variant="outline">
                              {journey.browser}
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {journey.total_pages} pages • {Math.round(journey.total_time / 60)}m total
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {journey.journey_sequence.map((step, stepIndex) => (
                          <React.Fragment key={stepIndex}>
                            <div className="flex-shrink-0 bg-muted rounded px-2 py-1 text-xs">
                              <div className="font-medium">{step.page_path}</div>
                              {step.time_spent && step.time_spent > 0 && (
                                <div className="text-muted-foreground">
                                  {Math.round(step.time_spent)}s
                                </div>
                              )}
                            </div>
                            {stepIndex < journey.journey_sequence.length - 1 && (
                              <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="raw-data" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Raw Button Click Data</CardTitle>
                <CardDescription>Complete interaction records</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs">
                    {JSON.stringify(buttonClicksData?.slice(0, 10), null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Raw Gesture Data</CardTitle>
                <CardDescription>Complete gesture interaction records</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <pre className="text-xs">
                    {JSON.stringify(gesturesData?.slice(0, 5), null, 2)}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
