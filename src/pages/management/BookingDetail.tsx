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
import { ManagementLayout } from "@/components/management/ManagementLayout";
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
      <ManagementLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/management/spaces/calendar">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-2 border-foreground hover:bg-foreground hover:text-background">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card className="border-2 border-foreground shadow-brutal">
            <CardContent className="flex items-center justify-center p-8">
              <div className="font-industrial font-bold text-foreground">LOADING BOOKING...</div>
            </CardContent>
          </Card>
        </div>
      </ManagementLayout>
    );
  }

  if (!booking) {
    return (
      <ManagementLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Link to="/management/spaces/calendar">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-2 border-foreground hover:bg-foreground hover:text-background">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <Card className="border-2 border-foreground shadow-brutal">
            <CardContent className="flex items-center justify-center p-8">
              <div className="font-industrial font-bold text-foreground">BOOKING NOT FOUND</div>
            </CardContent>
          </Card>
        </div>
      </ManagementLayout>
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
    <ManagementLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/management/spaces/calendar">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-2 border-foreground hover:bg-foreground hover:text-background">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-brutalist text-3xl font-bold tracking-tight text-foreground uppercase">
                {booking.title}
              </h1>
              <p className="font-industrial text-muted-foreground">Booking Details</p>
            </div>
          </div>

        {canEdit() && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowEditForm(true)}
              className="border-2 border-foreground hover:bg-foreground hover:text-background font-industrial font-bold"
            >
              <Edit className="mr-2 h-4 w-4" />
              EDIT
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="border-2 border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 font-industrial font-bold">
                  <Trash2 className="mr-2 h-4 w-4" />
                  DELETE
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-background border-2 border-foreground shadow-brutal">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-brutalist text-xl font-bold uppercase">Delete Booking</AlertDialogTitle>
                  <AlertDialogDescription className="font-industrial">
                    Are you sure you want to delete this booking? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-2 border-foreground font-industrial font-bold">CANCEL</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-destructive font-industrial font-bold"
                  >
                    DELETE BOOKING
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Booking Details */}
        <Card className="border-2 border-foreground shadow-brutal">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-brutalist text-xl font-bold uppercase">
              <Calendar className="h-5 w-5" />
              Booking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-industrial font-bold text-muted-foreground uppercase">
                <MapPin className="h-4 w-4" />
                Space
              </div>
              <div className="font-brutalist font-bold text-lg">
                {booking.space?.name || "Unknown Space"}
              </div>
            </div>

            <Separator className="border-foreground" />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-industrial font-bold text-muted-foreground uppercase">
                <Calendar className="h-4 w-4" />
                Date & Time
              </div>
              <div className="space-y-1">
                <div className="font-brutalist font-bold text-lg">
                  {format(startDate, "EEEE, MMMM d, yyyy")}
                </div>
                <div className="font-industrial">
                  {format(startDate, "h:mm a")} - {format(endDate, "h:mm a")}
                </div>
                <Badge variant="outline" className="w-fit border-2 border-foreground font-industrial font-bold">
                  {duration}h DURATION
                </Badge>
              </div>
            </div>

            <Separator className="border-foreground" />

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-industrial font-bold text-muted-foreground uppercase">
                <Timer className="h-4 w-4" />
                Complete Schedule
              </div>
              <div className="space-y-2">
                {booking.setup_min > 0 && (
                  <div className="flex items-center justify-between p-2 bg-orange-100 border border-orange-300 rounded">
                    <span className="font-industrial font-bold text-orange-800">SETUP STARTS:</span>
                    <span className="font-brutalist text-orange-900">
                      {format(new Date(startDate.getTime() - booking.setup_min * 60000), "h:mm a")}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between p-2 bg-accent/10 border border-accent rounded">
                  <span className="font-industrial font-bold">EVENT STARTS:</span>
                  <span className="font-brutalist">{format(startDate, "h:mm a")}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-accent/10 border border-accent rounded">
                  <span className="font-industrial font-bold">EVENT ENDS:</span>
                  <span className="font-brutalist">{format(endDate, "h:mm a")}</span>
                </div>
                {booking.teardown_min > 0 && (
                  <div className="flex items-center justify-between p-2 bg-blue-100 border border-blue-300 rounded">
                    <span className="font-industrial font-bold text-blue-800">TEARDOWN ENDS:</span>
                    <span className="font-brutalist text-blue-900">
                      {format(new Date(endDate.getTime() + booking.teardown_min * 60000), "h:mm a")}
                    </span>
                  </div>
                )}
                <div className="text-xs font-industrial text-muted-foreground uppercase text-center pt-2">
                  Total venue occupation: {booking.setup_min + duration * 60 + booking.teardown_min} minutes
                </div>
              </div>
            </div>

            <Separator className="border-foreground" />

            <div className="space-y-2">
              <div className="text-sm font-industrial font-bold text-muted-foreground uppercase">Status</div>
              <Badge variant="outline" className="w-fit capitalize border-2 border-foreground font-industrial font-bold">
                {booking.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Lead Information (if linked) */}
        {booking.lead ? (
          <Card className="border-2 border-foreground shadow-brutal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-brutalist text-xl font-bold uppercase">
                <User className="h-5 w-5" />
                Linked Lead
              </CardTitle>
              <CardDescription className="font-industrial">
                This booking is linked to a lead
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-industrial font-bold text-muted-foreground uppercase">Contact Person</div>
                <div className="font-brutalist font-bold text-lg">
                  {booking.lead.first_name} {booking.lead.last_name}
                </div>
              </div>

              <Separator className="border-foreground" />

              <div className="space-y-2">
                <div className="text-sm font-industrial font-bold text-muted-foreground uppercase">Contact Details</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={`mailto:${booking.lead.email}`}
                      className="text-primary hover:underline font-industrial"
                    >
                      {booking.lead.email}
                    </a>
                  </div>
                </div>
              </div>

              <Separator className="border-foreground" />

              <div>
                <Button variant="outline" size="sm" asChild className="w-full border-2 border-foreground font-industrial font-bold">
                  <Link to={`/management/spaces/leads/${booking.lead.id}`}>
                    VIEW LEAD DETAILS
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-foreground shadow-brutal">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-brutalist text-xl font-bold uppercase">
                <User className="h-5 w-5" />
                Lead Information
              </CardTitle>
              <CardDescription className="font-industrial">
                No lead is linked to this booking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground font-industrial mb-4">
                  This booking was created directly without being linked to a lead.
                </p>
                <Button variant="outline" size="sm" asChild className="border-2 border-foreground font-industrial font-bold">
                  <Link to="/management/spaces/leads">
                    VIEW ALL LEADS
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
    </ManagementLayout>
  );
};

export default BookingDetail;