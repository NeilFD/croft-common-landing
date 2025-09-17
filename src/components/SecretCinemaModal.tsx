
import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AuthModal } from '@/components/AuthModal';
import { format } from 'date-fns';

type CinemaStatus = {
  release_id: string;
  month_key: string;        // ISO date
  screening_date: string;   // ISO date (YYYY-MM-DD)
  doors_time: string;       // '19:00:00'
  screening_time: string;   // '19:30:00'
  capacity: number;
  tickets_sold: number;
  tickets_left: number;
  is_sold_out: boolean;
  title: string | null;
  description: string | null;
  poster_url: string | null;
};

interface SecretCinemaModalProps {
  open: boolean;
  onClose: () => void;
}

const SecretCinemaModal = ({ open, onClose }: SecretCinemaModalProps) => {
  const { user } = useAuth();

  const [status, setStatus] = useState<CinemaStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [quantity, setQuantity] = useState<1 | 2>(1);
  const [primaryName, setPrimaryName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [emailModalOpen, setEmailModalOpen] = useState(false);

  const [confirmation, setConfirmation] = useState<{
    ticketNumbers: number[];
    releaseId: string;
  } | null>(null);

  const formattedScreening = useMemo(() => {
    if (!status) return '';
    try {
      const d = new Date(status.screening_date);
      return format(d, 'EEEE d MMMM, yyyy');
    } catch {
      return status.screening_date;
    }
  }, [status]);

  const doorsTime = useMemo(() => (status?.doors_time?.slice(0,5) ?? '19:00'), [status]);
  const screeningTime = useMemo(() => (status?.screening_time?.slice(0,5) ?? '19:30'), [status]);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_cinema_status');
      if (error) throw error;
      // RPC returns a setof rows; always handle as an array
      const rows = (data as unknown as CinemaStatus[]) ?? [];
      setStatus(rows.length > 0 ? rows[0] : null);
    } catch (e: any) {
      console.error('Failed to load cinema status:', e);
      toast({ title: 'Failed to load', description: e.message ?? 'Try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setConfirmation(null);
      loadStatus();
      if (!user) setEmailModalOpen(true);
    }
  }, [open, user]);

  // Adjust allowed quantity when tickets are low
  useEffect(() => {
    if (!status) return;
    if (status.tickets_left <= 1 && quantity === 2) {
      setQuantity(1);
    }
  }, [status, quantity]);

  const handleBook = async () => {
    if (!user) {
      setEmailModalOpen(true);
      return;
    }
    if (!primaryName.trim()) {
      toast({ title: 'Your name is required', description: 'Please enter the primary attendee name.', variant: 'destructive' });
      return;
    }
    if (quantity === 2 && !guestName.trim()) {
      toast({ title: 'Guest name required', description: 'You selected 2 tickets. Please add your guest name.', variant: 'destructive' });
      return;
    }
    if (!status) {
      toast({ title: 'Not ready', description: 'Please wait for status to load.', variant: 'destructive' });
      return;
    }
    if (status.is_sold_out || status.tickets_left <= 0) {
      toast({ title: 'Sold out', description: 'No tickets left for this month.' });
      return;
    }
    if (quantity === 2 && status.tickets_left < 2) {
      toast({ title: 'Only one left', description: 'Only one ticket remains. Please select 1.' });
      return;
    }

    setBooking(true);
    try {
      const { data, error } = await supabase.rpc('create_cinema_booking', {
        _user_id: user.id,
        _email: user.email,
        _primary_name: primaryName.trim(),
        _guest_name: quantity === 2 ? guestName.trim() : null,
        _quantity: quantity
      });

      if (error) throw error;

      // RPC returns a setof, handle both array and single row shapes
      const row = Array.isArray(data) ? data[0] : data;
      const ticket_numbers: number[] = row?.ticket_numbers ?? [];
      const release_id: string = row?.release_id;

      setConfirmation({ ticketNumbers: ticket_numbers, releaseId: release_id });
      toast({ title: 'Booking confirmed', description: `You’ve got ticket${ticket_numbers.length > 1 ? 's' : ''} #${ticket_numbers.join(', ')}` });

      // Send confirmation email (best-effort with explicit error handling)
      const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-cinema-ticket-email', {
        body: {
          toEmail: user.email,
          primaryName: primaryName.trim(),
          guestName: quantity === 2 ? guestName.trim() : '',
          quantity,
          ticketNumbers: ticket_numbers,
          screeningDate: status.screening_date,
          doorsTime,
          screeningTime,
          title: status.title ?? 'Secret Cinema Club',
        },
      });
      if (emailError) {
        console.error('Email send error:', emailError);
        toast({ title: 'Email failed', description: 'We could not send your email automatically. Use Resend button.', variant: 'destructive' });
      } else {
        console.log('Email sent result:', emailResult);
      }

      // Refresh status to reflect sold count
      await loadStatus();
    } catch (e: any) {
      console.error('Booking failed:', e);
      const msg = e?.message ?? 'Please try again';
      toast({ title: 'Booking failed', description: msg, variant: 'destructive' });
    } finally {
      setBooking(false);
    }
  };

  const resetAndClose = () => {
    setPrimaryName('');
    setGuestName('');
    setQuantity(1);
    setConfirmation(null);
    onClose();
  };

  const resendEmail = async () => {
    if (!user || !status || !confirmation) {
      toast({ title: 'Not ready', description: 'No booking found to email.' });
      return;
    }
    try {
      console.log('Resending ticket email to:', user.email);
      await supabase.functions.invoke('send-cinema-ticket-email', {
        body: {
          toEmail: user.email,
          primaryName: primaryName.trim(),
          guestName: confirmation.ticketNumbers.length > 1 ? guestName.trim() : '',
          quantity: confirmation.ticketNumbers.length,
          ticketNumbers: confirmation.ticketNumbers,
          screeningDate: status.screening_date,
          doorsTime,
          screeningTime,
          title: status.title ?? 'Secret Cinema Club',
        },
      });
      toast({ title: 'Email sent', description: `Sent to ${user.email}` });
    } catch (mailErr: any) {
      console.warn('Email resend failed:', mailErr);
      toast({ title: 'Email failed', description: 'Please check spam or try again later.', variant: 'destructive' });
    }
  };

  return (
    <>
      {/* Auth modal for verified members via 6-digit code */}
      <AuthModal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        onSuccess={() => {
          setEmailModalOpen(false);
          toast({ title: 'Signed in', description: 'You can now reserve your tickets.' });
        }}
        onCodeSent={() => {
          // Close both the auth modal and the cinema modal, returning to the main Hall menu
          setEmailModalOpen(false);
          onClose();
        }}
        requireAllowedDomain={false}
        title="Sign in to reserve Secret 7 Cinema Tickets"
        description="We’ll email you a 6-digit verification code to sign in."
      />

      <Dialog open={open} onOpenChange={resetAndClose}>
        <DialogContent className="sm:max-w-[600px] z-[10001]">
          <DialogHeader>
            <DialogTitle className="font-brutalist tracking-wide">
              Secret Cinema Club
            </DialogTitle>
            <DialogDescription className="font-industrial">
              One night. One screen. Fifty tickets. The last Thursday of every month. Cult. Classic. Contemporary. Always uncommonly good.
            </DialogDescription>
          </DialogHeader>

          {/* Status */}
          <div className="rounded-md border border-steel/30 p-4">
            {loading ? (
              <div className="text-steel">Loading status…</div>
            ) : status ? (
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-industrial text-foreground">
                    {formattedScreening}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-foreground/20 px-2 py-1 text-xs font-medium text-foreground">
                      Doors {doorsTime} · Screening {screeningTime}
                    </span>
                    {status.is_sold_out ? (
                      <span className="inline-flex items-center rounded-full border border-foreground/20 text-foreground px-2 py-1 text-xs font-bold">
                        SOLD OUT
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-foreground/20 text-foreground px-2 py-1 text-xs font-bold tabular-nums">
                        {status.tickets_left} left
                      </span>
                    )}
                  </div>
                </div>
                {status.title && (
                  <div className="text-steel text-sm mt-1">{status.title}</div>
                )}
              </div>
            ) : (
              <div className="text-steel">No status available.</div>
            )}
          </div>

          {/* Confirmation */}
          {confirmation ? (
            <div className="space-y-4">
              <div className="rounded-md bg-background border border-steel/30 p-4">
                <div className="font-industrial text-foreground">
                  Booking confirmed for {formattedScreening}
                </div>
                <div className="mt-2 text-foreground font-bold">
                  Ticket{confirmation.ticketNumbers.length > 1 ? 's' : ''}: #{confirmation.ticketNumbers.join(', ')}
                </div>
                <div className="text-steel text-sm mt-2">
                  We’ve emailed your confirmation. See you at {doorsTime} for doors — screening starts at {screeningTime}.
                </div>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={resendEmail}>
                  Resend email
                </Button>
                <Button onClick={resetAndClose} className="bg-foreground text-background hover:opacity-90">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            // Booking form
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryName">Your name</Label>
                  <Input
                    id="primaryName"
                    value={primaryName}
                    onChange={(e) => setPrimaryName(e.target.value)}
                    placeholder="Ada Lovelace"
                    disabled={booking || loading || status?.is_sold_out}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Tickets</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant={quantity === 1 ? 'default' : 'outline'}
                      onClick={() => setQuantity(1)}
                      disabled={booking || loading || status?.is_sold_out}
                      className={quantity === 1 ? 'bg-foreground text-background' : ''}
                    >
                      1
                    </Button>
                    <Button
                      type="button"
                      variant={quantity === 2 ? 'default' : 'outline'}
                      onClick={() => setQuantity(2)}
                      disabled={booking || loading || status?.is_sold_out || (status ? status.tickets_left < 2 : true)}
                      className={quantity === 2 ? 'bg-foreground text-background' : ''}
                    >
                      2
                    </Button>
                  </div>
                  {status && status.tickets_left < 2 && !status.is_sold_out && (
                    <div className="text-xs text-steel mt-1">Only one ticket remains.</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="guestName">Guest name (required for 2 tickets)</Label>
                <Input
                  id="guestName"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Alan Turing"
                  disabled={booking || loading || status?.is_sold_out || quantity === 1}
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={loadStatus}
                  disabled={booking || loading}
                >
                  Refresh
                </Button>
                <Button
                  type="button"
                  onClick={handleBook}
                  disabled={booking || loading || status?.is_sold_out}
                  className="bg-foreground text-background hover:opacity-90"
                >
                  {status?.is_sold_out ? 'Sold out' : booking ? 'Booking…' : 'Reserve tickets'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecretCinemaModal;
