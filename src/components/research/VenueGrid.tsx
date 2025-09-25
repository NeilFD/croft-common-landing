import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MapPin, Users, Laptop, CheckCircle, Clock, Building2 } from 'lucide-react';
import { Venue, WalkEntry } from '@/hooks/useResearch';

interface VenueGridProps {
  venues: Venue[];
  walkEntries: WalkEntry[];
  onVenueSelect: (venue: Venue) => void;
  selectedVenue?: Venue;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export const VenueGrid: React.FC<VenueGridProps> = ({
  venues,
  walkEntries,
  onVenueSelect,
  selectedVenue,
  searchTerm,
  onSearchChange
}) => {
  const getVenueStatus = (venue: Venue) => {
    const entry = walkEntries.find(e => e.venue_id === venue.id);
    if (!entry) return 'not-started';
    return 'completed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

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
          const status = getVenueStatus(venue);
          const entry = walkEntries.find(e => e.venue_id === venue.id);
          const isSelected = selectedVenue?.id === venue.id;

          return (
            <Card
              key={venue.id}
              className={`cursor-pointer transition-all hover:shadow-md min-h-[88px] ${
                isSelected ? 'ring-2 ring-primary bg-accent/10' : ''
              }`}
              onClick={() => onVenueSelect(venue)}
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-sm sm:text-base truncate flex-1 mr-2">{venue.name}</h3>
                  <div className="shrink-0">{getStatusIcon(status)}</div>
                </div>
                
                {venue.address && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{venue.address}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="shrink-0">{getStatusBadge(status)}</div>
                  
                  {entry && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>{entry.people_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Laptop className="h-3 w-3" />
                        <span>{entry.laptop_count}</span>
                      </div>
                    </div>
                  )}
                </div>

                {isSelected && (
                  <Button size="sm" className="w-full mt-3 h-9">
                    View Details
                  </Button>
                )}
              </CardContent>
            </Card>
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