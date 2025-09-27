import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Timer
} from "lucide-react";
import { useBooking, useDeleteBooking } from "@/hooks/useBookings";
import { BookingForm } from "@/components/management/BookingForm";
import { useManagementAuth } from "@/hooks/useManagementAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showEditForm, setShowEditForm] = useState(false);
  const { canEdit } = useManagementAuth();

  const { data: booking, isLoading } = useBooking(id!);
  const deleteBooking = useDeleteBooking();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/management/spaces/calendar">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calendar
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading booking...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/management/spaces/calendar">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calendar
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Booking not found</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteBooking.mutateAsync(booking.id);
      navigate("/management/spaces/calendar");
    } catch (error) {
      console.error("Failed to delete booking:", error);
    }
  };

  const startDate = new Date(booking.start_ts);
  const endDate = new Date(booking.end_ts);
  const duration = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)); // hours

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/management/spaces/calendar">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Calendar
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {booking.title}
            </h1>
            <p className="text-muted-foreground">Booking Details</p>
          </div>
        </div>

        {canEdit() && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditForm(true)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this booking? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Booking
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Space
              </div>
              <div className="font-medium">
                {booking.space?.name || "Unknown Space"}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Date & Time
              </div>
              <div className="space-y-1">
                <div className="font-medium">
                  {format(startDate, "EEEE, MMMM d, yyyy")}
                </div>
                <div className="text-sm">
                  {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                </div>
                <Badge variant="secondary" className="w-fit">
                  {duration}h duration
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Timer className="h-4 w-4" />
                Buffer Times
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Setup:</span>{" "}
                  <span className="font-medium">{booking.setup_min} min</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Teardown:</span>{" "}
                  <span className="font-medium">{booking.teardown_min} min</span>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge variant="outline" className="w-fit capitalize">
                {booking.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lead Information (if linked) */}
        {booking.lead ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Linked Lead
              </CardTitle>
              <CardDescription>
                This booking is linked to a lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Contact Person</div>
                <div className="font-medium">
                  {booking.lead.first_name} {booking.lead.last_name}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Contact Details</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${booking.lead.email}`}
                      className="text-primary hover:underline"
                    >
                      {booking.lead.email}
                    </a>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link to={`/management/spaces/leads/${booking.lead.id}`}>
                    View Lead Details
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Lead Information
              </CardTitle>
              <CardDescription>
                No lead is linked to this booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-4">
                  This booking was created directly without being linked to a lead.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/management/spaces/leads">
                    View All Leads
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <BookingForm
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          booking={booking}
        />
      )}
    </div>
  );
};

export default BookingDetail;