import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Users, 
  Laptop, 
  Camera, 
  Flag, 
  Clock, 
  CloudRain,
  CheckCircle,
  Building2,
  Settings
} from 'lucide-react';
import { useResearch, WalkCard, WalkEntry, Venue, GeoArea } from '@/hooks/useResearch';
import { VenueGrid } from './VenueGrid';
import { GeoAreaManager } from './GeoAreaManager';
import { QuickVenueCreator } from './QuickVenueCreator';
import { toast } from 'sonner';

interface ActiveWalkCardProps {
  walkCard: WalkCard;
}

export const ActiveWalkCard: React.FC<ActiveWalkCardProps> = ({ walkCard }) => {
  const { 
    venues, 
    geoAreas, 
    walkEntries, 
    fetchWalkEntries, 
    fetchWalkCardGeoAreas,
    upsertWalkEntry, 
    updateWalkCardStatus,
    loading 
  } = useResearch();
  
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showGeoAreaManager, setShowGeoAreaManager] = useState(false);
  const [walkGeoAreas, setWalkGeoAreas] = useState<GeoArea[]>([]);
  const [entryData, setEntryData] = useState<Partial<WalkEntry>>({
    people_count: 0,
    laptop_count: 0,
    is_closed: false,
    flag_anomaly: false,
    notes: ''
  });

  // Get venues from walk's selected geo areas
  const walkVenues = venues.filter(venue => 
    walkGeoAreas.some(area => area.id === venue.geo_area_id)
  );

  const currentEntry = selectedVenue ? walkEntries.find(entry => 
    entry.venue_id === selectedVenue.id && entry.walk_card_id === walkCard.id
  ) : null;

  // Load walk data
  useEffect(() => {
    const loadWalkData = async () => {
      if (walkCard.id) {
        await fetchWalkEntries(walkCard.id);
        const geoAreasData = await fetchWalkCardGeoAreas(walkCard.id);
        setWalkGeoAreas(geoAreasData);
      }
    };
    
    loadWalkData();
  }, [walkCard.id, fetchWalkEntries, fetchWalkCardGeoAreas]);

  // Update entry data when venue selection changes
  useEffect(() => {
    if (currentEntry) {
      setEntryData({
        people_count: currentEntry.people_count,
        laptop_count: currentEntry.laptop_count,
        is_closed: currentEntry.is_closed,
        flag_anomaly: currentEntry.flag_anomaly,
        notes: currentEntry.notes || ''
      });
    } else {
      setEntryData({
        people_count: 0,
        laptop_count: 0,
        is_closed: false,
        flag_anomaly: false,
        notes: ''
      });
    }
  }, [currentEntry]);

  const handleGeoAreaUpdate = async () => {
    const geoAreasData = await fetchWalkCardGeoAreas(walkCard.id);
    setWalkGeoAreas(geoAreasData);
  };

  const handleSaveEntry = async () => {
    if (!selectedVenue) return;

    await upsertWalkEntry({
      walk_card_id: walkCard.id,
      venue_id: selectedVenue.id,
      ...entryData
    });

    toast.success('Entry saved');
  };

  const handleVenueSelect = (venue: Venue) => {
    // Save current entry before switching
    if (selectedVenue && entryData) {
      handleSaveEntry();
    }
    setSelectedVenue(venue);
  };

  const handleCompleteWalk = async () => {
    await handleSaveEntry();
    await updateWalkCardStatus(walkCard.id, 'Completed');
    toast.success('Walk completed!');
  };

  const completedEntries = walkEntries.filter(entry => 
    walkVenues.some(venue => venue.id === entry.venue_id)
  ).length;

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Walk Header */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="space-y-3">
            {/* Title and Status */}
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="truncate">{walkCard.title}</span>
              </CardTitle>
              <Badge variant="secondary" className="shrink-0">Active</Badge>
            </div>
            
            {/* Walk Details - Stacked on Mobile */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <span>{walkCard.date}</span>
                <span>•</span>
                <span>{walkCard.time_block}</span>
              </div>
              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <CloudRain className="h-3 w-3" />
                {walkCard.weather_preset}
                {walkCard.weather_temp_c && ` ${walkCard.weather_temp_c}°C`}
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {completedEntries} of {walkVenues.length} venues completed
              </p>
            </div>
            
            {/* Full-width button on mobile */}
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full sm:w-auto"
              onClick={() => setShowGeoAreaManager(!showGeoAreaManager)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Manage Areas
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Geo Area Manager */}
      {showGeoAreaManager && (
        <div className="space-y-4">
          <GeoAreaManager 
            walkCardId={walkCard.id} 
            onUpdate={handleGeoAreaUpdate}
          />
          <QuickVenueCreator
            selectedGeoAreaIds={walkGeoAreas.map(area => area.id)}
            onVenueCreated={handleGeoAreaUpdate}
          />
        </div>
      )}

      {walkVenues.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-muted-foreground">No venues available for this walk</p>
              <p className="text-sm text-muted-foreground mt-2">
                Add geo areas to this walk to see available venues
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Venue Grid */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Venues</CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <VenueGrid
                venues={walkVenues}
                walkEntries={walkEntries}
                onVenueSelect={handleVenueSelect}
                selectedVenue={selectedVenue}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </CardContent>
          </Card>

          {/* Venue Entry Form */}
          {selectedVenue ? (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="space-y-2">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="truncate">{selectedVenue.name}</span>
                  </CardTitle>
                  {selectedVenue.address && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{selectedVenue.address}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                {/* Quick Status */}
                <div className="flex items-center space-x-2 min-h-[44px]">
                  <Checkbox
                    id="closed"
                    checked={entryData.is_closed}
                    onCheckedChange={(checked) => 
                      setEntryData(prev => ({ ...prev, is_closed: checked as boolean }))
                    }
                    className="h-5 w-5"
                  />
                  <Label htmlFor="closed" className="text-sm sm:text-base">Venue is closed</Label>
                </div>

                {!entryData.is_closed && (
                  <>
                    {/* People Count - Stacked on mobile */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="people-count" className="flex items-center gap-2 text-sm sm:text-base">
                          <Users className="h-4 w-4" />
                          People Count
                        </Label>
                        <Input
                          id="people-count"
                          type="number"
                          min="0"
                          value={entryData.people_count || 0}
                          onChange={(e) => 
                            setEntryData(prev => ({ 
                              ...prev, 
                              people_count: parseInt(e.target.value) || 0 
                            }))
                          }
                          className="h-11 text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="laptop-count" className="flex items-center gap-2 text-sm sm:text-base">
                          <Laptop className="h-4 w-4" />
                          Laptop Count
                        </Label>
                        <Input
                          id="laptop-count"
                          type="number"
                          min="0"
                          value={entryData.laptop_count || 0}
                          onChange={(e) => 
                            setEntryData(prev => ({ 
                              ...prev, 
                              laptop_count: parseInt(e.target.value) || 0 
                            }))
                          }
                          className="h-11 text-base"
                        />
                      </div>
                    </div>

                    {/* Flag Anomaly */}
                    <div className="flex items-center space-x-2 min-h-[44px]">
                      <Checkbox
                        id="flag-anomaly"
                        checked={entryData.flag_anomaly}
                        onCheckedChange={(checked) => 
                          setEntryData(prev => ({ ...prev, flag_anomaly: checked as boolean }))
                        }
                        className="h-5 w-5"
                      />
                      <Label htmlFor="flag-anomaly" className="flex items-center gap-2 text-sm sm:text-base">
                        <Flag className="h-4 w-4" />
                        Flag as anomaly
                      </Label>
                    </div>
                  </>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="text-sm sm:text-base">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any observations or notes..."
                    value={entryData.notes || ''}
                    onChange={(e) => 
                      setEntryData(prev => ({ ...prev, notes: e.target.value }))
                    }
                    rows={3}
                    className="text-base resize-none"
                  />
                </div>

                {/* Actions - Fixed at bottom on mobile */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 sticky bottom-4 bg-card">
                  <Button 
                    onClick={handleSaveEntry} 
                    disabled={loading}
                    className="h-11 flex-1"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Save Entry
                  </Button>
                  
                  <Button 
                    onClick={handleCompleteWalk} 
                    variant="outline" 
                    className="h-11 flex-1 sm:flex-none"
                  >
                    Complete Walk
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p className="text-muted-foreground">Select a venue to record data</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};