import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CreateEventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
}

export const CreateEventDialog = ({ open, onOpenChange, leadId }: CreateEventDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    event_type: '',
    headcount: '',
    notes: '',
    owner_id: ''
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: eventId, error } = await supabase.rpc('create_management_event', {
        payload: {
          event_type: formData.event_type || null,
          headcount: formData.headcount || null,
          notes: formData.notes || null,
          owner_id: formData.owner_id || null
        }
      });

      if (error) throw error;

      toast.success('Event created successfully');
      queryClient.invalidateQueries({ queryKey: ['management-events'] });
      onOpenChange(false);
      
      // Navigate to the new event
      navigate(`/management/events/${eventId}`);
      
      // Reset form
      setFormData({
        event_type: '',
        headcount: '',
        notes: '',
        owner_id: ''
      });
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-brutalist uppercase tracking-wide">CREATE EVENT</DialogTitle>
          <DialogDescription className="font-industrial">
            Create a new event to manage multiple space bookings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event_type" className="font-industrial uppercase text-xs tracking-wide">
              Event Type
            </Label>
            <Input
              id="event_type"
              value={formData.event_type}
              onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              placeholder="e.g. Corporate Event, Wedding, Conference"
              className="font-industrial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="headcount" className="font-industrial uppercase text-xs tracking-wide">
              Headcount
            </Label>
            <Input
              id="headcount"
              type="number"
              value={formData.headcount}
              onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
              placeholder="Expected number of guests"
              className="font-industrial"
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
              placeholder="Additional event details..."
              className="font-industrial min-h-[80px]"
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
              {loading ? 'CREATING...' : 'CREATE EVENT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};