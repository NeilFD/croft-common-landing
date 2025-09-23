import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';
import { toast } from 'sonner';

export const AnalysisTab = () => {
  const { walkCards, venues, geoAreas, walkEntries } = useResearch();
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

  const getTotalPeopleCount = () => {
    return walkEntries.reduce((sum, entry) => sum + entry.people_count, 0);
  };

  const getTotalLaptopCount = () => {
    return walkEntries.reduce((sum, entry) => sum + entry.laptop_count, 0);
  };

  const getAveragePeoplePerVenue = () => {
    const totalEntries = walkEntries.length;
    if (totalEntries === 0) return 0;
    return Math.round((getTotalPeopleCount() / totalEntries) * 10) / 10;
  };

  return (
    <div className="space-y-6">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium text-muted-foreground">Total People</p>
                <p className="text-2xl font-bold">{getTotalPeopleCount()}</p>
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
                <p className="text-2xl font-bold">{getAveragePeoplePerVenue()}</p>
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
                <p className="text-2xl font-bold">{walkEntries.length}</p>
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
                <p className="text-2xl font-bold">{filteredCards.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cards View */}
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

      {/* P&L Overlay Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>P&L Comparison</CardTitle>
          <CardDescription>Compare observed data with forecasts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>P&L overlay feature coming soon</p>
            <p className="text-sm">This will show actual vs forecast comparisons</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};