import { useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useSpaces } from "@/hooks/useSpaces";
import { BookingForm } from "@/components/management/BookingForm";
import { Link } from "react-router-dom";

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>("all");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);

  // Get week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });

  // Fetch data
  const { data: spaces = [] } = useSpaces();
  const { data: bookings = [], isLoading } = useBookings({
    space_id: selectedSpaceId !== "all" ? selectedSpaceId : undefined,
    start_date: format(weekStart, "yyyy-MM-dd"),
    end_date: format(weekEnd, "yyyy-MM-dd"),
  });

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: 13 }, (_, i) => i + 8); // 8 AM to 8 PM

  // Group bookings by date and hour
  const bookingsByDateHour = bookings.reduce((acc, booking) => {
    const date = format(new Date(booking.start_ts), "yyyy-MM-dd");
    const hour = new Date(booking.start_ts).getHours();
    const key = `${date}-${hour}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, typeof bookings>);

  const handleSlotClick = (date: Date, hour: number) => {
    setSelectedSlot({ date, hour });
    setShowBookingForm(true);
  };

  const getSlotBookings = (date: Date, hour: number) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return bookingsByDateHour[`${dateStr}-${hour}`] || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Calendar</h1>
          <p className="text-muted-foreground">Manage space bookings and availability</p>
        </div>
        <Button onClick={() => setShowBookingForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Booking
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-2 min-w-[200px]">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">
                  {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Space:</span>
              <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                <SelectTrigger className="w-[200px] bg-background border border-border">
                  <SelectValue placeholder="Select space" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg">
                  <SelectItem value="all">All Spaces</SelectItem>
                  {spaces.map((space) => (
                    <SelectItem key={space.id} value={space.id}>
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendar Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Week View</CardTitle>
          <CardDescription>
            Click on any time slot to create a new booking
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header Row */}
              <div className="grid grid-cols-8 border-b border-border">
                <div className="p-3 border-r border-border">
                  <span className="text-sm font-medium text-muted-foreground">Time</span>
                </div>
                {weekDays.map((day) => (
                  <div key={day.toISOString()} className="p-3 border-r border-border last:border-r-0">
                    <div className="text-sm font-medium">{format(day, "EEE")}</div>
                    <div className="text-lg font-bold">{format(day, "d")}</div>
                  </div>
                ))}
              </div>

              {/* Time Slots */}
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-border last:border-b-0">
                  {/* Time Column */}
                  <div className="p-3 border-r border-border bg-muted/30">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {format(new Date().setHours(hour, 0), "HH:mm")}
                    </div>
                  </div>

                  {/* Day Columns */}
                  {weekDays.map((day) => {
                    const slotBookings = getSlotBookings(day, hour);
                    const isPastSlot = new Date(day.setHours(hour)) < new Date();

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className={`
                          p-2 border-r border-border last:border-r-0 min-h-[60px] cursor-pointer
                          transition-colors hover:bg-muted/50
                          ${isPastSlot ? 'bg-muted/20' : ''}
                        `}
                        onClick={() => !isPastSlot && handleSlotClick(day, hour)}
                      >
                        {slotBookings.map((booking) => (
                          <Link
                            key={booking.id}
                            to={`/management/bookings/${booking.id}`}
                            className="block"
                          >
                            <Badge
                              variant="secondary"
                              className="w-full mb-1 text-xs p-1 h-auto justify-start bg-primary/10 text-primary hover:bg-primary/20"
                            >
                              <div className="truncate">
                                <div className="font-medium">{booking.title}</div>
                                {booking.space && (
                                  <div className="text-xs opacity-75">{booking.space.name}</div>
                                )}
                              </div>
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-muted-foreground">Loading calendar...</div>
          </CardContent>
        </Card>
      )}

      {/* Booking Form Modal */}
      {showBookingForm && (
        <BookingForm
          isOpen={showBookingForm}
          onClose={() => {
            setShowBookingForm(false);
            setSelectedSlot(null);
          }}
          initialDate={selectedSlot?.date}
          initialHour={selectedSlot?.hour}
          selectedSpaceId={selectedSpaceId !== "all" ? selectedSpaceId : undefined}
        />
      )}
    </div>
  );
};

export default CalendarView;