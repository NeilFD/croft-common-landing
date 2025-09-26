import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Clock, Calendar, MapPin, TrendingUp, Filter, X } from 'lucide-react';
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
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<number[]>([]);
  const [selectedTimeBlocks, setSelectedTimeBlocks] = useState<string[]>([]);

  // Get available filter options
  const availableTimeBlocks = useMemo(() => {
    const timeBlocks = new Set<string>();
    walkCards.forEach(card => timeBlocks.add(card.time_block));
    return Array.from(timeBlocks).sort();
  }, [walkCards]);

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Apply filters to data
  const filteredWalkEntries = useMemo(() => {
    const walkCardMap = new Map(walkCards.map(wc => [wc.id, wc]));
    
    return walkEntries.filter(entry => {
      const walkCard = walkCardMap.get(entry.walk_card_id);
      if (!walkCard) return false;
      
      // Apply day of week filter
      if (selectedDaysOfWeek.length > 0) {
        const dayOfWeek = new Date(walkCard.date).getDay();
        if (!selectedDaysOfWeek.includes(dayOfWeek)) return false;
      }
      
      // Apply time block filter
      if (selectedTimeBlocks.length > 0) {
        if (!selectedTimeBlocks.includes(walkCard.time_block)) return false;
      }
      
      return true;
    });
  }, [walkEntries, walkCards, selectedDaysOfWeek, selectedTimeBlocks]);

  const dayOfWeekData = useMemo(() => {
    const geoAreaFilter = selectedGeoArea === 'all' ? undefined : selectedGeoArea;
    return AnalysisService.calculateDayOfWeekAnalysis(filteredWalkEntries, walkCards, venues, geoAreaFilter);
  }, [filteredWalkEntries, walkCards, venues, selectedGeoArea]);

  const timeBlockData = useMemo(() => {
    const geoAreaFilter = selectedGeoArea === 'all' ? undefined : selectedGeoArea;
    return AnalysisService.calculateEnhancedTimeBlockAnalysis(filteredWalkEntries, walkCards, venues, geoAreaFilter);
  }, [filteredWalkEntries, walkCards, venues, selectedGeoArea]);

  const selectedGeoAreaName = useMemo(() => {
    if (selectedGeoArea === 'all') return 'All Areas';
    const geoArea = geoAreas.find(ga => ga.id === selectedGeoArea);
    return geoArea?.name || 'Unknown Area';
  }, [selectedGeoArea, geoAreas]);

  // Helper functions for filters
  const handleDayOfWeekToggle = (dayIndex: number) => {
    setSelectedDaysOfWeek(prev =>
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex]
    );
  };

  const handleTimeBlockToggle = (timeBlock: string) => {
    setSelectedTimeBlocks(prev =>
      prev.includes(timeBlock)
        ? prev.filter(tb => tb !== timeBlock)
        : [...prev, timeBlock]
    );
  };

  const clearAllFilters = () => {
    setSelectedDaysOfWeek([]);
    setSelectedTimeBlocks([]);
    setSelectedGeoArea('all');
  };

  const hasActiveFilters = selectedDaysOfWeek.length > 0 || selectedTimeBlocks.length > 0 || selectedGeoArea !== 'all';

  return (
    <div className="space-y-6">
      {/* Enhanced Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Occupancy Patterns Analysis
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllFilters}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Filter occupancy patterns by geographic area, days of week, and time blocks for detailed analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Geographic Area Filter */}
          <div className="space-y-2">
            <Label htmlFor="geo-area-filter">Geographic Area</Label>
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

          {/* Day of Week Filter */}
          <div className="space-y-3">
            <Label>Days of Week</Label>
            <div className="flex flex-wrap gap-2">
              {dayNames.map((dayName, dayIndex) => (
                <div key={dayIndex} className="flex items-center space-x-2">
                  <Checkbox
                    id={`day-${dayIndex}`}
                    checked={selectedDaysOfWeek.includes(dayIndex)}
                    onCheckedChange={() => handleDayOfWeekToggle(dayIndex)}
                  />
                  <Label htmlFor={`day-${dayIndex}`} className="text-sm font-normal cursor-pointer">
                    {dayName}
                  </Label>
                </div>
              ))}
            </div>
            {selectedDaysOfWeek.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedDaysOfWeek.map(dayIndex => (
                  <Badge key={dayIndex} variant="secondary" className="text-xs">
                    {dayNames[dayIndex]}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleDayOfWeekToggle(dayIndex)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Time Block Filter */}
          <div className="space-y-3">
            <Label>Time Blocks</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {availableTimeBlocks.map(timeBlock => (
                <div key={timeBlock} className="flex items-center space-x-2">
                  <Checkbox
                    id={`time-${timeBlock}`}
                    checked={selectedTimeBlocks.includes(timeBlock)}
                    onCheckedChange={() => handleTimeBlockToggle(timeBlock)}
                  />
                  <Label htmlFor={`time-${timeBlock}`} className="text-sm font-normal cursor-pointer">
                    {timeBlock}
                  </Label>
                </div>
              ))}
            </div>
            {selectedTimeBlocks.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTimeBlocks.map(timeBlock => (
                  <Badge key={timeBlock} variant="secondary" className="text-xs">
                    {timeBlock}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 ml-1"
                      onClick={() => handleTimeBlockToggle(timeBlock)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            )}
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
            {selectedGeoAreaName} - 
            {selectedDaysOfWeek.length > 0 && ` ${selectedDaysOfWeek.map(d => dayNames[d]).join(', ')} only -`}
            {selectedTimeBlocks.length > 0 && ` ${selectedTimeBlocks.join(', ')} blocks only -`}
            {' '}Occupancy patterns across weekdays
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
                    backgroundColor: '#ffffff',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    color: '#000000'
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value}${name.includes('Capacity') ? '%' : ''}`,
                    name === 'averageOccupancy' ? 'Avg People' : 
                    name === 'averageCapacityUtilization' ? 'Capacity Utilization' : name
                  ]}
                  labelFormatter={(label: string, payload: any[]) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload;
                      const timeBlocksText = data.timeBlocks && data.timeBlocks.length > 0 
                        ? ` (${data.timeBlocks.join(', ')})` 
                        : '';
                      return `${label}${timeBlocksText}`;
                    }
                    return label;
                  }}
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
            {selectedGeoAreaName} - 
            {selectedDaysOfWeek.length > 0 && ` ${selectedDaysOfWeek.map(d => dayNames[d]).join(', ')} only -`}
            {selectedTimeBlocks.length > 0 && ` ${selectedTimeBlocks.join(', ')} blocks only -`}
            {' '}How occupancy varies throughout the day
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
                    backgroundColor: '#ffffff',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                    color: '#000000'
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