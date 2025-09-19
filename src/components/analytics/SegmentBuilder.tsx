import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, TrendingUp, X, Filter, Calendar, Clock, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { INTEREST_OPTIONS, VENUE_PREFERENCES } from '@/data/interests';

interface SegmentFilters {
  // Activity-based filters
  receiptActivityPeriod?: 'last_30_days' | 'last_60_days' | 'last_90_days' | 'last_6_months' | 'last_1_year';
  visitFrequency?: 'never' | '1_to_2' | '3_to_5' | '6_to_10' | '10_plus';
  totalSpendRange?: { min: number; max: number };
  recentActivity?: 'active_7_days' | 'active_14_days' | 'active_30_days' | 'inactive_30_plus';
  
  // Behavioral patterns
  preferredVisitDays?: string[];
  visitTiming?: ('early_month' | 'mid_month' | 'end_month')[];
  avgSpendPerVisit?: 'under_10' | '10_to_20' | '20_to_30' | '30_to_50' | '50_plus';
  
  // Demographics (optional)
  ageRange?: { min: number; max: number };
  interests?: string[];
  interestsLogic?: 'match_all' | 'match_any';
  venuePreferences?: string[];
  venuePreferencesLogic?: 'match_all' | 'match_any';
  
  // Member status
  hasUploadedReceipts?: boolean;
  pushNotificationsEnabled?: boolean;
  loyaltyEngagement?: 'has_card' | 'completed_cards' | 'high_punches';
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
  const activityPeriods = [
    { value: 'last_30_days', label: 'Last 30 days' },
    { value: 'last_60_days', label: 'Last 60 days' },
    { value: 'last_90_days', label: 'Last 90 days' },
    { value: 'last_6_months', label: 'Last 6 months' },
    { value: 'last_1_year', label: 'Last 1 year' }
  ];
  const visitFrequencies = [
    { value: 'never', label: 'Never visited' },
    { value: '1_to_2', label: '1-2 visits' },
    { value: '3_to_5', label: '3-5 visits' },
    { value: '6_to_10', label: '6-10 visits' },
    { value: '10_plus', label: '10+ visits' }
  ];
  const spendingHabits = [
    { value: 'under_10', label: 'Under £10' },
    { value: '10_to_20', label: '£10-£20' },
    { value: '20_to_30', label: '£20-£30' },
    { value: '30_to_50', label: '£30-£50' },
    { value: '50_plus', label: '£50+' }
  ];
  const recentActivities = [
    { value: 'active_7_days', label: 'Active in last 7 days' },
    { value: 'active_14_days', label: 'Active in last 14 days' },
    { value: 'active_30_days', label: 'Active in last 30 days' },
    { value: 'inactive_30_plus', label: 'Inactive for 30+ days' }
  ];
  const monthPeriods = [
    { value: 'early_month', label: 'Early month (1st-10th)' },
    { value: 'mid_month', label: 'Mid month (11th-20th)' },
    { value: 'end_month', label: 'End of month (21st-31st)' }
  ];

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
        memberCount: data.segment?.member_count || data.member_count || 0,
        avgSpend: data.segment?.avg_spend || data.avg_spend || 0
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
        <CardContent className="space-y-8">
          {/* Activity-Based Filters */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Activity-Based Filters
            </div>
            <Separator />

            {/* Receipt Activity Period */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Receipt Activity Period</Label>
              <p className="text-xs text-muted-foreground">When did members last upload receipts?</p>
              <Select
                value={filters.receiptActivityPeriod || ''}
                onValueChange={(value) => updateFilter('receiptActivityPeriod', value as any)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent>
                  {activityPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {filters.receiptActivityPeriod && (
                <Button variant="ghost" size="sm" onClick={() => removeFilter('receiptActivityPeriod')}>
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              )}
            </div>

            {/* Visit Frequency */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Visit Frequency</Label>
              <p className="text-xs text-muted-foreground">How many times have they visited?</p>
              <Select
                value={filters.visitFrequency || ''}
                onValueChange={(value) => updateFilter('visitFrequency', value as any)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {visitFrequencies.map((freq) => (
                    <SelectItem key={freq.value} value={freq.value}>
                      {freq.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Total Spending Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Total Lifetime Spending</Label>
              <p className="text-xs text-muted-foreground">Total amount spent across all visits</p>
              <div className="flex gap-2 items-center max-w-md">
                <Input
                  type="number"
                  placeholder="Min £"
                  value={filters.totalSpendRange?.min || ''}
                  onChange={(e) => updateFilter('totalSpendRange', {
                    ...filters.totalSpendRange,
                    min: parseFloat(e.target.value) || undefined
                  })}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="number"
                  placeholder="Max £"
                  value={filters.totalSpendRange?.max || ''}
                  onChange={(e) => updateFilter('totalSpendRange', {
                    ...filters.totalSpendRange,
                    max: parseFloat(e.target.value) || undefined
                  })}
                  className="w-24"
                />
                {filters.totalSpendRange && (
                  <Button variant="ghost" size="sm" onClick={() => removeFilter('totalSpendRange')}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Recent Activity Status */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Recent Activity Status</Label>
              <p className="text-xs text-muted-foreground">How recently have they been active?</p>
              <Select
                value={filters.recentActivity || ''}
                onValueChange={(value) => updateFilter('recentActivity', value as any)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select activity status" />
                </SelectTrigger>
                <SelectContent>
                  {recentActivities.map((activity) => (
                    <SelectItem key={activity.value} value={activity.value}>
                      {activity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Behavioral Patterns */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Behavioral Patterns
            </div>
            <Separator />

            {/* Preferred Visit Days */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Preferred Visit Days</Label>
              <p className="text-xs text-muted-foreground">Which days do they usually visit?</p>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={`day-${day}`}
                      checked={filters.preferredVisitDays?.includes(day) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('preferredVisitDays', [...(filters.preferredVisitDays || []), day]);
                        } else {
                          updateFilter('preferredVisitDays', filters.preferredVisitDays?.filter(d => d !== day) || []);
                        }
                      }}
                    />
                    <Label htmlFor={`day-${day}`} className="text-sm">{day}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Visit Timing */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Visit Timing (Month Period)</Label>
              <p className="text-xs text-muted-foreground">When in the month do they typically visit?</p>
              <div className="flex flex-wrap gap-2">
                {monthPeriods.map(period => (
                  <div key={period.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`timing-${period.value}`}
                      checked={filters.visitTiming?.includes(period.value as any) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('visitTiming', [...(filters.visitTiming || []), period.value as any]);
                        } else {
                          updateFilter('visitTiming', filters.visitTiming?.filter(t => t !== period.value) || []);
                        }
                      }}
                    />
                    <Label htmlFor={`timing-${period.value}`} className="text-sm">{period.label}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Average Spend Per Visit */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Average Spend Per Visit</Label>
              <p className="text-xs text-muted-foreground">How much do they typically spend per visit?</p>
              <Select
                value={filters.avgSpendPerVisit || ''}
                onValueChange={(value) => updateFilter('avgSpendPerVisit', value as any)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select spend range" />
                </SelectTrigger>
                <SelectContent>
                  {spendingHabits.map((habit) => (
                    <SelectItem key={habit.value} value={habit.value}>
                      {habit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Demographics (Optional) */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Demographics (Optional)
            </div>
            <Separator />

            {/* Age Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Age Range</Label>
              <div className="flex gap-2 items-center max-w-md">
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
                <span className="text-sm text-muted-foreground">to</span>
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

            {/* Interests */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Interests</Label>
                {filters.interests && filters.interests.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Match:</span>
                    <Select
                      value={filters.interestsLogic || 'match_all'}
                      onValueChange={(value: 'match_all' | 'match_any') => updateFilter('interestsLogic', value)}
                    >
                      <SelectTrigger className="w-24 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match_all">ALL</SelectItem>
                        <SelectItem value="match_any">ANY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.interests && filters.interests.length > 0 
                  ? `Must have ${filters.interestsLogic === 'match_any' ? 'ANY' : 'ALL'} of the selected interests`
                  : 'What are they interested in?'
                }
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                {INTEREST_OPTIONS.map(interest => (
                  <div key={interest} className="flex items-center space-x-2">
                    <Checkbox
                      id={`interest-${interest}`}
                      checked={filters.interests?.includes(interest) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('interests', [...(filters.interests || []), interest]);
                          // Set default logic if first interest selected
                          if (!filters.interestsLogic) {
                            updateFilter('interestsLogic', 'match_all');
                          }
                        } else {
                          updateFilter('interests', filters.interests?.filter(i => i !== interest) || []);
                        }
                      }}
                    />
                    <Label htmlFor={`interest-${interest}`} className="text-sm">{interest}</Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Venue Preferences */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Venue Preferences</Label>
                {filters.venuePreferences && filters.venuePreferences.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">Match:</span>
                    <Select
                      value={filters.venuePreferencesLogic || 'match_all'}
                      onValueChange={(value: 'match_all' | 'match_any') => updateFilter('venuePreferencesLogic', value)}
                    >
                      <SelectTrigger className="w-24 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="match_all">ALL</SelectItem>
                        <SelectItem value="match_any">ANY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.venuePreferences && filters.venuePreferences.length > 0 
                  ? `Must have ${filters.venuePreferencesLogic === 'match_any' ? 'ANY' : 'ALL'} of the selected preferences`
                  : 'Which areas do they prefer?'
                }
              </p>
              <div className="flex flex-wrap gap-2">
                {VENUE_PREFERENCES.map(venue => (
                  <div key={venue} className="flex items-center space-x-2">
                    <Checkbox
                      id={`venue-${venue}`}
                      checked={filters.venuePreferences?.includes(venue) || false}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          updateFilter('venuePreferences', [...(filters.venuePreferences || []), venue]);
                          // Set default logic if first venue selected
                          if (!filters.venuePreferencesLogic) {
                            updateFilter('venuePreferencesLogic', 'match_all');
                          }
                        } else {
                          updateFilter('venuePreferences', filters.venuePreferences?.filter(v => v !== venue) || []);
                        }
                      }}
                    />
                    <Label htmlFor={`venue-${venue}`} className="text-sm">{venue}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Member Status */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Coins className="h-4 w-4" />
              Member Status
            </div>
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Has Uploaded Receipts */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasReceipts"
                  checked={filters.hasUploadedReceipts === true}
                  onCheckedChange={(checked) => {
                    updateFilter('hasUploadedReceipts', checked ? true : undefined);
                  }}
                />
                <Label htmlFor="hasReceipts" className="text-sm">Has uploaded receipts</Label>
              </div>

              {/* Push Notifications Enabled */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pushEnabled"
                  checked={filters.pushNotificationsEnabled === true}
                  onCheckedChange={(checked) => {
                    updateFilter('pushNotificationsEnabled', checked ? true : undefined);
                  }}
                />
                <Label htmlFor="pushEnabled" className="text-sm">Push notifications enabled</Label>
              </div>
            </div>

            {/* Loyalty Engagement */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Loyalty Engagement</Label>
              <Select
                value={filters.loyaltyEngagement || ''}
                onValueChange={(value) => updateFilter('loyaltyEngagement', value as any)}
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Select loyalty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="has_card">Has loyalty card</SelectItem>
                  <SelectItem value="completed_cards">Completed loyalty cards</SelectItem>
                  <SelectItem value="high_punches">High punch count</SelectItem>
                </SelectContent>
              </Select>
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