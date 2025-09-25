import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, MapPin, Users, Calendar, AlertTriangle, TrendingUp,
  ArrowUpDown, Filter
} from 'lucide-react';
import { WalkCard, WalkEntry, Venue, GeoArea } from '@/hooks/useResearch';
import { AnalysisService, VenuePerformance } from '@/services/analysisService';

interface VenuePerformanceGridProps {
  walkCards: WalkCard[];
  walkEntries: WalkEntry[];
  venues: Venue[];
  geoAreas: GeoArea[];
}

type SortField = 'performanceScore' | 'totalPeople' | 'averagePeople' | 'totalVisits' | 'occupancyRate';

export const VenuePerformanceGrid: React.FC<VenuePerformanceGridProps> = ({
  walkCards,
  walkEntries,
  venues,
  geoAreas
}) => {
  const [sortField, setSortField] = useState<SortField>('performanceScore');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [geoAreaFilter, setGeoAreaFilter] = useState<string>('all');

  const venuePerformance = useMemo(() => {
    const performance = AnalysisService.calculateVenuePerformance(
      walkEntries, 
      venues, 
      geoAreas, 
      walkCards
    );

    // Apply geo area filter
    let filtered = performance;
    if (geoAreaFilter !== 'all') {
      const geoArea = geoAreas.find(g => g.id === geoAreaFilter);
      if (geoArea) {
        filtered = performance.filter(v => v.geoAreaName === geoArea.name);
      }
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const multiplier = sortOrder === 'desc' ? -1 : 1;
      return (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) * multiplier;
    });
  }, [walkEntries, venues, geoAreas, walkCards, sortField, sortOrder, geoAreaFilter]);

  const topPerformers = venuePerformance.slice(0, 3);
  const underPerformers = venuePerformance.slice(-3).reverse();

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getPerformanceBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const VenueCard: React.FC<{ venue: VenuePerformance; rank: number }> = ({ venue, rank }) => (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg">{venue.venueName}</h3>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {venue.geoAreaName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {rank <= 3 && <Trophy className="h-4 w-4 text-yellow-500" />}
          <Badge variant={getPerformanceBadgeVariant(venue.performanceScore)}>
            #{rank}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-muted-foreground">Total People</p>
          <p className="text-xl font-bold">{venue.totalPeople}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Avg People</p>
          <p className="text-xl font-bold">{venue.averagePeople}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Occupancy Rate</p>
          <p className={`text-lg font-semibold ${getOccupancyColor(venue.occupancyRate)}`}>
            {venue.occupancyRate}%
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Visits</p>
          <p className="text-lg font-semibold">{venue.totalVisits}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Peak: {venue.peakTime}</span>
        {venue.anomalyCount > 0 && (
          <div className="flex items-center gap-1 text-orange-600">
            <AlertTriangle className="h-3 w-3" />
            {venue.anomalyCount} anomal{venue.anomalyCount === 1 ? 'y' : 'ies'}
          </div>
        )}
      </div>

      <div className="mt-2">
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${Math.min(venue.performanceScore, 100)}%` }}
          />
        </div>
        <p className="text-xs text-center mt-1">Performance: {venue.performanceScore}/100</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Performance Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performanceScore">Performance Score</SelectItem>
                  <SelectItem value="totalPeople">Total People</SelectItem>
                  <SelectItem value="averagePeople">Average People</SelectItem>
                  <SelectItem value="totalVisits">Total Visits</SelectItem>
                  <SelectItem value="occupancyRate">Occupancy Rate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === 'desc' ? 'Descending' : 'Ascending'}
            </Button>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Area:</label>
              <Select value={geoAreaFilter} onValueChange={setGeoAreaFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Areas</SelectItem>
                  {geoAreas.map(geoArea => (
                    <SelectItem key={geoArea.id} value={geoArea.id}>
                      {geoArea.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Performers Highlight */}
      {topPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Highest performing venues based on comprehensive metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformers.map((venue, index) => (
                <VenueCard key={venue.venueId} venue={venue} rank={index + 1} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Venues Performance Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            All Venues Performance
          </CardTitle>
          <CardDescription>
            Comprehensive performance analysis for all surveyed venues
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {venuePerformance.map((venue, index) => (
              <VenueCard key={venue.venueId} venue={venue} rank={index + 1} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Underperformers Alert */}
      {underPerformers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Areas for Improvement
            </CardTitle>
            <CardDescription>
              Venues that may benefit from additional attention or analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {underPerformers.map((venue, index) => (
                <VenueCard 
                  key={venue.venueId} 
                  venue={venue} 
                  rank={venuePerformance.length - underPerformers.length + index + 1} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};