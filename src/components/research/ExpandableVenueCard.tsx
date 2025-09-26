import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  MapPin, 
  Users, 
  Laptop, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Flag,
  Save,
  Copy
} from 'lucide-react';
import { Venue, WalkEntry, useResearch } from '@/hooks/useResearch';
import { format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { toast } from 'sonner';
import { CapacityIndicator } from './CapacityIndicator';

interface ExpandableVenueCardProps {
  venue: Venue;
  walkCardId: string;
  walkEntry?: WalkEntry;
  visitNumber: number;
  canDuplicate: boolean;
}

export const ExpandableVenueCard: React.FC<ExpandableVenueCardProps> = ({ 
  venue, 
  walkCardId, 
  walkEntry,
  visitNumber = 1,
  canDuplicate = false
}) => {
  const { upsertWalkEntry, loading } = useResearch();
  const [isExpanded, setIsExpanded] = useState(false);
  const [entryData, setEntryData] = useState<Partial<WalkEntry>>({
    people_count: 0,
    laptop_count: 0,
    is_closed: false,
    flag_anomaly: false,
    notes: '',
    recorded_at: new Date().toISOString()
  });

  const status = walkEntry ? 'completed' : 'not-started';
  const displayName = visitNumber > 1 ? `${venue.name} (Visit ${visitNumber})` : venue.name;

  // Update entry data when walkEntry changes
  useEffect(() => {
    if (walkEntry) {
      setEntryData({
        people_count: walkEntry.people_count,
        laptop_count: walkEntry.laptop_count,
        is_closed: walkEntry.is_closed,
        flag_anomaly: walkEntry.flag_anomaly,
        notes: walkEntry.notes || '',
        recorded_at: walkEntry.recorded_at || new Date().toISOString()
      });
    } else {
      setEntryData({
        people_count: 0,
        laptop_count: 0,
        is_closed: false,
        flag_anomaly: false,
        notes: '',
        recorded_at: new Date().toISOString()
      });
    }
  }, [walkEntry]);

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

  const handleSaveEntry = async () => {
    try {
      await upsertWalkEntry({
        walk_card_id: walkCardId,
        venue_id: venue.id,
        visit_number: visitNumber,
        ...entryData
      });

      toast.success('Entry saved');
      setIsExpanded(false);
    } catch (error) {
      toast.error('Failed to save entry');
      console.error('Error saving entry:', error);
    }
  };

  const handleDuplicateVisit = async () => {
    try {
      await upsertWalkEntry({
        walk_card_id: walkCardId,
        venue_id: venue.id,
        // visit_number will be auto-determined for new visit
        people_count: 0,
        laptop_count: 0,
        is_closed: false,
        flag_anomaly: false,
        notes: '',
        recorded_at: new Date().toISOString()
      });
      toast.success('New visit created');
    } catch (error) {
      toast.error('Failed to create new visit');
      console.error('Error creating duplicate visit:', error);
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${
      status === 'completed' ? 'border-green-500 border-2' : 'border-border'
    }`}>
      <CardContent className="p-3 sm:p-4">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-sm sm:text-base truncate flex-1 mr-2">{displayName}</h3>
          <div className="flex items-center gap-2 shrink-0">
            {canDuplicate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDuplicateVisit}
                className="h-6 w-6 p-0"
                title="Add another visit"
              >
                <Copy className="h-3 w-3" />
              </Button>
            )}
            {getStatusIcon(status)}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {venue.address && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{venue.address}</span>
          </div>
        )}

        {/* Status and Current Values */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="shrink-0">{getStatusBadge(status)}</div>
            
            {walkEntry && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{walkEntry.people_count}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Laptop className="h-3 w-3" />
                  <span>{walkEntry.laptop_count}</span>
                </div>
                {walkEntry.recorded_at && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      {format(toZonedTime(new Date(walkEntry.recorded_at), 'Europe/London'), 'HH:mm')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Capacity Information */}
          {walkEntry && (
            <CapacityIndicator
              currentCount={walkEntry.people_count}
              maxCapacity={venue.max_capacity}
              capacityPercentage={walkEntry.capacity_percentage}
              showDetails={true}
            />
          )}
          
          {/* Real-time capacity preview when entering data */}
          {isExpanded && !entryData.is_closed && (
            <CapacityIndicator
              currentCount={entryData.people_count || 0}
              maxCapacity={venue.max_capacity}
              showDetails={true}
            />
          )}
        </div>

        {/* Expandable Data Entry Form */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Quick Status */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`closed-${venue.id}-${visitNumber}`}
                checked={entryData.is_closed}
                onCheckedChange={(checked) => 
                  setEntryData(prev => ({ ...prev, is_closed: checked as boolean }))
                }
                className="h-5 w-5"
              />
              <Label htmlFor={`closed-${venue.id}-${visitNumber}`} className="text-sm">Venue is closed</Label>
            </div>

            {!entryData.is_closed && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`people-${venue.id}-${visitNumber}`} className="flex items-center gap-2 text-sm">
                      <Users className="h-3 w-3" />
                      People Count
                    </Label>
                    <Input
                      id={`people-${venue.id}-${visitNumber}`}
                      type="number"
                      min="0"
                      value={entryData.people_count || 0}
                      onChange={(e) => 
                        setEntryData(prev => ({ 
                          ...prev, 
                          people_count: parseInt(e.target.value) || 0 
                        }))
                      }
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`laptop-${venue.id}-${visitNumber}`} className="flex items-center gap-2 text-sm">
                      <Laptop className="h-3 w-3" />
                      Laptop Count
                    </Label>
                    <Input
                      id={`laptop-${venue.id}-${visitNumber}`}
                      type="number"
                      min="0"
                      value={entryData.laptop_count || 0}
                      onChange={(e) => 
                        setEntryData(prev => ({ 
                          ...prev, 
                          laptop_count: parseInt(e.target.value) || 0 
                        }))
                      }
                      className="h-9"
                    />
                  </div>
                </div>

                {/* Flag Anomaly */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`anomaly-${venue.id}-${visitNumber}`}
                    checked={entryData.flag_anomaly}
                    onCheckedChange={(checked) => 
                      setEntryData(prev => ({ ...prev, flag_anomaly: checked as boolean }))
                    }
                    className="h-5 w-5"
                  />
                  <Label htmlFor={`anomaly-${venue.id}-${visitNumber}`} className="flex items-center gap-2 text-sm">
                    <Flag className="h-3 w-3" />
                    Flag as anomaly
                  </Label>
                </div>
              </>
            )}

            {/* Timestamp */}
            <div className="space-y-2">
              <Label htmlFor={`time-${venue.id}-${visitNumber}`} className="flex items-center gap-2 text-sm">
                <Clock className="h-3 w-3" />
                Recorded Time (GMT)
              </Label>
              <Input
                id={`time-${venue.id}-${visitNumber}`}
                type="datetime-local"
                value={entryData.recorded_at ? 
                  format(toZonedTime(new Date(entryData.recorded_at), 'Europe/London'), "yyyy-MM-dd'T'HH:mm") : 
                  format(toZonedTime(new Date(), 'Europe/London'), "yyyy-MM-dd'T'HH:mm")
                }
                onChange={(e) => {
                  const gmtDate = new Date(e.target.value);
                  const utcDate = fromZonedTime(gmtDate, 'Europe/London');
                  setEntryData(prev => ({ ...prev, recorded_at: utcDate.toISOString() }));
                }}
                className="h-9"
              />
              <p className="text-xs text-muted-foreground">
                Automatically adjusts for British Summer Time (GMT/BST)
              </p>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor={`notes-${venue.id}-${visitNumber}`} className="text-sm">Notes</Label>
              <Textarea
                id={`notes-${venue.id}-${visitNumber}`}
                placeholder="Any observations or notes..."
                value={entryData.notes || ''}
                onChange={(e) => 
                  setEntryData(prev => ({ ...prev, notes: e.target.value }))
                }
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Save Button */}
            <Button 
              onClick={handleSaveEntry} 
              disabled={loading}
              className="w-full h-9"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Entry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};