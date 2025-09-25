import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Building2 } from 'lucide-react';
import { useResearch } from '@/hooks/useResearch';

interface QuickVenueCreatorProps {
  selectedGeoAreaIds: string[];
  onVenueCreated?: () => void;
}

export const QuickVenueCreator: React.FC<QuickVenueCreatorProps> = ({
  selectedGeoAreaIds,
  onVenueCreated
}) => {
  const { geoAreas, createVenue, loading } = useResearch();
  const [open, setOpen] = useState(false);
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [selectedGeoAreaId, setSelectedGeoAreaId] = useState('');

  const availableGeoAreas = geoAreas.filter(area => 
    selectedGeoAreaIds.includes(area.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!venueName.trim() || !selectedGeoAreaId) return;

    await createVenue({
      name: venueName.trim(),
      address: venueAddress.trim() || null,
      geo_area_id: selectedGeoAreaId
    });

    // Reset form
    setVenueName('');
    setVenueAddress('');
    setSelectedGeoAreaId('');
    setOpen(false);
    onVenueCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Venue
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Create New Venue
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="venue-name">Venue Name *</Label>
            <Input
              id="venue-name"
              value={venueName}
              onChange={(e) => setVenueName(e.target.value)}
              placeholder="Enter venue name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-address">Address</Label>
            <Input
              id="venue-address"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              placeholder="Enter venue address (optional)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="geo-area">Geo Area *</Label>
            <Select value={selectedGeoAreaId} onValueChange={setSelectedGeoAreaId}>
              <SelectTrigger>
                <SelectValue placeholder="Select geo area" />
              </SelectTrigger>
              <SelectContent>
                {availableGeoAreas.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {availableGeoAreas.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No geo areas selected for this walk. Please select geo areas first.
            </p>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !venueName.trim() || !selectedGeoAreaId}
            >
              Create Venue
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};