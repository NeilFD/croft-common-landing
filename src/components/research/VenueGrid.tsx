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

export const VenueGrid: React.FC<VenueGridProps> = ({
  venues,
  walkEntries,
  walkCardId,
  searchTerm,
  onSearchChange
}) => {
  const filteredVenues = venues.filter(venue =>
    venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    venue.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          {filteredVenues.length}
        </span>
      </div>

      {/* Venue Grid - Single column on mobile */}
      <div className="grid grid-cols-1 gap-3">
        {filteredVenues.map((venue) => {
          const walkEntry = walkEntries.find(e => e.venue_id === venue.id);

          return (
            <ExpandableVenueCard
              key={venue.id}
              venue={venue}
              walkCardId={walkCardId}
              walkEntry={walkEntry}
            />
          );
        })}
      </div>

      {filteredVenues.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Building2 className="mx-auto h-8 w-8 mb-2 opacity-50" />
          <p>No venues found matching your search</p>
        </div>
      )}
    </div>
  );
};