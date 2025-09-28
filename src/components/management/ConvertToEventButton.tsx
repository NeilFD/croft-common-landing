import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarDays, Loader2 } from "lucide-react";
import { CreateEventDialog } from "@/components/management/CreateEventDialog";
import { useRoleBasedAccess } from "@/hooks/useRoleBasedAccess";
import { toast } from "@/hooks/use-toast";

interface ConvertToEventButtonProps {
  leadId: string;
  leadTitle?: string;
}

export const ConvertToEventButton = ({ leadId, leadTitle }: ConvertToEventButtonProps) => {
  const [showEventDialog, setShowEventDialog] = useState(false);
  const { canCreateBookings } = useRoleBasedAccess();

  if (!canCreateBookings()) {
    return null; // Hide button if user can't create events
  }

  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Lead successfully converted to event",
    });
    setShowEventDialog(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowEventDialog(true)}
        variant="outline"
        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-foreground font-industrial font-bold"
      >
        <CalendarDays className="h-4 w-4 mr-2" />
        CONVERT TO EVENT
      </Button>

      <CreateEventDialog
        open={showEventDialog}
        onOpenChange={setShowEventDialog}
        leadId={leadId}
      />
    </>
  );
};