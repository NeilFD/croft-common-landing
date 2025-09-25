import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { MapPin, Users, TrendingUp, Clock, Award } from 'lucide-react';
import { WalkCard, WalkEntry, Venue, GeoArea } from '@/hooks/useResearch';
import { AnalysisService, GeoAreaAnalysis } from '@/services/analysisService';

interface GeoAnalyticsMapProps {
  walkCards: WalkCard[];
  walkEntries: WalkEntry[];
  venues: Venue[];
  geoAreas: GeoArea[];
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--secondary))',
  'hsl(210, 100%, 60%)',
  'hsl(120, 100%, 40%)',
  'hsl(30, 100%, 50%)',
  'hsl(270, 100%, 60%)'
];

export const GeoAnalyticsMap: React.FC<GeoAnalyticsMapProps> = ({
  walkCards,
  walkEntries,
  venues,
  geoAreas
}) => {
  const geoAnalysis = useMemo(() => 
    AnalysisService.calculateGeoAreaAnalysis(walkEntries, venues, geoAreas, walkCards),
    [walkEntries, venues, geoAreas, walkCards]
  );

  const pieChartData = useMemo(() => 
    geoAnalysis.map((area, index) => ({
      name: area.geoAreaName,
      value: area.totalPeople,
      color: COLORS[index % COLORS.length],
      percentage: Math.round((area.totalPeople / geoAnalysis.reduce((sum, a) => sum + a.totalPeople, 0)) * 100)
    })),
    [geoAnalysis]
  );

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return 'default';
    if (rank <= 3) return 'secondary';
    return 'outline';
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 70) return 'text-green-600 bg-green-50';
    if (rate >= 50) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const GeoAreaCard: React.FC<{ area: GeoAreaAnalysis; index: number }> = ({ area, index }) => (
    <div className="p-4 border rounded-lg hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            {area.geoAreaName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {area.venueCount} venue{area.venueCount !== 1 ? 's' : ''} surveyed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {area.performanceRank <= 3 && <Award className="h-4 w-4 text-yellow-500" />}
          <Badge variant={getRankBadgeVariant(area.performanceRank)}>
            #{area.performanceRank}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="text-center p-2 bg-background rounded">
          <p className="text-xs text-muted-foreground">Total People</p>
          <p className="text-2xl font-bold text-primary">{area.totalPeople}</p>
        </div>
        <div className="text-center p-2 bg-background rounded">
          <p className="text-xs text-muted-foreground">Avg per Visit</p>
          <p className="text-2xl font-bold">{area.averagePeople}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Occupancy Rate</span>
          <span className={`text-sm font-semibold px-2 py-1 rounded ${getOccupancyColor(area.occupancyRate)}`}>
            {area.occupancyRate}%
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Peak Time</span>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3 w-3" />
            {area.peakTimeBlock}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Total Visits</span>
          <span className="text-sm font-medium">{area.visitCount}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t">
        <div className="w-full bg-secondary rounded-full h-2">
          <div 
            className="h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min((area.totalPeople / Math.max(...geoAnalysis.map(g => g.totalPeople))) * 100, 100)}%`,
              backgroundColor: COLORS[index % COLORS.length]
            }}
          />
        </div>
        <p className="text-xs text-center mt-1 text-muted-foreground">
          Relative Performance
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Geographic Distribution Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Geographic Distribution
            </CardTitle>
            <CardDescription>
              Footfall distribution across different areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Total People']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Area Performance Comparison
            </CardTitle>
            <CardDescription>
              Average occupancy rates by geographic area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={geoAnalysis}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="geoAreaName" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar 
                  dataKey="occupancyRate" 
                  fill="hsl(var(--primary))"
                  name="Occupancy Rate (%)"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Area Performance Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Area Performance Analysis
          </CardTitle>
          <CardDescription>
            Detailed breakdown of each geographic area's performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {geoAnalysis.map((area, index) => (
              <GeoAreaCard key={area.geoAreaId} area={area} index={index} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Summary</CardTitle>
          <CardDescription>
            Key insights from geographic analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="text-lg font-semibold text-primary">
                {geoAnalysis.reduce((sum, area) => sum + area.totalPeople, 0)}
              </h3>
              <p className="text-sm text-muted-foreground">Total People</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="text-lg font-semibold text-primary">
                {geoAnalysis.reduce((sum, area) => sum + area.venueCount, 0)}
              </h3>
              <p className="text-sm text-muted-foreground">Total Venues</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <h3 className="text-lg font-semibold text-primary">
                {Math.round(geoAnalysis.reduce((sum, area) => sum + area.occupancyRate, 0) / geoAnalysis.length)}%
              </h3>
              <p className="text-sm text-muted-foreground">Avg Occupancy</p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <h3 className="text-lg font-semibold text-primary">
                {geoAnalysis.length > 0 ? geoAnalysis[0].geoAreaName : 'N/A'}
              </h3>
              <p className="text-sm text-muted-foreground">Top Performer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};