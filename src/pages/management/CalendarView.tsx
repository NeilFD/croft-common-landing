import React, { useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Calendar, Plus, Clock, ArrowLeft } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { useSpaces } from "@/hooks/useSpaces";
import { BookingForm } from "@/components/management/BookingForm";
import { Link } from "react-router-dom";
import { ManagementLayout } from "@/components/management/ManagementLayout";

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
  const hours = Array.from({ length: 24 }, (_, i) => (i + 6) % 24); // 6 AM to 5 AM next day

  // Process bookings for continuous display
  const processedBookings = bookings.map(booking => {
    const startDate = new Date(booking.start_ts);
    const endDate = new Date(booking.end_ts);
    
    const setupMinutes = booking.setup_min || 0;
    const teardownMinutes = booking.teardown_min || 0;
    
    const setupStart = new Date(startDate.getTime() - setupMinutes * 60000);
    const teardownEnd = new Date(endDate.getTime() + teardownMinutes * 60000);
    
    return {
      ...booking,
      actualStart: startDate,
      actualEnd: endDate,
      setupStart: setupMinutes > 0 ? setupStart : null,
      teardownEnd: teardownMinutes > 0 ? teardownEnd : null,
      totalStart: setupStart,
      totalEnd: teardownEnd
    };
  });

  // Group bookings by date for continuous display
  const bookingsByDate = processedBookings.reduce((acc, booking) => {
    const date = format(new Date(booking.start_ts), "yyyy-MM-dd");
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, any[]>);

  // Helper to get bookings for a specific date and hour
  const getSlotBookings = (date: Date, hour: number) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayBookings = bookingsByDate[dateStr] || [];
    
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 3600000); // Add 1 hour
    
    return dayBookings.filter(booking => {
      const bookingStart = new Date(booking.totalStart);
      const bookingEnd = new Date(booking.totalEnd);
      
      // Check if booking overlaps with this hour slot
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  };

  // Calculate booking display properties
  const getBookingDisplay = (booking: any, date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(6, 0, 0, 0); // Day starts at 6 AM
    const dayEnd = new Date(dayStart.getTime() + 24 * 3600000); // 24 hours later
    
    const bookingStart = new Date(booking.totalStart);
    const bookingEnd = new Date(booking.totalEnd);
    
    // Calculate position and span within the day
    const startHour = Math.max(6, bookingStart.getHours() + (bookingStart.getDate() !== date.getDate() ? -24 : 0));
    const endHour = Math.min(30, bookingEnd.getHours() + (bookingEnd.getDate() !== date.getDate() ? 24 : 0));
    
    const span = endHour - startHour;
    const gridRow = startHour - 6 + 2; // +2 for header row
    
    return {
      gridRow,
      span,
      setupHours: booking.setupStart ? Math.ceil((new Date(booking.actualStart).getTime() - new Date(booking.setupStart).getTime()) / 3600000) : 0,
      mainHours: Math.ceil((new Date(booking.actualEnd).getTime() - new Date(booking.actualStart).getTime()) / 3600000),
      teardownHours: booking.teardownEnd ? Math.ceil((new Date(booking.teardownEnd).getTime() - new Date(booking.actualEnd).getTime()) / 3600000) : 0
    };
  };

  const handleSlotClick = (date: Date, hour: number) => {
    // Adjust hour for 6am start
    const actualHour = (hour + 6) % 24;
    const slotDate = new Date(date);
    if (hour >= 18) { // If after 6pm (index 18), it's next day 
      slotDate.setDate(slotDate.getDate() + 1);
      slotDate.setHours(actualHour - 24);
    } else {
      slotDate.setHours(actualHour);
    }
    
    setSelectedSlot({ date: slotDate, hour: actualHour });
    setShowBookingForm(true);
  };

  const getSlotBookingsOld = (date: Date, hour: number) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayBookings = bookingsByDate[dateStr] || [];
    
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart.getTime() + 3600000);
    
    return dayBookings.filter(booking => {
      const bookingStart = new Date(booking.totalStart);
      const bookingEnd = new Date(booking.totalEnd);
      return bookingStart < slotEnd && bookingEnd > slotStart;
    });
  };

  return (
    <ManagementLayout>
      <div className="space-y-6">
        {/* Header with Back Navigation */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link to="/management/spaces" className="mt-1">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0 border-2 border-foreground hover:bg-foreground hover:text-background">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-brutalist font-bold tracking-tight text-foreground mb-2">
                CALENDAR
              </h1>
              <p className="text-muted-foreground font-industrial">Manage space bookings and availability</p>
            </div>
          </div>
          <Button 
            onClick={() => setShowBookingForm(true)} 
            className="gap-2 font-industrial font-bold border-2 border-foreground bg-accent text-accent-foreground hover:bg-accent/80"
          >
            <Plus className="h-4 w-4" />
            NEW BOOKING
          </Button>
        </div>

        {/* Controls */}
        <Card className="border-2 border-foreground shadow-brutal">
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('prev')}
                  className="border-2 border-foreground hover:bg-foreground hover:text-background font-industrial"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2 min-w-[200px]">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="font-industrial font-bold text-foreground">
                    {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateWeek('next')}
                  className="border-2 border-foreground hover:bg-foreground hover:text-background font-industrial"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentDate(new Date())}
                className="border-2 border-foreground hover:bg-accent hover:text-accent-foreground font-industrial font-bold"
              >
                TODAY
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-industrial font-bold text-foreground">SPACE:</span>
                <Select value={selectedSpaceId} onValueChange={setSelectedSpaceId}>
                  <SelectTrigger className="w-[200px] bg-background border-2 border-foreground font-industrial">
                    <SelectValue placeholder="Select space" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-2 border-foreground shadow-brutal z-50">
                    <SelectItem value="all" className="font-industrial">All Spaces</SelectItem>
                    {spaces.map((space) => (
                      <SelectItem key={space.id} value={space.id} className="font-industrial">
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
        <Card className="border-2 border-foreground shadow-brutal">
          <CardHeader>
            <CardTitle className="font-brutalist text-xl">WEEK VIEW</CardTitle>
            <CardDescription className="font-industrial">
              Click on any time slot to create a new booking
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Header Row */}
                <div className="grid grid-cols-8 border-b-2 border-foreground bg-muted/50">
                  <div className="p-3 border-r-2 border-foreground">
                    <span className="text-sm font-industrial font-bold text-foreground">TIME</span>
                  </div>
                  {weekDays.map((day) => (
                    <div key={day.toISOString()} className="p-3 border-r-2 border-foreground last:border-r-0">
                      <div className="text-sm font-industrial font-bold text-foreground">{format(day, "EEE").toUpperCase()}</div>
                      <div className="text-lg font-brutalist font-bold text-primary">{format(day, "d")}</div>
                    </div>
                  ))}
                </div>

                {/* Time Slots Grid */}
                <div className="relative">
                  {/* Background Grid */}
                  {hours.map((hour, hourIndex) => (
                    <div key={hour} className="grid grid-cols-8 border-b border-border">
                      {/* Time Column */}
                      <div className="p-3 border-r-2 border-foreground bg-muted/30">
                        <div className="flex items-center gap-1 text-sm font-industrial font-bold text-foreground">
                          <Clock className="h-3 w-3" />
                          {hour < 10 ? `0${hour}:00` : `${hour}:00`}
                        </div>
                      </div>

                      {/* Day Columns */}
                      {weekDays.map((day, dayIndex) => {
                        const actualHour = hour >= 18 ? hour - 18 : hour + 6; // Convert display hour to actual hour (6am start)
                        const slotDate = new Date(day);
                        if (hour >= 18) { // Hours 18-23 are next day (0-5am)
                          slotDate.setDate(slotDate.getDate() + 1);
                        }
                        
                        const isPastSlot = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate(), actualHour) < new Date();

                        return (
                          <div
                            key={`${day.toISOString()}-${hour}`}
                            className={`
                              p-2 border-r border-border last:border-r-0 min-h-[60px] cursor-pointer
                              transition-colors hover:bg-accent/20 font-industrial
                              ${isPastSlot ? 'bg-muted/20 cursor-not-allowed' : 'hover:shadow-sm'}
                            `}
                            onClick={() => !isPastSlot && handleSlotClick(day, hour)}
                          />
                        );
                      })}
                    </div>
                  ))}

                  {/* Continuous Booking Overlays */}
                  {weekDays.map((day, dayIndex) => {
                    const dateStr = format(day, "yyyy-MM-dd");
                    const dayBookings = bookingsByDate[dateStr] || [];
                    
                    return dayBookings.map((booking) => {
                      const totalStartHour = new Date(booking.totalStart).getHours();
                      const totalEndHour = new Date(booking.totalEnd).getHours();
                      const actualStartHour = new Date(booking.actualStart).getHours();
                      const actualEndHour = new Date(booking.actualEnd).getHours();
                      
                      // Convert to display hours (6am = 0, 5am next day = 23)
                      const startDisplay = totalStartHour >= 6 ? totalStartHour - 6 : totalStartHour + 18;
                      const endDisplay = totalEndHour >= 6 ? totalEndHour - 6 : totalEndHour + 18;
                      const actualStartDisplay = actualStartHour >= 6 ? actualStartHour - 6 : actualStartHour + 18;
                      const actualEndDisplay = actualEndHour >= 6 ? actualEndHour - 6 : actualEndHour + 18;
                      
                      if (endDisplay <= startDisplay) return null; // Skip invalid ranges
                      
                      const topPercent = (startDisplay / 24) * 100;
                      const heightPercent = ((endDisplay - startDisplay) / 24) * 100;
                      
                      return (
                        <div
                          key={`${booking.id}-${dayIndex}`}
                          className="absolute z-10"
                          style={{
                            left: `${12.5 + (dayIndex * 12.5)}%`, // Position in day column
                            top: `${topPercent}%`,
                            width: '12.5%',
                            height: `${heightPercent}%`,
                          }}
                        >
                          <Link
                            to={`/management/bookings/${booking.id}`}
                            className="block h-full"
                          >
                            <div className="h-full border-2 border-foreground bg-background shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                              {/* Setup Section */}
                              {booking.setup_min > 0 && (
                                <div 
                                  className="bg-orange-200 border-b border-orange-400 text-orange-800 px-2 py-1 text-xs font-industrial font-bold"
                                  style={{ 
                                    height: `${((actualStartDisplay - startDisplay) / (endDisplay - startDisplay)) * 100}%` 
                                  }}
                                >
                                  <div className="truncate">SETUP</div>
                                </div>
                              )}
                              
                              {/* Main Event */}
                              <div 
                                className="bg-accent text-background px-2 py-1 font-industrial flex-1 overflow-hidden border-y border-foreground"
                                style={{ 
                                  height: `${((actualEndDisplay - actualStartDisplay) / (endDisplay - startDisplay)) * 100}%` 
                                }}
                              >
                                <div className="font-black text-xs uppercase truncate">
                                  {booking.title}
                                </div>
                                {booking.space && (
                                  <div className="text-xs opacity-75 truncate">{booking.space.name}</div>
                                )}
                              </div>
                              
                              {/* Teardown Section */}
                              {booking.teardown_min > 0 && (
                                <div 
                                  className="bg-blue-200 border-t border-blue-400 text-blue-800 px-2 py-1 text-xs font-industrial font-bold"
                                  style={{ 
                                    height: `${((endDisplay - actualEndDisplay) / (endDisplay - startDisplay)) * 100}%` 
                                  }}
                                >
                                  <div className="truncate">TEARDOWN</div>
                                </div>
                              )}
                            </div>
                          </Link>
                        </div>
                      );
                    });
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card className="border-2 border-foreground shadow-brutal">
            <CardContent className="flex items-center justify-center p-8">
              <div className="font-industrial font-bold text-foreground">LOADING CALENDAR...</div>
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
    </ManagementLayout>
  );
};

export default CalendarView;