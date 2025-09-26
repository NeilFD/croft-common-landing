import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { WalkCard, WalkEntry, Venue, GeoArea } from '@/hooks/useResearch';
import { AnalysisService } from '@/services/analysisService';

interface OccupancyPatternsSectionProps {
  walkCards: WalkCard[];
  walkEntries: WalkEntry[];
  venues: Venue[];
  geoAreas: GeoArea[];
}

export const OccupancyPatternsSection: React.FC<OccupancyPatternsSectionProps> = ({
  walkCards,
  walkEntries,
  venues,
  geoAreas
}) => {
  const [selectedGeoArea, setSelectedGeoArea] = useState<string>('all');

  const dayOfWeekData = useMemo(() => {
    const geoAreaFilter = selectedGeoArea === 'all' ? undefined : selectedGeoArea;
    return AnalysisService.calculateDayOfWeekAnalysis(walkEntries, walkCards, venues, geoAreaFilter);
  }, [walkEntries, walkCards, venues, selectedGeoArea]);

  const timeBlockData = useMemo(() => {
    const geoAreaFilter = selectedGeoArea === 'all' ? undefined : selectedGeoArea;
    return AnalysisService.calculateEnhancedTimeBlockAnalysis(walkEntries, walkCards, venues, geoAreaFilter);
  }, [walkEntries, walkCards, venues, selectedGeoArea]);

  const selectedGeoAreaName = useMemo(() => {
    if (selectedGeoArea === 'all') return 'All Areas';
    const geoArea = geoAreas.find(ga => ga.id === selectedGeoArea);
    return geoArea?.name || 'Unknown Area';
  }, [selectedGeoArea, geoAreas]);

  return (
    <div className="space-y-6">
      {/* Geo Area Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Occupancy Patterns Analysis
          </CardTitle>
          <CardDescription>
            Analyze occupancy patterns by day of week and time of day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="geo-area-filter">Filter by Geographic Area</Label>
            <Select value={selectedGeoArea} onValueChange={setSelectedGeoArea}>
              <SelectTrigger>
                <SelectValue placeholder="Select area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Areas</SelectItem>
                {geoAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Day of Week Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Average Occupancy by Day of Week
          </CardTitle>
          <CardDescription>
            {selectedGeoAreaName} - Occupancy patterns across weekdays
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="dayName" 
                  className="fill-foreground text-xs"
                />
                <YAxis className="fill-foreground text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}${name.includes('Capacity') ? '%' : ''}`,
                    name === 'averageOccupancy' ? 'Avg People' : 
                    name === 'averageCapacityUtilization' ? 'Capacity Utilization' : name
                  ]}
                />
                <Bar 
                  dataKey="averageOccupancy" 
                  fill="hsl(var(--primary))" 
                  name="averageOccupancy"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="averageCapacityUtilization" 
                  fill="hsl(var(--secondary))" 
                  name="averageCapacityUtilization"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary">
                {Math.max(...dayOfWeekData.map(d => d.averageOccupancy)).toFixed(1)}
              </p>
              <p className="text-sm text-muted-foreground">Peak Avg People</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-secondary">
                {Math.max(...dayOfWeekData.map(d => d.averageCapacityUtilization)).toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Peak Capacity</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {dayOfWeekData.reduce((sum, d) => sum + d.totalPeople, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total People</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {dayOfWeekData.reduce((sum, d) => sum + d.walkCount, 0)}
              </p>
              <p className="text-sm text-muted-foreground">Total Walks</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time of Day Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Occupancy by Time of Day
          </CardTitle>
          <CardDescription>
            {selectedGeoAreaName} - How occupancy varies throughout the day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeBlockData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="timeBlock" 
                  className="fill-foreground text-xs"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis className="fill-foreground text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number, name: string) => [
                    `${value}${name.includes('Capacity') || name.includes('occupancy') ? '%' : ''}`,
                    name === 'averagePeople' ? 'Avg People' : 
                    name === 'averageCapacityUtilization' ? 'Capacity Utilization' : 
                    name === 'occupancyRate' ? 'Occupancy Rate' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="averagePeople" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  name="averagePeople"
                />
                <Line 
                  type="monotone" 
                  dataKey="averageCapacityUtilization" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--secondary))', strokeWidth: 2, r: 3 }}
                  name="averageCapacityUtilization"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Time Block Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
            <Card className="bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">Peak Time Block</p>
                    <p className="text-lg font-bold text-primary">
                      {timeBlockData.length > 0 ? timeBlockData[0].timeBlock : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-secondary/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-secondary" />
                  <div>
                    <p className="text-sm font-medium">Peak Capacity</p>
                    <p className="text-lg font-bold text-secondary">
                      {timeBlockData.length > 0 ? 
                        `${Math.max(...timeBlockData.map(d => d.averageCapacityUtilization)).toFixed(1)}%` : 
                        'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-accent/5">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time Blocks</p>
                    <p className="text-lg font-bold">
                      {timeBlockData.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};