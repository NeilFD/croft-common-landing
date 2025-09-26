import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, MapPin, Users, Laptop, AlertTriangle, Save } from 'lucide-react';
import { useResearch, WalkCard, WalkEntry, Venue } from '@/hooks/useResearch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface EditWalkCardModalProps {
  walkCard: WalkCard;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

interface VenueEntryData {
  venue: Venue;
  entry?: WalkEntry;
  peopleCount: string;
  laptopCount: string;
  isClosed: boolean;
  notes: string;
  flagAnomaly: boolean;
  maxCapacity?: number | null;
  capacityPercentage?: number | null;
}

export const EditWalkCardModal: React.FC<EditWalkCardModalProps> = ({ 
  walkCard, 
  trigger,
  onSuccess 
}) => {
  const { venues, walkEntries, upsertWalkEntry, loading, fetchWalkEntries, fetchWalkCardGeoAreas } = useResearch();
  const [open, setOpen] = useState(false);
  const [venueData, setVenueData] = useState<VenueEntryData[]>([]);
  const [saving, setSaving] = useState(false);

  // Load venue data when modal opens
  useEffect(() => {
    if (open) {
      loadVenueData();
    }
  }, [open, walkCard.id]);

  const loadVenueData = async () => {
    try {
      // First get the geo areas associated with this walk card
      const walkCardGeoAreas = await fetchWalkCardGeoAreas(walkCard.id);
      const geoAreaIds = walkCardGeoAreas.map(area => area.id);
      
      // Fetch fresh venue data directly from Supabase instead of using cached venues
      const { data: freshVenues, error: venuesError } = await supabase
        .from('venues')
        .select('*')
        .in('geo_area_id', geoAreaIds)
        .eq('is_active', true);

      if (venuesError) {
        console.error('Error fetching venues:', venuesError);
        throw venuesError;
      }

      // Load walk entries for this specific walk card and get them directly
      const { data: walkCardEntries, error } = await supabase
        .from('walk_entries')
        .select('*')
        .eq('walk_card_id', walkCard.id);

      if (error) {
        console.error('Error fetching walk entries:', error);
        throw error;
      }

      console.log('Walk entries loaded:', walkCardEntries); // Debug log
      
      // Create venue data combining venues with their entries
      const venueEntryData: VenueEntryData[] = (freshVenues || []).map(venue => {
        // Find all entries for this venue and pick the latest one
        const entriesForVenue = walkCardEntries?.filter(e => e.venue_id === venue.id) || [];
        const entry = entriesForVenue.length > 0 
          ? entriesForVenue.sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]
          : undefined;
        
        console.log(`Venue ${venue.name} entry:`, entry); // Debug log
        const people = entry ? entry.people_count : 0;
        const maxCap = venue.max_capacity ?? null;
        const capacityPct = maxCap && maxCap > 0 
          ? Math.round((people / maxCap) * 100)
          : (entry?.capacity_percentage ?? null);
        return {
          venue,
          entry,
          peopleCount: entry ? entry.people_count.toString() : '',
          laptopCount: entry ? entry.laptop_count.toString() : '',
          isClosed: entry ? entry.is_closed : false,
          notes: entry ? (entry.notes || '') : '',
          flagAnomaly: entry ? entry.flag_anomaly : false,
          maxCapacity: maxCap,
          capacityPercentage: capacityPct,
        };
      });

      console.log('Final venue data:', venueEntryData); // Debug log
      setVenueData(venueEntryData);
    } catch (error) {
      console.error('Error loading venue data:', error);
      toast.error('Failed to load venue data');
    }
  };

  const updateVenueData = (venueId: string, field: keyof VenueEntryData, value: any) => {
    setVenueData(prev => prev.map(vd => 
      vd.venue.id === venueId 
        ? { ...vd, [field]: value }
        : vd
    ));
  };

  const saveVenueEntry = async (venueEntryData: VenueEntryData) => {
    const peopleCount = parseInt(venueEntryData.peopleCount) || 0;
    const laptopCount = parseInt(venueEntryData.laptopCount) || 0;

    await upsertWalkEntry({
      id: venueEntryData.entry?.id,
      walk_card_id: walkCard.id,
      venue_id: venueEntryData.venue.id,
      people_count: peopleCount,
      laptop_count: laptopCount,
      is_closed: venueEntryData.isClosed,
      notes: venueEntryData.notes || undefined,
      flag_anomaly: venueEntryData.flagAnomaly,
      recorded_at: new Date().toISOString(),
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      // Save all venue entries that have data
      const entriesToSave = venueData.filter(vd => 
        vd.peopleCount || vd.laptopCount || vd.isClosed || vd.notes || vd.entry
      );

      for (const venueEntry of entriesToSave) {
        await saveVenueEntry(venueEntry);
      }

      // Refresh venue data to show updated capacity percentages
      await loadVenueData();
      
      toast.success('Venue data updated successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error saving venue data:', error);
      toast.error('Failed to save venue data');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="mr-1 h-3 w-3" />
            Amend Data
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Amend Walk Data</DialogTitle>
          <DialogDescription>
            Edit venue data collected during "{walkCard.title}" on {walkCard.date}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Walk Summary */}
          <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
            <Badge variant="outline">{walkCard.date}</Badge>
            <Badge variant="outline">{walkCard.time_block.replace(/([A-Z])/g, ' $1').trim()}</Badge>
            <Badge variant="outline">{walkCard.weather_preset}</Badge>
            {walkCard.weather_temp_c && <Badge variant="outline">{walkCard.weather_temp_c}°C</Badge>}
          </div>

          {/* Venue Data */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Venue Data</h3>
              <p className="text-xs text-muted-foreground">
                Occupancy figures are calculated against each venue's current max capacity
              </p>
            </div>
            {venueData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading venue data...
              </div>
            ) : (
              <div className="grid gap-4">
                {venueData.map((vd) => (
                  <Card key={vd.venue.id} className={vd.entry ? 'border-primary/50' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{vd.venue.name}</CardTitle>
                          {vd.venue.address && (
                            <CardDescription className="flex items-center gap-1 mt-1">
                              <MapPin className="h-3 w-3" />
                              {vd.venue.address}
                            </CardDescription>
                          )}
                        </div>
                        {vd.entry && (
                          <Badge variant="secondary" className="text-xs">
                            Has Data
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Venue Closed Checkbox */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`closed-${vd.venue.id}`}
                          checked={vd.isClosed}
                          onCheckedChange={(checked) => 
                            updateVenueData(vd.venue.id, 'isClosed', checked)
                          }
                        />
                        <Label htmlFor={`closed-${vd.venue.id}`} className="text-sm font-medium">
                          Venue is closed
                        </Label>
                      </div>

                      {!vd.isClosed && (
                        <>
                          {/* Counts */}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                People Count
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={vd.peopleCount}
                                onChange={(e) => updateVenueData(vd.venue.id, 'peopleCount', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <Laptop className="h-4 w-4" />
                                Laptop Count
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={vd.laptopCount}
                                onChange={(e) => updateVenueData(vd.venue.id, 'laptopCount', e.target.value)}
                                placeholder="0"
                              />
                            </div>
                          </div>

                          {/* Capacity helper */}
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const people = vd.peopleCount !== '' ? parseInt(vd.peopleCount) || 0 : (vd.entry?.people_count || 0);
                              if (vd.maxCapacity && vd.maxCapacity > 0) {
                                const pct = Math.round((people / vd.maxCapacity) * 100);
                                return `Capacity: ${people} / ${vd.maxCapacity} • ${pct}%`;
                              }
                              if (vd.capacityPercentage != null) {
                                return `Occupancy: ${vd.capacityPercentage}%`;
                              }
                              return 'Max capacity unknown';
                            })()}
                          </div>

                          {/* Anomaly Flag */}
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`anomaly-${vd.venue.id}`}
                              checked={vd.flagAnomaly}
                              onCheckedChange={(checked) => 
                                updateVenueData(vd.venue.id, 'flagAnomaly', checked)
                              }
                            />
                            <Label htmlFor={`anomaly-${vd.venue.id}`} className="flex items-center gap-2 text-sm font-medium">
                              <AlertTriangle className="h-3 w-3" />
                              Flag as anomaly
                            </Label>
                          </div>
                        </>
                      )}

                      {/* Notes */}
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={vd.notes}
                          onChange={(e) => updateVenueData(vd.venue.id, 'notes', e.target.value)}
                          placeholder="Observations, special conditions, etc..."
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 border-t">
            <Button onClick={handleSaveAll} disabled={saving || loading}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};