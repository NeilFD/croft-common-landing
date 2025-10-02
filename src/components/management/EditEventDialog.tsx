import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditEventDialogProps {
  eventId: string;
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditEventDialog = ({ eventId, event, open, onOpenChange }: EditEventDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_type: '',
    headcount: '',
    notes: '',
    primary_date: undefined as Date | undefined,
    organiser_name: '',
    organiser_email: '',
    organiser_phone: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (event && open) {
      setFormData({
        event_type: event.event_type || '',
        headcount: event.headcount?.toString() || '',
        notes: event.notes || '',
        primary_date: event.primary_date ? new Date(event.primary_date) : undefined,
        organiser_name: event.organiser_name || '',
        organiser_email: event.organiser_email || '',
        organiser_phone: event.organiser_phone || ''
      });
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        event_type: formData.event_type || null,
        notes: formData.notes || null,
        organiser_name: formData.organiser_name || null,
        organiser_email: formData.organiser_email || null,
        organiser_phone: formData.organiser_phone || null
      };

      if (formData.headcount) {
        updateData.headcount = parseInt(formData.headcount);
      }

      if (formData.primary_date) {
        updateData.primary_date = format(formData.primary_date, 'yyyy-MM-dd');
      }

      const { error } = await supabase.rpc('update_management_event', {
        p_id: eventId,
        patch: updateData
      });

      if (error) throw error;

      toast.success('Event updated successfully');
      queryClient.invalidateQueries({ queryKey: ['management-event', eventId] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast.error(error.message || 'Failed to update event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-brutalist uppercase tracking-wide">EDIT EVENT</DialogTitle>
          <DialogDescription className="font-industrial">
            Update event details for {event?.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="event_type" className="font-industrial uppercase text-xs tracking-wide">
                Event Type
              </Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({ ...formData, event_type: value })}>
                <SelectTrigger className="font-industrial">
                  <SelectValue placeholder="Select event type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Conference">Conference</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Workshop">Workshop</SelectItem>
                  <SelectItem value="Presentation">Presentation</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Social Event">Social Event</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-industrial uppercase text-xs tracking-wide">
                Event Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-industrial",
                      !formData.primary_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.primary_date ? format(formData.primary_date, "dd MMM yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.primary_date}
                    onSelect={(date) => setFormData({ ...formData, primary_date: date })}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="headcount" className="font-industrial uppercase text-xs tracking-wide">
              Expected Headcount
            </Label>
            <Input
              id="headcount"
              type="number"
              value={formData.headcount}
              onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
              placeholder="Number of attendees"
              className="font-industrial"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="organiser_name" className="font-industrial uppercase text-xs tracking-wide">
              Organiser Name
            </Label>
            <Input
              id="organiser_name"
              type="text"
              value={formData.organiser_name}
              onChange={(e) => setFormData({ ...formData, organiser_name: e.target.value })}
              placeholder="Event organiser's name"
              className="font-industrial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="organiser_email" className="font-industrial uppercase text-xs tracking-wide">
                Organiser Email
              </Label>
              <Input
                id="organiser_email"
                type="email"
                value={formData.organiser_email}
                onChange={(e) => setFormData({ ...formData, organiser_email: e.target.value })}
                placeholder="organiser@example.com"
                className="font-industrial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organiser_phone" className="font-industrial uppercase text-xs tracking-wide">
                Organiser Phone
              </Label>
              <Input
                id="organiser_phone"
                type="tel"
                value={formData.organiser_phone}
                onChange={(e) => setFormData({ ...formData, organiser_phone: e.target.value })}
                placeholder="+44 7XXX XXXXXX"
                className="font-industrial"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="font-industrial uppercase text-xs tracking-wide">
              Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes about the event"
              className="font-industrial min-h-[100px]"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 font-brutalist uppercase tracking-wide border-industrial"
            >
              CANCEL
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary font-brutalist uppercase tracking-wide"
            >
              {loading ? 'UPDATING...' : 'UPDATE EVENT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};