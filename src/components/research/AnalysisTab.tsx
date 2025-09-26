import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, BarChart3, TrendingUp, Users, MapPin, Calendar, Trophy, Map } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';
import { toast } from 'sonner';
import { AnalysisService } from '@/services/analysisService';
import { ComparisonChartsSection } from './analysis/ComparisonChartsSection';
import { VenuePerformanceGrid } from './analysis/VenuePerformanceGrid';
import { GeoAnalyticsMap } from './analysis/GeoAnalyticsMap';
import { RecalculateCapacityButton } from './RecalculateCapacityButton';

export const AnalysisTab = () => {
  const { walkCards, venues, geoAreas, allWalkEntries, fetchAllWalkEntries } = useResearch();
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    timeBlocks: [] as string[],
    geoAreas: [] as string[],
    croftZones: [] as string[],
    weatherPresets: [] as string[]
  });

  const timeBlocks = ['EarlyMorning', 'MidMorning', 'Lunch', 'MidAfternoon', 'EarlyEvening', 'Evening', 'Late'];
  const croftZones = ['Café', 'Cocktail Bar', 'Beer Hall', 'Kitchens'];
  const weatherPresets = ['Sunny', 'Overcast', 'Rain', 'Mixed', 'ColdSnap', 'Heatwave'];

  const filteredCards = walkCards.filter(card => {
    if (filters.startDate && card.date < filters.startDate) return false;
    if (filters.endDate && card.date > filters.endDate) return false;
    if (filters.timeBlocks.length && !filters.timeBlocks.includes(card.time_block)) return false;
    if (filters.weatherPresets.length && !filters.weatherPresets.includes(card.weather_preset)) return false;
    if (filters.croftZones.length && !card.croft_zones.some(zone => filters.croftZones.includes(zone))) return false;
    return true;
  });

  const handleExportCSV = () => {
    // Simple CSV export implementation
    const csvData = filteredCards.map(card => ({
      Date: card.date,
      TimeBlock: card.time_block,
      Weather: card.weather_preset,
      Status: card.status,
      CroftZones: card.croft_zones.join(';')
    }));

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-data-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully');
  };

  const metrics = AnalysisService.calculateMetrics(allWalkEntries, walkCards, venues);

  // Fetch all walk entries when component mounts
  React.useEffect(() => {
    fetchAllWalkEntries();
  }, [fetchAllWalkEntries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Research Analysis</h1>
          <p className="text-muted-foreground">
            Comprehensive analysis of walk data and venue performance
          </p>
        </div>
        <div className="flex gap-2">
          <RecalculateCapacityButton />
          <Button onClick={handleExportCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analysis Filters
          </CardTitle>
          <CardDescription>Filter data to focus your analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Time Block</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="All time blocks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time Blocks</SelectItem>
                  {timeBlocks.map(block => (
                    <SelectItem key={block} value={block}>{block}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleExportCSV} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total People</p>
                <p className="text-2xl font-bold">{metrics.totalPeople}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Avg per Venue</p>
                <p className="text-2xl font-bold">{metrics.averagePeoplePerVenue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Venues Surveyed</p>
                <p className="text-2xl font-bold">{metrics.totalVenues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Walk Cards</p>
                <p className="text-2xl font-bold">{metrics.totalWalks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Analytics Tabs */}
      <Tabs defaultValue="comparisons" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="comparisons" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Comparisons
          </TabsTrigger>
          <TabsTrigger value="venues" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            Venues
          </TabsTrigger>
          <TabsTrigger value="geography" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            Geography
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparisons">
          <ComparisonChartsSection 
            walkCards={filteredCards}
            walkEntries={allWalkEntries}
            venues={venues}
            geoAreas={geoAreas}
          />
        </TabsContent>

        <TabsContent value="venues">
          <VenuePerformanceGrid 
            walkCards={filteredCards}
            walkEntries={allWalkEntries}
            venues={venues}
            geoAreas={geoAreas}
          />
        </TabsContent>

        <TabsContent value="geography">
          <GeoAnalyticsMap 
            walkCards={filteredCards}
            walkEntries={allWalkEntries}
            venues={venues}
            geoAreas={geoAreas}
          />
        </TabsContent>

        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Walk Cards Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Walk Cards Overview</CardTitle>
                <CardDescription>Summary of research sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredCards.map((card) => (
                    <div key={card.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{card.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {card.date} • {card.time_block} • {card.weather_preset}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">Status: {card.status}</p>
                        <p className="text-sm text-muted-foreground">
                          Zones: {card.croft_zones.join(', ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};