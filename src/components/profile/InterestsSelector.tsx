import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const AVAILABLE_INTERESTS = [
  'Beer', 'Wine', 'Cocktails', 'Coffee', 'Food', 'Music', 'Art', 'Film', 
  'Books', 'Sports', 'Games', 'Technology', 'Travel', 'Photography',
  'Comedy', 'Theatre', 'Live Music', 'Networking', 'Community Events'
];

const VENUE_PREFERENCES = [
  'Beer Hall', 'Cafe', 'Cocktail Bar', 'Common Room', 'Kitchens', 'Event Spaces'
];

const VISIT_TIME_PREFERENCES = [
  'Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-9pm)', 'Late Night (9pm+)'
];

const BEER_STYLES = [
  'IPA', 'Lager', 'Stout', 'Porter', 'Wheat Beer', 'Pilsner', 'Pale Ale', 
  'Saison', 'Sour Beer', 'Belgian', 'Cider'
];

interface InterestsSelectorProps {
  selectedInterests: string[];
  onInterestsChange: (interests: string[]) => void;
  favoriteVenue?: string | null;
  onFavoriteVenueChange: (venue: string) => void;
  visitTimePreference?: string | null;
  onVisitTimeChange: (time: string) => void;
  beerStylePreferences?: string[] | null;
  onBeerStylesChange: (styles: string[]) => void;
}

export const InterestsSelector: React.FC<InterestsSelectorProps> = ({
  selectedInterests,
  onInterestsChange,
  favoriteVenue,
  onFavoriteVenueChange,
  visitTimePreference,
  onVisitTimeChange,
  beerStylePreferences = [],
  onBeerStylesChange,
}) => {
  const handleInterestToggle = (interest: string) => {
    const updated = selectedInterests.includes(interest)
      ? selectedInterests.filter(i => i !== interest)
      : [...selectedInterests, interest];
    onInterestsChange(updated);
  };

  const handleBeerStyleToggle = (style: string) => {
    const current = beerStylePreferences || [];
    const updated = current.includes(style)
      ? current.filter(s => s !== style)
      : [...current, style];
    onBeerStylesChange(updated);
  };

  return (
    <div className="space-y-6">
      {/* General Interests */}
      <div>
        <Label className="text-base font-semibold mb-3 block">General Interests</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {AVAILABLE_INTERESTS.map((interest) => (
            <div key={interest} className="flex items-center space-x-2">
              <Checkbox
                id={`interest-${interest}`}
                checked={selectedInterests.includes(interest)}
                onCheckedChange={() => handleInterestToggle(interest)}
              />
              <Label
                htmlFor={`interest-${interest}`}
                className="text-sm cursor-pointer"
              >
                {interest}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite Venue */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Favorite Venue</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {VENUE_PREFERENCES.map((venue) => (
            <div key={venue} className="flex items-center space-x-2">
              <Checkbox
                id={`venue-${venue}`}
                checked={favoriteVenue === venue}
                onCheckedChange={(checked) => {
                  if (checked) onFavoriteVenueChange(venue);
                }}
              />
              <Label
                htmlFor={`venue-${venue}`}
                className="text-sm cursor-pointer"
              >
                {venue}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Visit Time Preference */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Preferred Visit Times</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {VISIT_TIME_PREFERENCES.map((time) => (
            <div key={time} className="flex items-center space-x-2">
              <Checkbox
                id={`time-${time}`}
                checked={visitTimePreference === time}
                onCheckedChange={(checked) => {
                  if (checked) onVisitTimeChange(time);
                }}
              />
              <Label
                htmlFor={`time-${time}`}
                className="text-sm cursor-pointer"
              >
                {time}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Beer Style Preferences */}
      <div>
        <Label className="text-base font-semibold mb-3 block">Beer Style Preferences</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {BEER_STYLES.map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox
                id={`beer-${style}`}
                checked={(beerStylePreferences || []).includes(style)}
                onCheckedChange={() => handleBeerStyleToggle(style)}
              />
              <Label
                htmlFor={`beer-${style}`}
                className="text-sm cursor-pointer"
              >
                {style}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};