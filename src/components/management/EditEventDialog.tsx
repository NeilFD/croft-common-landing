import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
    notes: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (event && open) {
      setFormData({
        event_type: event.event_type || '',
        headcount: event.headcount?.toString() || '',
        notes: event.notes || ''
      });
    }
  }, [event, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        event_type: formData.event_type || null,
        notes: formData.notes || null
      };

      if (formData.headcount) {
        updateData.headcount = parseInt(formData.headcount);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-brutalist uppercase tracking-wide">EDIT EVENT</DialogTitle>
          <DialogDescription className="font-industrial">
            Update event details for {event?.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
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