import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useResearch } from '@/hooks/useResearch';
import { toast } from 'sonner';

interface CreateWalkaroundModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TIME_BLOCKS = [
  { value: 'EarlyMorning', label: 'Early Morning' },
  { value: 'MidMorning', label: 'Mid Morning' },
  { value: 'Lunch', label: 'Lunch' },
  { value: 'MidAfternoon', label: 'Mid Afternoon' },
  { value: 'EarlyEvening', label: 'Early Evening' },
  { value: 'Evening', label: 'Evening' },
  { value: 'Late', label: 'Late' },
];

const WEATHER_PRESETS = [
  { value: 'Sunny', label: 'Sunny' },
  { value: 'Overcast', label: 'Overcast' },
  { value: 'Rain', label: 'Rain' },
  { value: 'Mixed', label: 'Mixed' },
  { value: 'ColdSnap', label: 'Cold Snap' },
  { value: 'Heatwave', label: 'Heatwave' },
];

const CROFT_ZONES = [
  'Café',
  'Cocktail Bar', 
  'Beer Hall',
  'Kitchens'
];

export const CreateWalkaroundModal: React.FC<CreateWalkaroundModalProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { geoAreas, createWalkCard, loading } = useResearch();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeBlock: '',
    weatherPreset: '',
    weatherTempC: '',
    weatherNotes: '',
    croftZones: [] as string[],
    selectedGeoAreas: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.timeBlock) {
      toast.error('Please select a time block');
      return;
    }
    
    if (!formData.weatherPreset) {
      toast.error('Please select a weather preset');
      return;
    }
    
    if (formData.selectedGeoAreas.length === 0) {
      toast.error('Please select at least one geo area');
      return;
    }

    const walkCard = await createWalkCard({
      date: formData.date,
      time_block: formData.timeBlock as any,
      weather_preset: formData.weatherPreset as any,
      weather_temp_c: formData.weatherTempC ? parseInt(formData.weatherTempC) : undefined,
      weather_notes: formData.weatherNotes || undefined,
      croft_zones: formData.croftZones,
    });

    if (walkCard) {
      // Create geo area associations
      for (const geoAreaId of formData.selectedGeoAreas) {
        // This would typically be handled in the backend or as a separate API call
        // For now, we'll keep it simple since the UI is the focus
      }
      
      onOpenChange(false);
      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        timeBlock: '',
        weatherPreset: '',
        weatherTempC: '',
        weatherNotes: '',
        croftZones: [],
        selectedGeoAreas: []
      });
    }
  };

  const handleCroftZoneChange = (zone: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      croftZones: checked 
        ? [...prev.croftZones, zone]
        : prev.croftZones.filter(z => z !== zone)
    }));
  };

  const handleGeoAreaChange = (areaId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedGeoAreas: checked 
        ? [...prev.selectedGeoAreas, areaId]
        : prev.selectedGeoAreas.filter(id => id !== areaId)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Walkaround</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          {/* Time Block */}
          <div className="space-y-3">
            <Label>Time Block *</Label>
            <RadioGroup 
              value={formData.timeBlock} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, timeBlock: value }))}
            >
              <div className="grid grid-cols-2 gap-2">
                {TIME_BLOCKS.map((block) => (
                  <div key={block.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={block.value} id={block.value} />
                    <Label htmlFor={block.value}>{block.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Weather */}
          <div className="space-y-3">
            <Label>Weather Preset *</Label>
            <RadioGroup 
              value={formData.weatherPreset} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, weatherPreset: value }))}
            >
              <div className="grid grid-cols-2 gap-2">
                {WEATHER_PRESETS.map((preset) => (
                  <div key={preset.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={preset.value} id={preset.value} />
                    <Label htmlFor={preset.value}>{preset.label}</Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Optional Weather Details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temp">Temperature (°C)</Label>
              <Input
                id="temp"
                type="number"
                value={formData.weatherTempC}
                onChange={(e) => setFormData(prev => ({ ...prev, weatherTempC: e.target.value }))}
                placeholder="20"
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label htmlFor="weather-notes">Weather Notes</Label>
              <Textarea
                id="weather-notes"
                value={formData.weatherNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, weatherNotes: e.target.value }))}
                placeholder="Any additional weather observations..."
                rows={2}
              />
            </div>
          </div>

          {/* Croft Common Zones */}
          <div className="space-y-3">
            <Label>Croft Common Zones</Label>
            <div className="grid grid-cols-2 gap-2">
              {CROFT_ZONES.map((zone) => (
                <div key={zone} className="flex items-center space-x-2">
                  <Checkbox
                    id={zone}
                    checked={formData.croftZones.includes(zone)}
                    onCheckedChange={(checked) => handleCroftZoneChange(zone, checked as boolean)}
                  />
                  <Label htmlFor={zone}>{zone}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Geo Areas */}
          <div className="space-y-3">
            <Label>Geo Areas * (Select areas to research)</Label>
            <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
              {geoAreas.map((area) => (
                <div key={area.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={area.id}
                    checked={formData.selectedGeoAreas.includes(area.id)}
                    onCheckedChange={(checked) => handleGeoAreaChange(area.id, checked as boolean)}
                  />
                  <Label htmlFor={area.id}>{area.name}</Label>
                </div>
              ))}
            </div>
            {geoAreas.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No geo areas available. Add some in the Manage tab first.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              Create Walkaround
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
