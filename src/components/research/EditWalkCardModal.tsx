import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useResearch, WalkCard } from '@/hooks/useResearch';
import { toast } from 'sonner';

interface EditWalkCardModalProps {
  walkCard: WalkCard;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

const TIME_BLOCKS = [
  'EarlyMorning',
  'MidMorning', 
  'Lunch',
  'MidAfternoon',
  'EarlyEvening',
  'Evening',
  'Late'
] as const;

const WEATHER_PRESETS = [
  'Sunny',
  'Overcast', 
  'Rain',
  'Mixed',
  'ColdSnap',
  'Heatwave'
] as const;

const CROFT_ZONES = [
  'Café',
  'Kitchens',
  'Bar',
  'Lounge',
  'Coworking',
  'Meeting Rooms',
  'Terrace',
  'Garden'
];

export const EditWalkCardModal: React.FC<EditWalkCardModalProps> = ({ 
  walkCard, 
  trigger,
  onSuccess 
}) => {
  const { updateWalkCard, loading } = useResearch();
  const [open, setOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    title: walkCard.title,
    date: new Date(walkCard.date),
    timeBlock: walkCard.time_block,
    weatherPreset: walkCard.weather_preset,
    weatherTempC: walkCard.weather_temp_c || '',
    weatherNotes: walkCard.weather_notes || '',
    croftZones: walkCard.croft_zones
  });

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setFormData({
        title: walkCard.title,
        date: new Date(walkCard.date),
        timeBlock: walkCard.time_block,
        weatherPreset: walkCard.weather_preset,
        weatherTempC: walkCard.weather_temp_c || '',
        weatherNotes: walkCard.weather_notes || '',
        croftZones: walkCard.croft_zones
      });
    }
  }, [open, walkCard]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateWalkCard(walkCard.id, {
        title: formData.title.trim(),
        date: format(formData.date, 'yyyy-MM-dd'),
        time_block: formData.timeBlock,
        weather_preset: formData.weatherPreset,
        weather_temp_c: formData.weatherTempC ? parseInt(formData.weatherTempC.toString()) : undefined,
        weather_notes: formData.weatherNotes || undefined,
        croft_zones: formData.croftZones,
      });
      
      toast.success('Walk card updated successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating walk card:', error);
      toast.error('Failed to update walk card');
    }
  };

  const handleZoneToggle = (zone: string) => {
    setFormData(prev => ({
      ...prev,
      croftZones: prev.croftZones.includes(zone)
        ? prev.croftZones.filter(z => z !== zone)
        : [...prev.croftZones, zone]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Edit className="mr-1 h-3 w-3" />
            Amend
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Amend Walk Card</DialogTitle>
          <DialogDescription>
            Update the details of this research session.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Walk Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Morning Coffee Shop Survey"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="timeBlock">Time Block</Label>
                <Select 
                  value={formData.timeBlock} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, timeBlock: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_BLOCKS.map(block => (
                      <SelectItem key={block} value={block}>
                        {block.replace(/([A-Z])/g, ' $1').trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Weather */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Weather Conditions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weatherPreset">Weather</Label>
                <Select 
                  value={formData.weatherPreset} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, weatherPreset: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_PRESETS.map(preset => (
                      <SelectItem key={preset} value={preset}>
                        {preset}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="weatherTempC">Temperature (°C)</Label>
                <Input
                  id="weatherTempC"
                  type="number"
                  value={formData.weatherTempC}
                  onChange={(e) => setFormData(prev => ({ ...prev, weatherTempC: e.target.value }))}
                  placeholder="e.g. 18"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="weatherNotes">Weather Notes</Label>
              <Textarea
                id="weatherNotes"
                value={formData.weatherNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, weatherNotes: e.target.value }))}
                placeholder="Additional weather observations..."
                rows={2}
              />
            </div>
          </div>

          {/* Croft Zones */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Croft Zones to Survey</h3>
            <div className="grid grid-cols-2 gap-2">
              {CROFT_ZONES.map((zone) => (
                <div key={zone} className="flex items-center space-x-2">
                  <Checkbox
                    id={`zone-${zone}`}
                    checked={formData.croftZones.includes(zone)}
                    onCheckedChange={() => handleZoneToggle(zone)}
                  />
                  <Label htmlFor={`zone-${zone}`} className="text-sm font-normal">
                    {zone}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Walk Card'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};