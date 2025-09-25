import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, 
  Clock, 
  CloudRain,
  Settings
} from 'lucide-react';
import { useResearch, WalkCard, GeoArea } from '@/hooks/useResearch';
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
    walkEntries, 
    fetchWalkEntries, 
    fetchWalkCardGeoAreas,
    updateWalkCardStatus
  } = useResearch();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [showGeoAreaManager, setShowGeoAreaManager] = useState(false);
  const [walkGeoAreas, setWalkGeoAreas] = useState<GeoArea[]>([]);

  // Get venues from walk's selected geo areas
  const walkVenues = venues.filter(venue => 
    walkGeoAreas.some(area => area.id === venue.geo_area_id)
  );


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


  const handleGeoAreaUpdate = async () => {
    const geoAreasData = await fetchWalkCardGeoAreas(walkCard.id);
    setWalkGeoAreas(geoAreasData);
  };

  const handleCompleteWalk = async () => {
    toast.success('Completing walk and preparing report...');
    
    try {
      // Update status to completed
      await updateWalkCardStatus(walkCard.id, 'Completed');
      
      // Pre-generate and cache the PDF in the background
      setTimeout(async () => {
        try {
          console.log('Pre-generating PDF for walk', walkCard.id);
          
          // Import services dynamically to avoid circular dependencies
          const { generateWalkCardPDF } = await import('@/services/pdfService');
          const { pdfCacheService } = await import('@/services/pdfCacheService');
          
          // Fetch walk entries using the same logic as WalkHistoryCard
          const { data: walkEntriesData, error } = await import('@/integrations/supabase/client').then(m => 
            m.supabase
              .from('walk_entries')
              .select('*')
              .eq('walk_card_id', walkCard.id)
              .order('recorded_at', { ascending: true })
          );

          if (error || !walkEntriesData) {
            console.warn('No walk entries to cache PDF for:', error);
            return;
          }

          // Filter and process entries (same logic as WalkHistoryCard)
          const walkDateStr = (walkCard.date || '').slice(0, 10) || new Date(walkCard.created_at).toISOString().slice(0, 10);
          const originalWalkEntries = walkEntriesData.filter(entry => {
            const entryDate = new Date(entry.recorded_at).toISOString().split('T')[0];
            return entryDate === walkDateStr;
          });

          if (originalWalkEntries.length === 0) {
            console.log('No entries to cache PDF for walk', walkCard.id);
            return;
          }

          // Generate PDF with current venues and geoAreas
          const pdfBlob = await generateWalkCardPDF({
            walkCard,
            venues,
            walkEntries: originalWalkEntries,
            geoAreas: walkGeoAreas
          });

          // Cache the PDF
          await pdfCacheService.storePDF(walkCard.id, pdfBlob);
          console.log('PDF successfully cached for walk', walkCard.id);
          
        } catch (error) {
          console.warn('Failed to pre-generate PDF cache:', error);
          // Don't show error toast - caching is optional
        }
      }, 500); // Small delay to let UI update first

    } catch (error) {
      console.error('Error completing walk:', error);
      toast.error('Failed to complete walk');
    }
  };

  // Filter walk entries to only the original walk date and allow at most a legitimate second visit
  const walkDateStr = (walkCard.date || '').slice(0, 10) || new Date(walkCard.created_at).toISOString().slice(0, 10);
  const allowedSecondVisitVenueNames = new Set<string>(['Full Moon', 'The Canteen', 'Caribbean Croft']);

  // Map venue_id -> venue name for quick lookup
  const venueNameById = new Map(venues.map(v => [v.id, v.name] as const));

  // Keep only entries recorded on the original walk date
  const entriesOnDate = walkEntries.filter(e => {
    const entryDateStr = new Date(e.recorded_at).toISOString().split('T')[0];
    return entryDateStr === walkDateStr;
  });

  // Group by venue and keep first visit, and second only if venue is in the allowed list
  const grouped = new Map<string, typeof entriesOnDate>();
  for (const e of entriesOnDate) {
    if (!grouped.has(e.venue_id)) grouped.set(e.venue_id, []);
    grouped.get(e.venue_id)!.push(e);
  }

  const filteredWalkEntries = Array.from(grouped.entries()).flatMap(([venueId, entries]) => {
    // Ignore venues not in the current walk's geo areas
    if (!walkVenues.some(v => v.id === venueId)) return [] as typeof entries;

    const name = venueNameById.get(venueId) || '';
    const sorted = entries.sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime());

    const keep: typeof entries = [];
    if (sorted.length >= 1) keep.push(sorted[0]);
    if (sorted.length >= 2 && allowedSecondVisitVenueNames.has(name)) keep.push(sorted[1]);
    return keep;
  });

  // Count unique venues completed
  const completedVenueCount = new Set(filteredWalkEntries.map(e => e.venue_id)).size;

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
                {completedVenueCount} of {walkVenues.length} venues completed
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
                walkEntries={filteredWalkEntries}
                walkCardId={walkCard.id}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
              />
            </CardContent>
          </Card>

          {/* Complete Walk Button */}
          <Card>
            <CardContent className="p-4 sm:p-6">
              <Button 
                onClick={handleCompleteWalk} 
                className="w-full h-11"
                size="lg"
              >
                Complete Walk
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};