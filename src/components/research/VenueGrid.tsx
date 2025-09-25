import React from 'react';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';
import { Venue, WalkEntry } from '@/hooks/useResearch';
import { ExpandableVenueCard } from './ExpandableVenueCard';

interface VenueGridProps {
  venues: Venue[];
  walkEntries: WalkEntry[];
  walkCardId: string;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

// Create a type for venue with visits
interface VenueWithVisits {
  venue: Venue;
  visits: WalkEntry[];
}

export const VenueGrid: React.FC<VenueGridProps> = ({
  venues,
  walkEntries,
  walkCardId,
  searchTerm,
  onSearchChange
}) => {
  // Group walk entries by venue and create venue-visit pairs
  const venueVisits: VenueWithVisits[] = venues
    .filter(venue =>
      venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      venue.address?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(venue => {
      const venueEntries = walkEntries
        .filter(entry => entry.venue_id === venue.id)
        .sort((a, b) => a.visit_number - b.visit_number);
      
      return {
        venue,
        visits: venueEntries
      };
    });

  // Create flattened list of venue cards (one per visit + one unvisited if no visits)
  const venueCards = venueVisits.flatMap(({ venue, visits }) => {
    if (visits.length === 0) {
      // No visits yet, show single unvisited card
      return [{
        venue,
        walkEntry: undefined,
        visitNumber: 1,
        key: `${venue.id}-unvisited`
      }];
    } else {
      // Show one card per visit
      return visits.map((visit, index) => ({
        venue,
        walkEntry: visit,
        visitNumber: visit.visit_number,
        key: `${venue.id}-visit-${visit.visit_number}`
      }));
    }
  });

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search venues..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 h-10 text-base"
        />
        <span className="text-xs sm:text-sm text-muted-foreground shrink-0">
          {venueCards.length}
        </span>
      </div>

      {/* Venue Grid - Single column on mobile */}
      <div className="grid grid-cols-1 gap-3">
        {venueCards.map((card) => (
          <ExpandableVenueCard
            key={card.key}
            venue={card.venue}
            walkCardId={walkCardId}
            walkEntry={card.walkEntry}
            visitNumber={card.visitNumber}
            canDuplicate={card.walkEntry !== undefined}
          />
        ))}
      </div>

      {venueCards.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No venues found matching your search</p>
        </div>
      )}
    </div>
  );
};