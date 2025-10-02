import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Building2, Save, Plus } from 'lucide-react';
import { EventVenueHire, useBEOMutations } from '@/hooks/useBEOData';

interface VenueBuilderProps {
  eventId: string;
  venueHire: EventVenueHire | null;
}

export const VenueBuilder: React.FC<VenueBuilderProps> = ({ eventId, venueHire }) => {
  const { addVenueHire, updateVenueHire } = useBEOMutations(eventId);
  
  const [formData, setFormData] = React.useState({
    venue_name: venueHire?.venue_name || '',
    hire_cost: venueHire?.hire_cost || 0,
    vat_rate: venueHire?.vat_rate || 20,
    setup_time: venueHire?.setup_time || '',
    breakdown_time: venueHire?.breakdown_time || '',
    capacity: venueHire?.capacity || 0,
    notes: venueHire?.notes || ''
  });

  React.useEffect(() => {
    if (venueHire) {
      setFormData({
        venue_name: venueHire.venue_name || '',
        hire_cost: venueHire.hire_cost || 0,
        vat_rate: venueHire.vat_rate || 20,
        setup_time: venueHire.setup_time || '',
        breakdown_time: venueHire.breakdown_time || '',
        capacity: venueHire.capacity || 0,
        notes: venueHire.notes || ''
      });
    }
  }, [venueHire]);

  const handleSave = async () => {
    if (venueHire) {
      await updateVenueHire.mutateAsync({
        id: venueHire.id,
        ...formData
      });
    } else {
      await addVenueHire.mutateAsync(formData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-['Oswald'] text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Venue Hire Details
          </CardTitle>
          <CardDescription>Configure venue hire costs and requirements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="venue_name">Venue Name</Label>
              <Input
                id="venue_name"
                value={formData.venue_name}
                onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                placeholder="e.g., Main Hall"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="hire_cost">Hire Cost (£)</Label>
              <Input
                id="hire_cost"
                type="number"
                step="0.01"
                value={formData.hire_cost}
                onChange={(e) => setFormData({ ...formData, hire_cost: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_rate">VAT Rate (%)</Label>
              <Input
                id="vat_rate"
                type="number"
                step="0.01"
                value={formData.vat_rate}
                onChange={(e) => setFormData({ ...formData, vat_rate: parseFloat(e.target.value) || 20 })}
                placeholder="20.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setup_time">Setup Time</Label>
              <Input
                id="setup_time"
                type="time"
                value={formData.setup_time}
                onChange={(e) => setFormData({ ...formData, setup_time: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="breakdown_time">Breakdown Time</Label>
              <Input
                id="breakdown_time"
                type="time"
                value={formData.breakdown_time}
                onChange={(e) => setFormData({ ...formData, breakdown_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Special Requirements / Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special requirements or notes about the venue hire..."
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSave}
            disabled={!formData.venue_name || addVenueHire.isPending || updateVenueHire.isPending}
            className="w-full md:w-auto"
          >
            {venueHire ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Venue Details
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Venue Details
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {venueHire && (
        <Card>
          <CardHeader>
            <CardTitle className="font-['Oswald'] text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Hire Cost:</span>
                <span className="font-mono">£{venueHire.hire_cost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT ({venueHire.vat_rate}%):</span>
                <span className="font-mono">£{(venueHire.hire_cost * (venueHire.vat_rate / 100)).toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total Cost:</span>
                <span className="font-mono">£{(venueHire.hire_cost * (1 + venueHire.vat_rate / 100)).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
