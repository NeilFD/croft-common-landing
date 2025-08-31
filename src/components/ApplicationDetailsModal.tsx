import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Phone, Mail, MapPin, Users, ChefHat, Star, MessageSquare } from "lucide-react";

interface ApplicationDetails {
  id: string;
  email: string;
  name: string;
  business_name: string;
  has_applied: boolean;
  application_date: string | null;
  calendly_booked: boolean;
  calendly_booking_date: string | null;
  application_business_name?: string;
  application_contact_name?: string;
  phone?: string;
  business_type?: string;
  cuisine_style?: string;
  years_experience?: number;
  team_size?: number;
  daily_covers_target?: number;
  current_location?: string;
  previous_food_hall_experience?: boolean;
  unique_selling_point?: string;
  social_media_handles?: string;
  questions_comments?: string;
}

interface ApplicationDetailsModalProps {
  application: ApplicationDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleMeeting: (email: string, currentStatus: boolean) => void;
}

export function ApplicationDetailsModal({ 
  application, 
  isOpen, 
  onClose, 
  onToggleMeeting 
}: ApplicationDetailsModalProps) {
  if (!application) return null;

  const getApplicationStatus = () => {
    if (application.calendly_booked) return { text: "Meeting Booked", variant: "default" as const };
    if (application.has_applied) return { text: "Applied", variant: "secondary" as const };
    return { text: "Not Applied", variant: "outline" as const };
  };

  const status = getApplicationStatus();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const exportToPDF = () => {
    const printContent = document.getElementById('application-details-print');
    if (printContent) {
      const originalDisplay = printContent.style.display;
      printContent.style.display = 'block';
      window.print();
      printContent.style.display = originalDisplay;
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Application Details - {application.name}</span>
              <Badge variant={status.variant}>{status.text}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Contact Information
                </h3>
                <p><strong>Email:</strong> {application.email}</p>
                <p><strong>Name:</strong> {application.name}</p>
                {application.phone && <p><strong>Phone:</strong> {application.phone}</p>}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Progress Tracking
                </h3>
                <p><strong>Application Date:</strong> {formatDate(application.application_date)}</p>
                <p><strong>Meeting Date:</strong> {formatDate(application.calendly_booking_date)}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant={application.calendly_booked ? "destructive" : "default"}
                    onClick={() => onToggleMeeting(application.email, application.calendly_booked)}
                  >
                    {application.calendly_booked ? "Mark as No Meeting" : "Mark as Meeting Booked"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={exportToPDF}>
                    Export PDF
                  </Button>
                </div>
              </div>
            </div>

            {/* Application Details */}
            {application.has_applied && (
              <>
                <div className="border-t pt-4">
                  <h3 className="font-semibold flex items-center gap-2 mb-4">
                    <ChefHat className="h-4 w-4" />
                    Business Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p><strong>Business Name:</strong> {application.application_business_name || "N/A"}</p>
                      <p><strong>Business Type:</strong> {application.business_type || "N/A"}</p>
                      <p><strong>Cuisine Style:</strong> {application.cuisine_style || "N/A"}</p>
                      <p><strong>Current Location:</strong> {application.current_location || "N/A"}</p>
                    </div>
                    <div>
                      <p><strong>Years Experience:</strong> {application.years_experience || "N/A"}</p>
                      <p><strong>Team Size:</strong> {application.team_size || "N/A"}</p>
                      <p><strong>Daily Covers Target:</strong> {application.daily_covers_target || "N/A"}</p>
                      <p><strong>Food Hall Experience:</strong> {application.previous_food_hall_experience ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </div>

                {application.unique_selling_point && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <Star className="h-4 w-4" />
                      Unique Selling Point
                    </h3>
                    <p className="bg-muted p-3 rounded-md">{application.unique_selling_point}</p>
                  </div>
                )}

                {application.social_media_handles && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-2">Social Media</h3>
                    <p className="bg-muted p-3 rounded-md">{application.social_media_handles}</p>
                  </div>
                )}

                {application.questions_comments && (
                  <div className="border-t pt-4">
                    <h3 className="font-semibold flex items-center gap-2 mb-2">
                      <MessageSquare className="h-4 w-4" />
                      Questions & Comments
                    </h3>
                    <p className="bg-muted p-3 rounded-md">{application.questions_comments}</p>
                  </div>
                )}
              </>
            )}

            {!application.has_applied && (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>This user has not submitted their application yet.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden printable content */}
      <div id="application-details-print" style={{ display: 'none' }}>
        <div className="p-8 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Kitchen Vendor Application - {application.name}</h1>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
              <p><strong>Email:</strong> {application.email}</p>
              <p><strong>Name:</strong> {application.name}</p>
              {application.phone && <p><strong>Phone:</strong> {application.phone}</p>}
            </div>
            <div>
              <h2 className="text-lg font-semibold mb-4">Application Status</h2>
              <p><strong>Status:</strong> {status.text}</p>
              <p><strong>Application Date:</strong> {formatDate(application.application_date)}</p>
              <p><strong>Meeting Date:</strong> {formatDate(application.calendly_booking_date)}</p>
            </div>
          </div>

          {application.has_applied && (
            <>
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Business Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Business Name:</strong> {application.application_business_name || "N/A"}</p>
                    <p><strong>Business Type:</strong> {application.business_type || "N/A"}</p>
                    <p><strong>Cuisine Style:</strong> {application.cuisine_style || "N/A"}</p>
                    <p><strong>Current Location:</strong> {application.current_location || "N/A"}</p>
                  </div>
                  <div>
                    <p><strong>Years Experience:</strong> {application.years_experience || "N/A"}</p>
                    <p><strong>Team Size:</strong> {application.team_size || "N/A"}</p>
                    <p><strong>Daily Covers Target:</strong> {application.daily_covers_target || "N/A"}</p>
                    <p><strong>Food Hall Experience:</strong> {application.previous_food_hall_experience ? "Yes" : "No"}</p>
                  </div>
                </div>
              </div>

              {application.unique_selling_point && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4">Unique Selling Point</h2>
                  <p>{application.unique_selling_point}</p>
                </div>
              )}

              {application.social_media_handles && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4">Social Media</h2>
                  <p>{application.social_media_handles}</p>
                </div>
              )}

              {application.questions_comments && (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-4">Questions & Comments</h2>
                  <p>{application.questions_comments}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}