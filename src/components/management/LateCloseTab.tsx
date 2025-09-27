import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Clock, Check, AlertTriangle } from 'lucide-react';
import { useRoleBasedAccess } from '@/hooks/useRoleBasedAccess';

interface LateCloseTabProps {
  event: {
    id: string;
    late_close_requested: boolean;
    late_close_reason: string | null;
    late_close_approved_by: string | null;
  };
}

export const LateCloseTab = ({ event }: LateCloseTabProps) => {
  const [requestReason, setRequestReason] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const { canEditBookings } = useRoleBasedAccess();

  const handleRequestLateClose = async () => {
    if (!requestReason.trim()) {
      toast.error('Please provide a reason for the late close request');
      return;
    }

    setLoading(true);
    
    try {
      const { error } = await supabase.rpc('request_late_close', {
        p_event: event.id,
        p_reason: requestReason
      });

      if (error) throw error;

      toast.success('Late close request submitted');
      queryClient.invalidateQueries({ queryKey: ['management-event', event.id] });
      setRequestReason('');
    } catch (error: any) {
      console.error('Error requesting late close:', error);
      toast.error(error.message || 'Failed to submit late close request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLateClose = async () => {
    setLoading(true);
    
    try {
      const { error } = await supabase.rpc('approve_late_close', {
        p_event: event.id
      });

      if (error) throw error;

      toast.success('Late close request approved');
      queryClient.invalidateQueries({ queryKey: ['management-event', event.id] });
    } catch (error: any) {
      console.error('Error approving late close:', error);
      toast.error(error.message || 'Failed to approve late close request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-industrial">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-[hsl(var(--accent-pink))]" />
          <CardTitle className="font-brutalist uppercase tracking-wide">LATE CLOSE REQUEST</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {event.late_close_requested ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-[hsl(var(--accent-blue))] text-white font-industrial text-xs uppercase">
                REQUEST PENDING
              </Badge>
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--accent-blue))]" />
            </div>
            
            <div className="space-y-2">
              <Label className="font-industrial uppercase text-xs tracking-wide text-muted-foreground">
                Reason for Late Close Request
              </Label>
              <div className="p-3 bg-[hsl(var(--muted))] rounded border">
                <p className="font-industrial text-sm">
                  {event.late_close_reason || 'No reason provided'}
                </p>
              </div>
            </div>

            {event.late_close_approved_by ? (
              <div className="flex items-center gap-2 p-3 bg-[hsl(var(--accent-green))/10] border border-[hsl(var(--accent-green))] rounded">
                <Check className="h-4 w-4 text-[hsl(var(--accent-green))]" />
                <span className="font-industrial text-sm text-[hsl(var(--accent-green))]">
                  Late close request has been approved
                </span>
              </div>
            ) : (
              canEditBookings() && (
                <Button
                  onClick={handleApproveLateClose}
                  disabled={loading}
                  className="btn-primary font-brutalist uppercase tracking-wide"
                >
                  {loading ? 'APPROVING...' : 'APPROVE LATE CLOSE'}
                </Button>
              )
            )}
          </div>
        ) : (
          canEditBookings() && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="late-close-reason" className="font-industrial uppercase text-xs tracking-wide">
                  Reason for Late Close Request
                </Label>
                <Textarea
                  id="late-close-reason"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Explain why this event needs to operate beyond normal trading hours..."
                  className="font-industrial min-h-[100px]"
                />
              </div>

              <Button
                onClick={handleRequestLateClose}
                disabled={loading || !requestReason.trim()}
                className="btn-primary font-brutalist uppercase tracking-wide"
              >
                {loading ? 'SUBMITTING...' : 'REQUEST LATE CLOSE'}
              </Button>

              <div className="p-4 bg-[hsl(var(--muted))] rounded border">
                <p className="font-industrial text-sm text-muted-foreground">
                  <strong>Note:</strong> Late close requests allow events to operate beyond normal trading hours. 
                  All requests require admin approval before taking effect.
                </p>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};