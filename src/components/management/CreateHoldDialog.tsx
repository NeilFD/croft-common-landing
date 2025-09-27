import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

interface CreateHoldDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateHoldDialog = ({ eventId, open, onOpenChange }: CreateHoldDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    space_id: '',
    title: '',
    start_ts: '',
    end_ts: '',
    setup_min: '0',
    teardown_min: '0',
    status: 'hold_soft'
  });

  const queryClient = useQueryClient();

  const { data: spaces } = useQuery({
    queryKey: ['spaces'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.rpc('create_hold', {
        payload: {
          event_id: eventId,
          space_id: formData.space_id,
          title: formData.title,
          start_ts: formData.start_ts,
          end_ts: formData.end_ts,
          setup_min: parseInt(formData.setup_min) || 0,
          teardown_min: parseInt(formData.teardown_min) || 0,
          status: formData.status
        }
      });

      if (error) {
        if (error.message.includes('conflict_with_higher_or_equal_priority')) {
          throw new Error('Cannot create hold - conflicts with existing booking of equal or higher priority');
        }
        if (error.message.includes('outside_trading_hours')) {
          throw new Error('Booking is outside of trading hours');
        }
        throw error;
      }

      toast.success('Hold created successfully');
      queryClient.invalidateQueries({ queryKey: ['management-event', eventId] });
      onOpenChange(false);
      
      // Reset form
      setFormData({
        space_id: '',
        title: '',
        start_ts: '',
        end_ts: '',
        setup_min: '0',
        teardown_min: '0',
        status: 'hold_soft'
      });
    } catch (error: any) {
      console.error('Error creating hold:', error);
      toast.error(error.message || 'Failed to create hold');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-brutalist uppercase tracking-wide">CREATE HOLD</DialogTitle>
          <DialogDescription className="font-industrial">
            Add a new space booking to this event
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="space_id" className="font-industrial uppercase text-xs tracking-wide">
              Space
            </Label>
            <Select value={formData.space_id} onValueChange={(value) => setFormData({ ...formData, space_id: value })}>
              <SelectTrigger className="font-industrial">
                <SelectValue placeholder="Select a space" />
              </SelectTrigger>
              <SelectContent>
                {spaces?.map((space) => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="font-industrial uppercase text-xs tracking-wide">
              Title
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Booking title"
              className="font-industrial"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_ts" className="font-industrial uppercase text-xs tracking-wide">
                Start Time
              </Label>
              <Input
                id="start_ts"
                type="datetime-local"
                value={formData.start_ts}
                onChange={(e) => setFormData({ ...formData, start_ts: e.target.value })}
                className="font-industrial"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_ts" className="font-industrial uppercase text-xs tracking-wide">
                End Time
              </Label>
              <Input
                id="end_ts"
                type="datetime-local"
                value={formData.end_ts}
                onChange={(e) => setFormData({ ...formData, end_ts: e.target.value })}
                className="font-industrial"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="setup_min" className="font-industrial uppercase text-xs tracking-wide">
                Setup (minutes)
              </Label>
              <Input
                id="setup_min"
                type="number"
                value={formData.setup_min}
                onChange={(e) => setFormData({ ...formData, setup_min: e.target.value })}
                className="font-industrial"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teardown_min" className="font-industrial uppercase text-xs tracking-wide">
                Teardown (minutes)
              </Label>
              <Input
                id="teardown_min"
                type="number"
                value={formData.teardown_min}
                onChange={(e) => setFormData({ ...formData, teardown_min: e.target.value })}
                className="font-industrial"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="font-industrial uppercase text-xs tracking-wide">
              Hold Type
            </Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger className="font-industrial">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hold_soft">Soft Hold</SelectItem>
                <SelectItem value="hold_firm">Firm Hold</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={loading || !formData.space_id || !formData.title || !formData.start_ts || !formData.end_ts}
              className="flex-1 btn-primary font-brutalist uppercase tracking-wide"
            >
              {loading ? 'CREATING...' : 'CREATE HOLD'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};