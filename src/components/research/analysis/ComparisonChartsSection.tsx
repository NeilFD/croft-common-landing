import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Calendar, Clock } from 'lucide-react';
import { WalkCard, WalkEntry, Venue, GeoArea } from '@/hooks/useResearch';
import { AnalysisService } from '@/services/analysisService';
import { ComparisonUtils, ComparisonResult } from '@/utils/comparisonUtils';

interface ComparisonChartsSectionProps {
  walkCards: WalkCard[];
  walkEntries: WalkEntry[];
  venues: Venue[];
  geoAreas: GeoArea[];
}

export const ComparisonChartsSection: React.FC<ComparisonChartsSectionProps> = ({
  walkCards,
  walkEntries,
  venues,
  geoAreas
}) => {
  const dayComparisons = useMemo(() => 
    AnalysisService.calculateDayComparisons(walkEntries, walkCards),
    [walkEntries, walkCards]
  );

  const timeBlockAnalysis = useMemo(() => 
    AnalysisService.calculateTimeBlockAnalysis(walkEntries, walkCards),
    [walkEntries, walkCards]
  );

  const dayOverDayComparisons = useMemo(() => {
    if (dayComparisons.length < 2) return [];
    
    return ComparisonUtils.calculateDayOverDay(
      dayComparisons,
      (item) => item.date,
      (items) => items.reduce((sum, item) => sum + item.totalPeople, 0)
    );
  }, [dayComparisons]);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'stable':
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const ComparisonCard: React.FC<{ comparison: ComparisonResult }> = ({ comparison }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-2">
        {getTrendIcon(comparison.trend)}
        <span className="text-sm font-medium">{comparison.label.split(' vs ')[0]}</span>
      </div>
      <div className="text-right">
        <p className="text-lg font-bold">{comparison.current}</p>
        <p className={`text-xs ${ComparisonUtils.getTrendColor(comparison.trend)}`}>
          {ComparisonUtils.formatTrend(comparison)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Daily Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Daily Footfall Trends
            </CardTitle>
            <CardDescription>
              Daily comparison of total people observed across all venues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dayComparisons.slice().reverse()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                  formatter={(value, name) => [value, 'Total People']}
                />
                <Area 
                  type="monotone" 
                  dataKey="totalPeople" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Block Performance
            </CardTitle>
            <CardDescription>
              Average occupancy levels and capacity utilization by time of day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={timeBlockAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timeBlock" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    typeof value === 'number' ? Math.round(value * 10) / 10 : value,
                    name
                  ]}
                />
                <Bar 
                  dataKey="averagePeople" 
                  fill="hsl(var(--primary))" 
                  name="Avg People"
                />
                <Bar 
                  dataKey="averageCapacityUtilization" 
                  fill="hsl(var(--secondary))" 
                  name="Avg Capacity %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Day-over-Day Comparisons */}
      {dayOverDayComparisons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Day-over-Day Analysis
            </CardTitle>
            <CardDescription>
              Compare consecutive days to identify trends and patterns
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayOverDayComparisons.slice(0, 6).map((comparison, index) => (
                <ComparisonCard key={index} comparison={comparison} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capacity Utilization Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Capacity Utilization Trends</CardTitle>
          <CardDescription>
            How effectively venues are utilizing their maximum capacity over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dayComparisons.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <YAxis 
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                formatter={(value: any) => [`${Math.round(value * 10) / 10}%`, 'Avg Capacity Utilization']}
              />
              <Line 
                type="monotone" 
                dataKey="averagePeople" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Avg Capacity Utilization"
                dot={{ fill: 'hsl(var(--primary))' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Weather Impact Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Weather Impact Analysis</CardTitle>
          <CardDescription>
            How weather conditions affect venue occupancy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dayComparisons.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-GB', { 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('en-GB')}
                formatter={(value, name, props) => [
                  value,
                  name,
                  `Weather: ${props.payload?.weatherPreset || 'Unknown'}`
                ]}
              />
              <Bar 
                dataKey="averagePeople" 
                fill="hsl(var(--primary))"
                name="Avg People per Venue"
              />
            </BarChart>
          </ResponsiveContainer>
          
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(new Set(dayComparisons.map(d => d.weatherPreset))).map(weather => (
              <Badge key={weather} variant="secondary">
                {weather}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};