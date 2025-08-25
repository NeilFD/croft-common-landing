import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter
} from 'recharts';

type TimeRange = '24h' | '7d' | '30d' | 'all';

interface InteractionAnalytics {
  interaction_type: string;
  count: number;
  avg_duration?: number;
  success_rate?: number;
  page_path?: string;
  element_text?: string;
  button_type?: string;
}

interface GestureAnalytics {
  gesture_name: string;
  attempts: number;
  completions: number;
  success_rate: number;
  avg_duration: number;
  avg_accuracy: number;
}

interface HeatMapData {
  x: number;
  y: number;
  intensity: number;
  page_path: string;
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export const EnhancedUserAnalytics: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
  const [timeRange, setTimeRange] = React.useState<TimeRange>('7d');
  
  const getDateFilter = (range: TimeRange): string | null => {
    if (range === 'all') return null;
    const hours = {
      '24h': 24,
      '7d': 168, // 7 * 24
      '30d': 720 // 30 * 24
    };
    return new Date(Date.now() - hours[range] * 60 * 60 * 1000).toISOString();
  };

  // Fetch interaction analytics
  const { data: interactionData, isLoading: interactionLoading } = useQuery({
    queryKey: ['interaction-analytics', timeRange],
    queryFn: async () => {
      let query = supabase
        .from('user_interactions')
        .select('*');
      
      const dateFilter = getDateFilter(timeRange);
      if (dateFilter) {
        query = query.gte('created_at', dateFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 60000,
  });

  // Process interaction analytics
  const interactionAnalytics = useMemo(() => {
    if (!interactionData) return [];
    
    const analytics: Record<string, InteractionAnalytics> = {};
    
    interactionData.forEach(interaction => {
      const key = interaction.interaction_type;
      if (!analytics[key]) {
        analytics[key] = {
          interaction_type: key,
          count: 0,
          avg_duration: 0,
          success_rate: 0
        };
      }
      analytics[key].count++;
      
      // Extract additional data for specific interaction types
      if (interaction.additional_data) {
        const data = interaction.additional_data as any;
        if (data.button_type) {
          analytics[key].button_type = data.button_type;
        }
      }
    });
    
    return Object.values(analytics).sort((a, b) => b.count - a.count);
  }, [interactionData]);

  // Process gesture analytics
  const gestureAnalytics = useMemo(() => {
    if (!interactionData) return [];
    
    const gestures: Record<string, { attempts: number; completions: number; durations: number[]; accuracies: number[] }> = {};
    
    interactionData
      .filter(i => i.interaction_type.startsWith('secret_gesture_'))
      .forEach(interaction => {
        const gestureName = (interaction.additional_data as any)?.gesture_name || 'unknown';
        if (!gestures[gestureName]) {
          gestures[gestureName] = { attempts: 0, completions: 0, durations: [], accuracies: [] };
        }
        
        if (interaction.interaction_type === 'secret_gesture_attempt') {
          gestures[gestureName].attempts++;
        } else if (interaction.interaction_type === 'secret_gesture_complete') {
          gestures[gestureName].completions++;
          const gestureData = (interaction.additional_data as any)?.gesture_data;
          if (gestureData?.duration) {
            gestures[gestureName].durations.push(gestureData.duration);
          }
          if (gestureData?.accuracy) {
            gestures[gestureName].accuracies.push(gestureData.accuracy);
          }
        }
      });
    
    return Object.entries(gestures).map(([name, data]): GestureAnalytics => ({
      gesture_name: name,
      attempts: data.attempts,
      completions: data.completions,
      success_rate: data.attempts > 0 ? (data.completions / data.attempts) * 100 : 0,
      avg_duration: data.durations.length > 0 ? data.durations.reduce((a, b) => a + b, 0) / data.durations.length : 0,
      avg_accuracy: data.accuracies.length > 0 ? data.accuracies.reduce((a, b) => a + b, 0) / data.accuracies.length : 0
    }));
  }, [interactionData]);

  // Process button performance
  const buttonPerformance = useMemo(() => {
    if (!interactionData) return [];
    
    const buttons: Record<string, { type: string; count: number; pages: Set<string> }> = {};
    
    interactionData
      .filter(i => i.interaction_type === 'button_click')
      .forEach(interaction => {
        const buttonType = (interaction.additional_data as any)?.button_type || 'unknown';
        const key = `${buttonType}_${interaction.element_text || 'unnamed'}`;
        
        if (!buttons[key]) {
          buttons[key] = { type: buttonType, count: 0, pages: new Set() };
        }
        buttons[key].count++;
        buttons[key].pages.add(interaction.page_path);
      });
    
    return Object.entries(buttons)
      .map(([name, data]) => ({
        name: name.split('_').slice(1).join('_') || 'Unnamed',
        type: data.type,
        count: data.count,
        pages: data.pages.size
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [interactionData]);

  // Process click heat map data
  const heatMapData = useMemo(() => {
    if (!interactionData) return [];
    
    return interactionData
      .filter(i => i.coordinates)
      .map(interaction => ({
        x: (interaction.coordinates as any)?.x || 0,
        y: (interaction.coordinates as any)?.y || 0,
        intensity: 1,
        page_path: interaction.page_path
      }))
      .slice(0, 200); // Limit for performance
  }, [interactionData]);

  if (interactionLoading) {
    return <div className="p-4">Loading enhanced analytics...</div>;
  }

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Enhanced User Analytics</h2>
        <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="interactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="gestures">Secret Gestures</TabsTrigger>
          <TabsTrigger value="buttons">Button Performance</TabsTrigger>
          <TabsTrigger value="heatmap">Click Heat Map</TabsTrigger>
          <TabsTrigger value="flows">User Flows</TabsTrigger>
        </TabsList>

        <TabsContent value="interactions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Interaction Types</CardTitle>
                <CardDescription>Distribution of all interaction types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={interactionAnalytics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="interaction_type"
                    >
                      {interactionAnalytics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Interaction Volume</CardTitle>
                <CardDescription>Number of interactions by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={interactionAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="interaction_type" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gestures" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Secret Gesture Performance</CardTitle>
                <CardDescription>Success rates and attempts for secret gestures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gestureAnalytics.map((gesture, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{gesture.gesture_name}</span>
                        <Badge variant={gesture.success_rate > 50 ? "default" : "destructive"}>
                          {gesture.success_rate.toFixed(1)}% success
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {gesture.attempts} attempts • {gesture.completions} completions
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Avg Duration: {(gesture.avg_duration / 1000).toFixed(1)}s • 
                        Avg Accuracy: {(gesture.avg_accuracy * 100).toFixed(1)}%
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${gesture.success_rate}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gesture Attempts vs Completions</CardTitle>
                <CardDescription>Visual comparison of gesture performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={gestureAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="gesture_name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="attempts" fill="#ff7300" name="Attempts" />
                    <Bar dataKey="completions" fill="#82ca9d" name="Completions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="buttons" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Button Performance</CardTitle>
              <CardDescription>Most clicked buttons and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {buttonPerformance.map((button, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{button.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Type: {button.type} • Appears on {button.pages} page(s)
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {button.count} clicks
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Click Heat Map</CardTitle>
              <CardDescription>Visual representation of where users click</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ScatterChart data={heatMapData}>
                  <CartesianGrid />
                  <XAxis dataKey="x" name="X Position" />
                  <YAxis dataKey="y" name="Y Position" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Scatter dataKey="intensity" fill="#8884d8" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Interaction Flows</CardTitle>
              <CardDescription>Coming soon - Advanced user journey analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Advanced user flow visualization will be implemented next
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );

  return embedded ? content : <div className="p-6">{content}</div>;
};