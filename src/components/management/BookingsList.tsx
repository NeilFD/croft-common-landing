import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Building, Clock, MoreVertical, Calendar, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { EditBookingDialog } from './EditBookingDialog';

interface Booking {
  id: string;
  title: string;
  start_ts: string;
  end_ts: string;
  setup_min: number;
  teardown_min: number;
  status: string;
  space: {
    name: string;
  };
}

interface BookingsListProps {
  eventId: string;
  bookings: Booking[];
}

export const BookingsList = ({ eventId, bookings }: BookingsListProps) => {
  const queryClient = useQueryClient();
  const [editBooking, setEditBooking] = useState<any>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hold_soft': return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
      case 'hold_firm': return 'bg-[hsl(var(--accent-blue))] text-white';
      case 'definite': return 'bg-[hsl(var(--accent-green))] text-white';
      default: return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'hold_soft': return 'Soft Hold';
      case 'hold_firm': return 'Firm Hold';
      case 'definite': return 'Definite';
      default: return status;
    }
  };

  const handlePromoteHold = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase.rpc('promote_hold', {
        p_booking: bookingId,
        p_new_status: newStatus
      });

      if (error) throw error;

      toast.success(`Booking promoted to ${formatStatus(newStatus)}`);
      queryClient.invalidateQueries({ queryKey: ['management-event', eventId] });
    } catch (error: any) {
      console.error('Error promoting hold:', error);
      toast.error(error.message || 'Failed to promote hold');
    }
  };

  if (bookings.length === 0) {
    return (
      <Card className="border-industrial">
        <CardContent className="p-8 md:p-12 text-center">
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-brutalist text-lg font-black uppercase tracking-wide mb-2">
            NO BOOKINGS YET
          </h3>
          <p className="font-industrial text-muted-foreground">
            Add holds to start booking spaces for this event
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <Card key={booking.id} className="border-industrial">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="font-brutalist text-lg font-black uppercase tracking-wide">
                    {booking.title}
                  </CardTitle>
                  <Badge className={`font-industrial text-xs uppercase ${getStatusColor(booking.status)}`}>
                    {formatStatus(booking.status)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4" />
                    <span className="font-industrial">{booking.space?.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="font-industrial">
                      {format(new Date(booking.start_ts), 'dd MMM yyyy')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="font-industrial">
                      {format(new Date(booking.start_ts), 'HH:mm')} - {format(new Date(booking.end_ts), 'HH:mm')}
                    </span>
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border border-industrial">
                  <DropdownMenuItem
                    onClick={() => setEditBooking(booking)}
                    className="font-industrial"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Booking
                  </DropdownMenuItem>
                  
                  {booking.status === 'hold_soft' && (
                    <>
                      <DropdownMenuItem
                        onClick={() => handlePromoteHold(booking.id, 'hold_firm')}
                        className="font-industrial"
                      >
                        Promote to Firm Hold
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handlePromoteHold(booking.id, 'definite')}
                        className="font-industrial"
                      >
                        Promote to Definite
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {booking.status === 'hold_firm' && (
                    <DropdownMenuItem
                      onClick={() => handlePromoteHold(booking.id, 'definite')}
                      className="font-industrial"
                    >
                      Promote to Definite
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          {(booking.setup_min > 0 || booking.teardown_min > 0) && (
            <CardContent className="pt-0">
              <div className="flex gap-4 text-sm text-muted-foreground">
                {booking.setup_min > 0 && (
                  <span className="font-industrial">
                    Setup: {booking.setup_min} min
                  </span>
                )}
                {booking.teardown_min > 0 && (
                  <span className="font-industrial">
                    Teardown: {booking.teardown_min} min
                  </span>
                )}
              </div>
            </CardContent>
          )}
        </Card>
      ))}
      
      {editBooking && (
        <EditBookingDialog
          eventId={eventId}
          booking={editBooking}
          open={!!editBooking}
          onOpenChange={(open) => !open && setEditBooking(null)}
        />
      )}
    </div>
  );
};