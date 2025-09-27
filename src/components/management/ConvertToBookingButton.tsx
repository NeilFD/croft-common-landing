import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Loader2 } from "lucide-react";
import { BookingForm } from "@/components/management/BookingForm";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import { toast } from "@/hooks/use-toast";

interface ConvertToBookingButtonProps {
  leadId: string;
  leadTitle?: string;
}

export const ConvertToBookingButton = ({ leadId, leadTitle }: ConvertToBookingButtonProps) => {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const { canCreateBookings } = useRoleBasedAccess();

  if (!canCreateBookings()) {
    return null; // Hide button if user can't create bookings
  }

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Lead successfully converted to booking",
    });
    setShowBookingForm(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowBookingForm(true)}
        className="bg-accent text-accent-foreground hover:bg-accent/80 border-2 border-foreground font-industrial font-bold"
      >
        <Calendar className="h-4 w-4 mr-2" />
        CONVERT TO BOOKING
      </Button>

      <BookingForm
        isOpen={showBookingForm}
        onClose={() => setShowBookingForm(false)}
        leadId={leadId}
        initialDate={new Date()}
        initialHour={9}
      />
    </>
  );
};