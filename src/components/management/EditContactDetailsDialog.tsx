import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditContactDetailsDialogProps {
  eventId: string;
  event: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EditContactDetailsDialog = ({ eventId, event, open, onOpenChange }: EditContactDetailsDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: ''
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    if (event && open) {
      setFormData({
        client_name: event.client_name || '',
        client_email: event.client_email || '',
        client_phone: event.client_phone || ''
      });
    }
  }, [event, open]);

  const isValidEmail = (email: string) => {
    if (!email) return true; // Allow empty email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validation
    if (!formData.client_name.trim()) {
      toast.error('Client name is required');
      setLoading(false);
      return;
    }

    if (formData.client_email && !isValidEmail(formData.client_email)) {
      toast.error('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const updateData = {
        client_name: formData.client_name.trim() || null,
        client_email: formData.client_email.trim() || null,
        client_phone: formData.client_phone.trim() || null
      };

      const { error } = await supabase.rpc('update_management_event', {
        p_id: eventId,
        patch: updateData
      });

      if (error) throw error;

      toast.success('Contact details updated successfully');
      queryClient.invalidateQueries({ queryKey: ['management-event', eventId] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating contact details:', error);
      toast.error(error.message || 'Failed to update contact details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-brutalist uppercase tracking-wide">EDIT CONTACT DETAILS</DialogTitle>
          <DialogDescription className="font-industrial">
            Update client contact information for {event?.code}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client_name" className="font-industrial uppercase text-xs tracking-wide">
              Client Name *
            </Label>
            <Input
              id="client_name"
              type="text"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Enter client name"
              className="font-industrial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_email" className="font-industrial uppercase text-xs tracking-wide">
              Client Email
            </Label>
            <Input
              id="client_email"
              type="email"
              value={formData.client_email}
              onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
              placeholder="Enter client email"
              className="font-industrial"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client_phone" className="font-industrial uppercase text-xs tracking-wide">
              Client Phone
            </Label>
            <Input
              id="client_phone"
              type="tel"
              value={formData.client_phone}
              onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
              placeholder="Enter client phone"
              className="font-industrial"
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
              {loading ? 'UPDATING...' : 'UPDATE CONTACT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};