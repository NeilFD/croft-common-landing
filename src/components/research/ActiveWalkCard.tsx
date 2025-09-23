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
  Building2
} from 'lucide-react';
import { useResearch, WalkCard, WalkEntry } from '@/hooks/useResearch';
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
    upsertWalkEntry, 
    updateWalkCardStatus,
    loading 
  } = useResearch();
  
  const [currentVenueIndex, setCurrentVenueIndex] = useState(0);
  const [entryData, setEntryData] = useState<Partial<WalkEntry>>({
    people_count: 0,
    laptop_count: 0,
    is_closed: false,
    flag_anomaly: false,
    notes: ''
  });

  // Get venues from associated geo areas (simplified for now - in reality would use walk_card_geo_areas table)
  const walkVenues = venues.filter(venue => 
    geoAreas.some(area => area.id === venue.geo_area_id)
  );

  const currentVenue = walkVenues[currentVenueIndex];
  const currentEntry = walkEntries.find(entry => 
    entry.venue_id === currentVenue?.id && entry.walk_card_id === walkCard.id
  );

  useEffect(() => {
    if (walkCard.id) {
      fetchWalkEntries(walkCard.id);
    }
  }, [walkCard.id, fetchWalkEntries]);

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

  const handleSaveEntry = async () => {
    if (!currentVenue) return;

    await upsertWalkEntry({
      walk_card_id: walkCard.id,
      venue_id: currentVenue.id,
      ...entryData
    });

    toast.success('Entry saved');
  };

  const handleNextVenue = () => {
    if (currentVenueIndex < walkVenues.length - 1) {
      handleSaveEntry();
      setCurrentVenueIndex(prev => prev + 1);
    }
  };

  const handlePrevVenue = () => {
    if (currentVenueIndex > 0) {
      handleSaveEntry();
      setCurrentVenueIndex(prev => prev - 1);
    }
  };

  const handleCompleteWalk = async () => {
    await handleSaveEntry();
    await updateWalkCardStatus(walkCard.id, 'Completed');
    toast.success('Walk completed!');
  };

  const completedEntries = walkEntries.filter(entry => 
    walkVenues.some(venue => venue.id === entry.venue_id)
  ).length;

  if (!currentVenue) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <MapPin className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-muted-foreground">No venues available for this walk</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Walk Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {walkCard.title}
              </CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                <span>{walkCard.date}</span>
                <span>{walkCard.time_block}</span>
                <div className="flex items-center gap-1">
                  <CloudRain className="h-3 w-3" />
                  {walkCard.weather_preset}
                  {walkCard.weather_temp_c && ` ${walkCard.weather_temp_c}°C`}
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="secondary">Active</Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {completedEntries} of {walkVenues.length} venues
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Current Venue Entry */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {currentVenue.name}
            </div>
            <span className="text-sm text-muted-foreground">
              {currentVenueIndex + 1} of {walkVenues.length}
            </span>
          </CardTitle>
          {currentVenue.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {currentVenue.address}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Status */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="closed"
              checked={entryData.is_closed}
              onCheckedChange={(checked) => 
                setEntryData(prev => ({ ...prev, is_closed: checked as boolean }))
              }
            />
            <Label htmlFor="closed">Venue is closed</Label>
          </div>

          {!entryData.is_closed && (
            <>
              {/* People Count */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="people-count" className="flex items-center gap-2">
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="laptop-count" className="flex items-center gap-2">
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
                  />
                </div>
              </div>

              {/* Flag Anomaly */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="flag-anomaly"
                  checked={entryData.flag_anomaly}
                  onCheckedChange={(checked) => 
                    setEntryData(prev => ({ ...prev, flag_anomaly: checked as boolean }))
                  }
                />
                <Label htmlFor="flag-anomaly" className="flex items-center gap-2">
                  <Flag className="h-4 w-4" />
                  Flag as anomaly
                </Label>
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Any observations or notes..."
              value={entryData.notes || ''}
              onChange={(e) => 
                setEntryData(prev => ({ ...prev, notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Photo Upload Placeholder */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Photos (Coming Soon)
            </Label>
            <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center text-muted-foreground">
              <Camera className="mx-auto h-8 w-8 mb-2 opacity-50" />
              <p>Photo upload will be available soon</p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={handlePrevVenue}
              disabled={currentVenueIndex === 0}
            >
              Previous
            </Button>
            
            <Button onClick={handleSaveEntry} disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Save Entry
            </Button>

            {currentVenueIndex < walkVenues.length - 1 ? (
              <Button onClick={handleNextVenue}>
                Next Venue
              </Button>
            ) : (
              <Button onClick={handleCompleteWalk} className="ml-auto">
                Complete Walk
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};