import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { X, Calendar as CalendarIcon, Filter, Download } from 'lucide-react';
import { format } from 'date-fns';

export interface AdvancedFiltersProps {
  filters: {
    dateStart?: Date;
    dateEnd?: Date;
    minAge?: number;
    maxAge?: number;
    interests: string[];
    venueAreas: string[];
    minSpend?: number;
    maxSpend?: number;
    tierBadges: string[];
    searchTerm: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFiltersChange: (filters: any) => void;
  onExport: () => void;
  onClearFilters: () => void;
  isLoading?: boolean;
}

const AVAILABLE_INTERESTS = [
  'Wine', 'Cocktails', 'Beer', 'Food', 'Events', 'Live Music', 
  'Art', 'Networking', 'Dating', 'Business'
];

const VENUE_AREAS = [
  'main-entrance', 'garden-entrance', 'private-dining', 'events-space', 'rooftop'
];

const TIER_BADGES = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onExport,
  onClearFilters,
  isLoading = false
}) => {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addInterest = (interest: string) => {
    if (!filters.interests.includes(interest)) {
      updateFilter('interests', [...filters.interests, interest]);
    }
  };

  const removeInterest = (interest: string) => {
    updateFilter('interests', filters.interests.filter(i => i !== interest));
  };

  const addVenue = (venue: string) => {
    if (!filters.venueAreas.includes(venue)) {
      updateFilter('venueAreas', [...filters.venueAreas, venue]);
    }
  };

  const removeVenue = (venue: string) => {
    updateFilter('venueAreas', filters.venueAreas.filter(v => v !== venue));
  };

  const addTierBadge = (badge: string) => {
    if (!filters.tierBadges.includes(badge)) {
      updateFilter('tierBadges', [...filters.tierBadges, badge]);
    }
  };

  const removeTierBadge = (badge: string) => {
    updateFilter('tierBadges', filters.tierBadges.filter(b => b !== badge));
  };

  const hasActiveFilters = 
    filters.dateStart || filters.dateEnd || filters.minAge || filters.maxAge ||
    filters.interests.length > 0 || filters.venueAreas.length > 0 ||
    filters.minSpend || filters.maxSpend || filters.tierBadges.length > 0;

  return (
    <Card className="border-2 border-black">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters & Search
          </CardTitle>
          <div className="flex gap-2">
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearFilters}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
            <Button 
              onClick={onExport} 
              size="sm"
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search and Basic Filters Row */}
        <div className="grid md:grid-cols-6 gap-4">
          <Input
            placeholder="Search members..."
            value={filters.searchTerm}
            onChange={(e) => updateFilter('searchTerm', e.target.value)}
          />
          
          <Select value={filters.sortBy} onValueChange={(value) => updateFilter('sortBy', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total_spend">Total Spend</SelectItem>
              <SelectItem value="total_transactions">Transactions</SelectItem>
              <SelectItem value="avg_transaction">Avg Transaction</SelectItem>
              <SelectItem value="retention_risk_score">Risk Score</SelectItem>
              <SelectItem value="lifetime_value">Lifetime Value</SelectItem>
              <SelectItem value="visit_frequency">Visit Frequency</SelectItem>
              <SelectItem value="last_visit_date">Last Visit</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.sortOrder} onValueChange={(value: 'asc' | 'desc') => updateFilter('sortOrder', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">High to Low</SelectItem>
              <SelectItem value="asc">Low to High</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Min spend"
            type="number"
            value={filters.minSpend || ''}
            onChange={(e) => updateFilter('minSpend', e.target.value ? Number(e.target.value) : undefined)}
          />

          <Input
            placeholder="Max spend"
            type="number"
            value={filters.maxSpend || ''}
            onChange={(e) => updateFilter('maxSpend', e.target.value ? Number(e.target.value) : undefined)}
          />

          <div className="flex gap-2">
            <Input
              placeholder="Min age"
              type="number"
              value={filters.minAge || ''}
              onChange={(e) => updateFilter('minAge', e.target.value ? Number(e.target.value) : undefined)}
            />
            <Input
              placeholder="Max age"
              type="number"
              value={filters.maxAge || ''}
              onChange={(e) => updateFilter('maxAge', e.target.value ? Number(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateStart ? format(filters.dateStart, 'PPP') : 'Pick start date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateStart}
                  onSelect={(date) => updateFilter('dateStart', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateEnd ? format(filters.dateEnd, 'PPP') : 'Pick end date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateEnd}
                  onSelect={(date) => updateFilter('dateEnd', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Interest Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by Interests</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {filters.interests.map((interest) => (
              <Badge key={interest} variant="default" className="flex items-center gap-1">
                {interest}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeInterest(interest)}
                />
              </Badge>
            ))}
          </div>
          <Select onValueChange={addInterest}>
            <SelectTrigger>
              <SelectValue placeholder="Add interest filter" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_INTERESTS.filter(i => !filters.interests.includes(i)).map((interest) => (
                <SelectItem key={interest} value={interest}>{interest}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Venue Area Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by Venue Areas</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {filters.venueAreas.map((venue) => (
              <Badge key={venue} variant="secondary" className="flex items-center gap-1">
                {venue.replace('-', ' ')}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeVenue(venue)}
                />
              </Badge>
            ))}
          </div>
          <Select onValueChange={addVenue}>
            <SelectTrigger>
              <SelectValue placeholder="Add venue area filter" />
            </SelectTrigger>
            <SelectContent>
              {VENUE_AREAS.filter(v => !filters.venueAreas.includes(v)).map((venue) => (
                <SelectItem key={venue} value={venue}>{venue.replace('-', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tier Badge Filters */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Filter by Tier</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {filters.tierBadges.map((badge) => (
              <Badge key={badge} variant="outline" className="flex items-center gap-1 capitalize">
                {badge}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => removeTierBadge(badge)}
                />
              </Badge>
            ))}
          </div>
          <Select onValueChange={addTierBadge}>
            <SelectTrigger>
              <SelectValue placeholder="Add tier filter" />
            </SelectTrigger>
            <SelectContent>
              {TIER_BADGES.filter(b => !filters.tierBadges.includes(b)).map((badge) => (
                <SelectItem key={badge} value={badge} className="capitalize">{badge}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};