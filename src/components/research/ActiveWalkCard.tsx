import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Save, CheckCircle, Play, Users, Cloud, Calendar, Clock, Laptop } from 'lucide-react';
import { useResearch, WalkCard } from '@/hooks/useResearch';
import { VenueObservationRow } from './VenueObservationRow';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ActiveWalkCardProps {
  walkCard: WalkCard;
}

export const ActiveWalkCard: React.FC<ActiveWalkCardProps> = ({ walkCard }) => {
  const { venues, geoAreas, walkEntries, fetchWalkEntries, updateWalkCardStatus, loading } = useResearch();
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  useEffect(() => {
    fetchWalkEntries(walkCard.id);
  }, [walkCard.id, fetchWalkEntries]);

  // Get venues for selected geo areas (this would need geo area associations from backend)
  const relevantVenues = venues.filter(venue => venue.is_active);
  const venuesByArea = relevantVenues.reduce((acc, venue) => {
    if (!acc[venue.geo_area_id]) {
      acc[venue.geo_area_id] = [];
    }
    acc[venue.geo_area_id].push(venue);
    return acc;
  }, {} as Record<string, typeof venues>);

  const toggleArea = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const handleStartWalk = () => {
    updateWalkCardStatus(walkCard.id, 'Active');
  };

  const handleCompleteWalk = () => {
    setShowCompleteDialog(true);
  };

  const confirmComplete = () => {
    updateWalkCardStatus(walkCard.id, 'Completed');
    setShowCompleteDialog(false);
  };

  const formatTimeBlock = (timeBlock: string) => {
    return timeBlock.replace(/([A-Z])/g, ' $1').trim();
  };

  const showLaptopCountInline = walkCard.croft_zones.includes('Café');

  return (
    <div className="space-y-6">
      {/* Walk Card Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                {walkCard.status === 'Draft' && <Play className="h-5 w-5 text-yellow-500" />}
                {walkCard.status === 'Active' && <Users className="h-5 w-5 text-green-500" />}
                {walkCard.title}
              </CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {walkCard.date}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatTimeBlock(walkCard.time_block)}
                </div>
                <div className="flex items-center gap-1">
                  <Cloud className="h-4 w-4" />
                  {walkCard.weather_preset}
                  {walkCard.weather_temp_c && ` (${walkCard.weather_temp_c}°C)`}
                </div>
              </div>
            </div>
            <Badge variant={walkCard.status === 'Active' ? 'default' : 'secondary'}>
              {walkCard.status}
            </Badge>
          </div>
          
          {walkCard.croft_zones.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {walkCard.croft_zones.map((zone) => (
                <Badge key={zone} variant="outline">{zone}</Badge>
              ))}
            </div>
          )}
          
          {walkCard.weather_notes && (
            <p className="text-sm text-muted-foreground italic">
              {walkCard.weather_notes}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Start Walk Button (Draft Status) */}
      {walkCard.status === 'Draft' && (
        <div className="text-center">
          <Button onClick={handleStartWalk} size="lg" disabled={loading}>
            <Play className="mr-2 h-5 w-5" />
            Start Walk
          </Button>
        </div>
      )}

      {/* Venue Observations (Active Status) */}
      {walkCard.status === 'Active' && (
        <div className="space-y-4">
          {Object.entries(venuesByArea).map(([areaId, areaVenues]) => {
            const geoArea = geoAreas.find(area => area.id === areaId);
            if (!geoArea) return null;

            const isExpanded = expandedAreas.has(areaId);
            const areaEntries = walkEntries.filter(entry => 
              areaVenues.some(venue => venue.id === entry.venue_id)
            );
            const totalPeople = areaEntries.reduce((sum, entry) => sum + entry.people_count, 0);

            return (
              <Card key={areaId}>
                <Collapsible>
                  <CollapsibleTrigger 
                    className="w-full"
                    onClick={() => toggleArea(areaId)}
                  >
                    <CardHeader className="cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{geoArea.name}</CardTitle>
                          <Badge variant="secondary">
                            {areaVenues.length} venues
                          </Badge>
                          {totalPeople > 0 && (
                            <Badge variant="default">
                              {totalPeople} people
                            </Badge>
                          )}
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 space-y-3">
                      {areaVenues.map((venue) => {
                        const entry = walkEntries.find(e => e.venue_id === venue.id);
                        return (
                          <VenueObservationRow
                            key={venue.id}
                            venue={venue}
                            walkCardId={walkCard.id}
                            entry={entry}
                            showLaptopCountInline={showLaptopCountInline}
                          />
                        );
                      })}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            );
          })}
        </div>
      )}

      {/* Sticky Action Bar */}
      {walkCard.status === 'Active' && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t p-4 z-50">
          <div className="container mx-auto flex gap-2">
            <Button variant="outline" className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Save Progress
            </Button>
            <Button onClick={handleCompleteWalk} className="flex-1" disabled={loading}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete Walkaround
            </Button>
          </div>
        </div>
      )}

      {/* Complete Confirmation Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Walkaround</DialogTitle>
            <DialogDescription>
              You're about to complete this walkaround. This will lock all entries and prevent further changes. Are you sure?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmComplete} disabled={loading}>
              Yes, Complete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add bottom padding to account for sticky action bar */}
      <div className="h-20"></div>
    </div>
  );
};