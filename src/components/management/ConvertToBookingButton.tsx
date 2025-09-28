import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarDays } from "lucide-react";
import { BookingForm } from "@/components/management/BookingForm";
import { ConvertToEventButton } from "@/components/management/ConvertToEventButton";
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
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        onClick={() => setShowBookingForm(true)}
        className="bg-accent text-accent-foreground hover:bg-accent/80 border-2 border-foreground font-industrial font-bold"
      >
        <Calendar className="h-4 w-4 mr-2" />
        CONVERT TO BOOKING
      </Button>

      <ConvertToEventButton 
        leadId={leadId} 
        leadTitle={leadTitle} 
      />

      <BookingForm
        isOpen={showBookingForm}
        onClose={() => setShowBookingForm(false)}
        leadId={leadId}
        initialDate={new Date()}
        initialHour={9}
      />
    </div>
  );
};