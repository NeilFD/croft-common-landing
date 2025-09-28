import { useState, useEffect } from 'react';
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
import { useLead } from '@/hooks/useLeads';
import { format } from 'date-fns';

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
    owner_id: '',
    start_date: '',
    start_time: '09:00',
    budget: '',
    client_contact: ''
  });

  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: lead } = useLead(leadId || '');

  // Pre-populate form when lead data is available
  useEffect(() => {
    if (lead && open) {
      const budgetText = lead.budget_low || lead.budget_high 
        ? `£${lead.budget_low || 0} - £${lead.budget_high || 'No upper limit'}`
        : '';
      
      const clientContact = `${lead.first_name} ${lead.last_name}${lead.phone ? ` (${lead.phone})` : ''}`;
      
      let notesText = '';
      if (lead.message) notesText += lead.message;
      if (lead.date_flexible) notesText += '\nFlexible on dates';
      if (lead.budget_low || lead.budget_high) {
        notesText += `\nBudget: ${budgetText}`;
      }
      
      setFormData({
        event_type: lead.event_type || '',
        headcount: lead.headcount?.toString() || '',
        notes: notesText.trim(),
        owner_id: '',
        start_date: lead.preferred_date || '',
        start_time: '09:00',
        budget: budgetText,
        client_contact: clientContact
      });
    }
  }, [lead, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse budget number from text
      const budgetNumber = formData.budget ? parseFloat(formData.budget.replace(/[£,\s-]/g, '').split(' ')[0]) || null : null;
      
      const { data: eventId, error } = await supabase.rpc('create_management_event', {
        p_event_type: formData.event_type || null,
        p_headcount: formData.headcount ? parseInt(formData.headcount) : null,
        p_notes: formData.notes || null,
        p_start_date: formData.start_date || null,
        p_start_time: formData.start_time || null,
        p_budget: budgetNumber,
        p_client_name: lead ? `${lead.first_name} ${lead.last_name}` : formData.client_contact || null,
        p_client_email: lead?.email || null,
        p_client_phone: lead?.phone || null,
        p_lead_id: leadId || null
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
        owner_id: '',
        start_date: '',
        start_time: '09:00',
        budget: '',
        client_contact: ''
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-brutalist uppercase tracking-wide">CREATE EVENT</DialogTitle>
          <DialogDescription className="font-industrial">
            Create a new event to manage multiple space bookings
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="start_date" className="font-industrial uppercase text-xs tracking-wide">
                Event Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="font-industrial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_time" className="font-industrial uppercase text-xs tracking-wide">
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="font-industrial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget" className="font-industrial uppercase text-xs tracking-wide">
                Budget
              </Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="e.g. £2,000 - £5,000"
                className="font-industrial"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_contact" className="font-industrial uppercase text-xs tracking-wide">
                Client Contact
              </Label>
              <Input
                id="client_contact"
                value={formData.client_contact}
                onChange={(e) => setFormData({ ...formData, client_contact: e.target.value })}
                placeholder="Client name and contact details"
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