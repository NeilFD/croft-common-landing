import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Minus, Plus, MoreHorizontal, Laptop, StickyNote, Camera, Flag, Store, X } from 'lucide-react';
import { useResearch, Venue, WalkEntry } from '@/hooks/useResearch';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface VenueObservationRowProps {
  venue: Venue;
  walkCardId: string;
  entry?: WalkEntry;
  showLaptopCountInline: boolean;
}

export const VenueObservationRow: React.FC<VenueObservationRowProps> = ({
  venue,
  walkCardId,
  entry,
  showLaptopCountInline
}) => {
  const { upsertWalkEntry } = useResearch();
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [tempNotes, setTempNotes] = useState(entry?.notes || '');
  const [tempLaptopCount, setTempLaptopCount] = useState(entry?.laptop_count || 0);

  const peopleCount = entry?.people_count || 0;
  const laptopCount = entry?.laptop_count || 0;
  const isClosed = entry?.is_closed || false;
  const isAnomalous = entry?.flag_anomaly || false;

  const updateEntry = async (updates: Partial<WalkEntry>) => {
    await upsertWalkEntry({
      walk_card_id: walkCardId,
      venue_id: venue.id,
      people_count: peopleCount,
      laptop_count: laptopCount,
      is_closed: isClosed,
      flag_anomaly: isAnomalous,
      notes: entry?.notes,
      ...updates,
    });
  };

  const adjustPeopleCount = (delta: number) => {
    const newCount = Math.max(0, peopleCount + delta);
    updateEntry({ people_count: newCount });
  };

  const adjustLaptopCount = (delta: number) => {
    const newCount = Math.max(0, laptopCount + delta);
    updateEntry({ laptop_count: newCount });
  };

  const toggleClosed = () => {
    updateEntry({ is_closed: !isClosed });
  };

  const quickAdd = (amount: number) => {
    adjustPeopleCount(amount);
  };

  const saveDetails = () => {
    updateEntry({ 
      notes: tempNotes || undefined,
      laptop_count: tempLaptopCount 
    });
    setShowDetailsDialog(false);
  };

  const toggleAnomaly = () => {
    updateEntry({ flag_anomaly: !isAnomalous });
  };

  return (
    <div className={`flex items-center justify-between p-4 border rounded-lg ${
      isClosed ? 'bg-muted/50 opacity-75' : ''
    } ${isAnomalous ? 'border-orange-200 bg-orange-50' : ''}`}>
      
      {/* Venue Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium truncate">{venue.name}</h4>
          {isClosed && <Badge variant="secondary">Closed</Badge>}
          {isAnomalous && <Flag className="h-4 w-4 text-orange-500" />}
        </div>
        {venue.address && (
          <p className="text-sm text-muted-foreground truncate">{venue.address}</p>
        )}
      </div>

      {/* People Counter */}
      <div className="flex items-center gap-2 mx-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustPeopleCount(-1)}
          disabled={peopleCount <= 0 || isClosed}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <div className="text-center min-w-[3rem]">
          <div className="text-lg font-bold">{peopleCount}</div>
          <div className="text-xs text-muted-foreground">people</div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => adjustPeopleCount(1)}
          disabled={isClosed}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Laptop Counter (Inline if Café zone) */}
      {showLaptopCountInline && (
        <div className="flex items-center gap-2 mx-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustLaptopCount(-1)}
            disabled={laptopCount <= 0 || isClosed}
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <div className="text-center min-w-[2.5rem]">
            <div className="text-sm font-semibold flex items-center gap-1">
              <Laptop className="h-3 w-3" />
              {laptopCount}
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => adjustLaptopCount(1)}
            disabled={isClosed}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Actions Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => quickAdd(5)}>
            Quick +5
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => quickAdd(10)}>
            Quick +10
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleClosed}>
            {isClosed ? (
              <>
                <Store className="mr-2 h-4 w-4" />
                Mark Open
              </>
            ) : (
              <>
                <X className="mr-2 h-4 w-4" />
                Mark Closed
              </>
            )}
          </DropdownMenuItem>
          {!showLaptopCountInline && (
            <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
              <Laptop className="mr-2 h-4 w-4" />
              Add Laptops
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowDetailsDialog(true)}>
            <StickyNote className="mr-2 h-4 w-4" />
            Add Note
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleAnomaly}>
            <Flag className="mr-2 h-4 w-4" />
            {isAnomalous ? 'Clear Flag' : 'Flag Anomaly'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{venue.name} - Details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {!showLaptopCountInline && (
              <div className="space-y-2">
                <Label htmlFor="laptop-count">Laptop Count</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTempLaptopCount(Math.max(0, tempLaptopCount - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="laptop-count"
                    type="number"
                    min="0"
                    value={tempLaptopCount}
                    onChange={(e) => setTempLaptopCount(parseInt(e.target.value) || 0)}
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTempLaptopCount(tempLaptopCount + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                placeholder="Any observations about this venue..."
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="anomaly"
                checked={isAnomalous}
                onCheckedChange={toggleAnomaly}
              />
              <Label htmlFor="anomaly">Flag as anomaly</Label>
            </div>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveDetails}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};