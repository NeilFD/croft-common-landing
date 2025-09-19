import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Users, TrendingUp, X, Plus, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SegmentFilters {
  dateRange?: { start: string; end: string };
  ageRange?: { min: number; max: number };
  interests?: string[];
  venueAreas?: string[];
  spendRange?: { min: number; max: number };
  tierBadges?: string[];
  visitHistory?: {
    dayOfWeek?: string[];
    timeOfMonth?: string[];
    frequency?: { min: number; max: number };
  };
}

interface SegmentPreview {
  memberCount: number;
  avgSpend: number;
}

interface SegmentBuilderProps {
  onSegmentCreate?: (segment: any) => void;
  initialFilters?: SegmentFilters;
  editingSegment?: any;
}

export const SegmentBuilder: React.FC<SegmentBuilderProps> = ({
  onSegmentCreate,
  initialFilters,
  editingSegment
}) => {
  const [filters, setFilters] = useState<SegmentFilters>(initialFilters || {});
  const [preview, setPreview] = useState<SegmentPreview>({ memberCount: 0, avgSpend: 0 });
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [segmentName, setSegmentName] = useState(editingSegment?.name || '');
  const [segmentDescription, setSegmentDescription] = useState(editingSegment?.description || '');
  const [isSaving, setIsSaving] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timesOfMonth = ['beginning', 'middle', 'end'];
  const tierBadges = ['bronze', 'silver', 'gold', 'platinum'];
  const interests = ['Beer', 'Wine', 'Cocktails', 'Food', 'Events', 'Sports', 'Music', 'Art'];
  const venueAreas = ['Bar Area', 'Restaurant', 'Outdoor Seating', 'Private Room', 'Rooftop'];

  // Debounced preview update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (hasActiveFilters()) {
        updatePreview();
      } else {
        setPreview({ memberCount: 0, avgSpend: 0 });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [filters]);

  const hasActiveFilters = () => {
    return Object.keys(filters).length > 0 && Object.values(filters).some(filter => {
      if (Array.isArray(filter)) return filter.length > 0;
      if (typeof filter === 'object' && filter !== null) {
        return Object.values(filter).some(val => val !== undefined && val !== null);
      }
      return filter !== undefined && filter !== null;
    });
  };

  const updatePreview = async () => {
    setIsLoadingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke('campaign-segments', {
        method: 'POST',
        body: { 
          name: 'preview',
          filters,
          preview_only: true 
        }
      });

      if (error) throw error;

      // Extract preview data from the response
      setPreview({
        memberCount: data.member_count || 0,
        avgSpend: data.avg_spend || 0
      });
    } catch (error) {
      console.error('Error updating segment preview:', error);
      setPreview({ memberCount: 0, avgSpend: 0 });
    }
    setIsLoadingPreview(false);
  };

  const handleSaveSegment = async () => {
    if (!segmentName.trim()) {
      toast.error('Please enter a segment name');
      return;
    }

    setIsSaving(true);
    try {
      const method = editingSegment ? 'PUT' : 'POST';
      const url = editingSegment ? `?id=${editingSegment.id}` : '';
      
      const { data, error } = await supabase.functions.invoke('campaign-segments', {
        method,
        body: {
          name: segmentName,
          description: segmentDescription,
          filters
        }
      });

      if (error) throw error;

      toast.success(`Segment ${editingSegment ? 'updated' : 'created'} successfully`);
      onSegmentCreate?.(data.segment);
      
      // Clear form if creating new segment
      if (!editingSegment) {
        setSegmentName('');
        setSegmentDescription('');
        setFilters({});
      }
    } catch (error) {
      console.error('Error saving segment:', error);
      toast.error(`Failed to ${editingSegment ? 'update' : 'create'} segment`);
    }
    setIsSaving(false);
  };

  const updateFilter = (key: keyof SegmentFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (key: keyof SegmentFilters) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
  };

  return (
    <div className="space-y-6">
      {/* Segment Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {editingSegment ? 'Edit Segment' : 'Create New Segment'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="segmentName">Segment Name</Label>
              <Input
                id="segmentName"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                placeholder="e.g., High Value Regulars"
              />
            </div>
            <div>
              <Label htmlFor="segmentDescription">Description (Optional)</Label>
              <Input
                id="segmentDescription"
                value={segmentDescription}
                onChange={(e) => setSegmentDescription(e.target.value)}
                placeholder="Brief description of this audience"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Builder */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Audience Filters
            </CardTitle>
            {hasActiveFilters() && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Range */}
          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex gap-2 items-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {filters.dateRange?.start ? format(new Date(filters.dateRange.start), 'MMM dd, yyyy') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined}
                    onSelect={(date) => updateFilter('dateRange', {
                      ...filters.dateRange,
                      start: date?.toISOString().split('T')[0]
                    })}
                  />
                </PopoverContent>
              </Popover>
              <span>to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-1" />
                    {filters.dateRange?.end ? format(new Date(filters.dateRange.end), 'MMM dd, yyyy') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined}
                    onSelect={(date) => updateFilter('dateRange', {
                      ...filters.dateRange,
                      end: date?.toISOString().split('T')[0]
                    })}
                  />
                </PopoverContent>
              </Popover>
              {filters.dateRange && (
                <Button variant="ghost" size="sm" onClick={() => removeFilter('dateRange')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Age Range */}
          <div className="space-y-2">
            <Label>Age Range</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min age"
                value={filters.ageRange?.min || ''}
                onChange={(e) => updateFilter('ageRange', {
                  ...filters.ageRange,
                  min: parseInt(e.target.value) || undefined
                })}
                className="w-24"
              />
              <span>to</span>
              <Input
                type="number"
                placeholder="Max age"
                value={filters.ageRange?.max || ''}
                onChange={(e) => updateFilter('ageRange', {
                  ...filters.ageRange,
                  max: parseInt(e.target.value) || undefined
                })}
                className="w-24"
              />
              {filters.ageRange && (
                <Button variant="ghost" size="sm" onClick={() => removeFilter('ageRange')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Spend Range */}
          <div className="space-y-2">
            <Label>Spend Range (£)</Label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min spend"
                value={filters.spendRange?.min || ''}
                onChange={(e) => updateFilter('spendRange', {
                  ...filters.spendRange,
                  min: parseFloat(e.target.value) || undefined
                })}
                className="w-32"
              />
              <span>to</span>
              <Input
                type="number"
                placeholder="Max spend"
                value={filters.spendRange?.max || ''}
                onChange={(e) => updateFilter('spendRange', {
                  ...filters.spendRange,
                  max: parseFloat(e.target.value) || undefined
                })}
                className="w-32"
              />
              {filters.spendRange && (
                <Button variant="ghost" size="sm" onClick={() => removeFilter('spendRange')}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Tier Badges */}
          <div className="space-y-2">
            <Label>Member Tiers</Label>
            <div className="flex flex-wrap gap-2">
              {tierBadges.map(tier => (
                <div key={tier} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tier-${tier}`}
                    checked={filters.tierBadges?.includes(tier) || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter('tierBadges', [...(filters.tierBadges || []), tier]);
                      } else {
                        updateFilter('tierBadges', filters.tierBadges?.filter(t => t !== tier) || []);
                      }
                    }}
                  />
                  <Label htmlFor={`tier-${tier}`} className="capitalize">{tier}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div className="space-y-2">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {interests.map(interest => (
                <div key={interest} className="flex items-center space-x-2">
                  <Checkbox
                    id={`interest-${interest}`}
                    checked={filters.interests?.includes(interest) || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter('interests', [...(filters.interests || []), interest]);
                      } else {
                        updateFilter('interests', filters.interests?.filter(i => i !== interest) || []);
                      }
                    }}
                  />
                  <Label htmlFor={`interest-${interest}`}>{interest}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Venue Areas */}
          <div className="space-y-2">
            <Label>Preferred Venue Areas</Label>
            <div className="flex flex-wrap gap-2">
              {venueAreas.map(area => (
                <div key={area} className="flex items-center space-x-2">
                  <Checkbox
                    id={`area-${area}`}
                    checked={filters.venueAreas?.includes(area) || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        updateFilter('venueAreas', [...(filters.venueAreas || []), area]);
                      } else {
                        updateFilter('venueAreas', filters.venueAreas?.filter(a => a !== area) || []);
                      }
                    }}
                  />
                  <Label htmlFor={`area-${area}`}>{area}</Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      {hasActiveFilters() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Audience Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPreview ? (
              <div className="text-center py-4">Loading preview...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{preview.memberCount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">£{preview.avgSpend.toFixed(0)}</div>
                  <div className="text-sm text-muted-foreground">Avg Spend</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button 
          onClick={handleSaveSegment}
          disabled={!segmentName.trim() || !hasActiveFilters() || isSaving}
          className="flex-1"
        >
          {isSaving ? 'Saving...' : editingSegment ? 'Update Segment' : 'Save Segment'}
        </Button>
        {onSegmentCreate && (
          <Button 
            variant="outline"
            onClick={() => onSegmentCreate({ filters, preview })}
            disabled={!hasActiveFilters()}
          >
            Use for Campaign
          </Button>
        )}
      </div>
    </div>
  );
};