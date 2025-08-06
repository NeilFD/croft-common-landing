import { useState, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import GestureOverlay from '@/components/GestureOverlay';
import CreateEventModal from '@/components/CreateEventModal';
import EventDetailModal from '@/components/EventDetailModal';
import { AuthModal } from '@/components/AuthModal';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import useCardGestureDetection from '@/hooks/useCardGestureDetection';
import { toast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid3X3 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, addWeeks, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { useEventManager } from '@/hooks/useEventManager';
import { Event, eventCategoryColors } from '@/types/event';
import { cn } from '@/lib/utils';


const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<'month' | 'week'>('month');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { events, loading, addEvent } = useEventManager();
  const { user, loading: authLoading } = useAuth();
  const gestureCardRef = useRef<HTMLDivElement>(null);
  
  const handleGestureSuccess = useCallback(() => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      toast({
        title: "Access Granted",
        description: "Welcome to The Common Room, for Common People",
        duration: 2000,
      });
      setShowCreateModal(true);
    }
  }, [user]);

  const handleAuthSuccess = async () => {
    console.log('handleAuthSuccess called');
    
    // Force refresh the auth state to ensure we have the latest user data
    const { refreshSession } = useAuth();
    const session = await refreshSession();
    
    console.log('Session after refresh in handleAuthSuccess:', session?.user?.email);
    
    if (session?.user) {
      console.log('User confirmed, proceeding with success flow');
      setShowAuthModal(false);
      toast({
        title: "Access Granted",
        description: "Welcome to The Common Room, for Common People",
        duration: 2000,
      });
      setShowCreateModal(true);
    } else {
      console.log('No user found after auth success, keeping auth modal open');
      toast({
        title: "Authentication incomplete",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };
  
  const {
    isDrawing,
    startGesture,
    addPoint,
    endGesture
  } = useCardGestureDetection(handleGestureSuccess);
  

  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewType === 'month') {
      setCurrentDate(prev => direction === 'next' ? addMonths(prev, 1) : addMonths(prev, -1));
    } else {
      setCurrentDate(prev => direction === 'next' ? addWeeks(prev, 1) : addWeeks(prev, -1));
    }
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = events.filter(event => 
          isSameDay(parseISO(event.date), cloneDay)
        );

        days.push(
          <div
            key={day.toString()}
            className={`min-h-[120px] border border-border p-2 ${
              !isSameMonth(day, monthStart) ? 'text-muted-foreground bg-muted/20' : 'bg-background'
            }`}
          >
            <span className={`text-sm font-medium ${
              isSameDay(day, new Date()) ? 'text-primary font-bold' : ''
            }`}>
              {format(cloneDay, dateFormat)}
            </span>
            <div className="mt-1 space-y-1">
              {dayEvents.map(event => {
                const categoryColors = eventCategoryColors[event.category];
                return (
                  <TooltipProvider key={event.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={cn(
                            "text-xs p-2 rounded-lg border-2 border-black bg-background cursor-pointer hover:opacity-80 transition-opacity shadow-sm",
                            `border-l-4`
                          )}
                          style={{
                            borderLeftColor: `hsl(var(--accent-${eventCategoryColors[event.category].accent.replace('accent-', '')}))`
                          }}
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDetail(true);
                          }}
                        >
                    {event.imageUrl && (
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-8 object-cover rounded mb-1"
                      />
                    )}
                          <div className="font-medium truncate text-foreground">{event.title}</div>
                          <div className="opacity-75 text-xs text-muted-foreground">{event.time}</div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-sm p-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={`border-2`} style={{
                              borderColor: `hsl(var(--accent-${eventCategoryColors[event.category].accent.replace('accent-', '')}))`
                            }}>
                              {event.category}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-foreground">{event.title}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Time:</strong> {event.time}</p>
                            <p><strong>Date:</strong> {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</p>
                            <p><strong>Location:</strong> {event.location}</p>
                            <p><strong>Organizer:</strong> {event.organizer}</p>
                            {event.price && <p><strong>Price:</strong> £{event.price}</p>}
                          </div>
                          <p className="text-sm text-foreground">{event.description}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }

    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        {/* Days header */}
        <div className="grid grid-cols-7 bg-muted/30">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-muted-foreground border-r border-border last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div>
          {rows}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate);
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayEvents = events.filter(event => 
        isSameDay(parseISO(event.date), day)
      );

      weekDays.push(
        <div key={day.toString()} className="flex-1 border-r border-border last:border-r-0">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">{format(day, 'EEE')}</div>
              <div className={`text-lg font-medium ${
                isSameDay(day, new Date()) ? 'text-primary font-bold' : ''
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          </div>
          <div className="min-h-[400px] p-2 space-y-2">
            {dayEvents.map(event => {
              const categoryColors = eventCategoryColors[event.category];
              return (
                <TooltipProvider key={event.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          "p-3 rounded-lg border-2 border-black bg-background cursor-pointer hover:opacity-80 transition-opacity shadow-sm",
                          `border-l-4`
                        )}
                        style={{
                          borderLeftColor: `hsl(var(--accent-${eventCategoryColors[event.category].accent.replace('accent-', '')}))`
                        }}
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDetail(true);
                        }}
                      >
                  {event.imageUrl && (
                    <img 
                      src={event.imageUrl} 
                      alt={event.title}
                      className="w-full h-16 object-cover rounded mb-2"
                    />
                  )}
                        <div className="font-medium text-sm text-muted-foreground">{event.time}</div>
                        <div className="font-bold text-foreground">{event.title}</div>
                        <div className="text-xs opacity-75 mt-1 text-muted-foreground">{event.description}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm p-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`border-2`} style={{
                            borderColor: `hsl(var(--accent-${eventCategoryColors[event.category].accent.replace('accent-', '')}))`
                          }}>
                            {event.category}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-foreground">{event.title}</h4>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Time:</strong> {event.time}</p>
                          <p><strong>Date:</strong> {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</p>
                          <p><strong>Location:</strong> {event.location}</p>
                          <p><strong>Organizer:</strong> {event.organizer}</p>
                          {event.price && <p><strong>Price:</strong> £{event.price}</p>}
                        </div>
                        <p className="text-sm text-foreground">{event.description}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="flex">
          {weekDays}
        </div>
      </div>
    );
  };

  const handleEventSave = (eventData: Omit<Event, 'id'>) => {
    addEvent(eventData);
  };

  const getEventPosition = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    const rect = gestureCardRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    if ('touches' in event && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top
      };
    } else if ('clientX' in event) {
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    }
    return { x: 0, y: 0 };
  }, []);

  // Touch events for gesture card
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    event.stopPropagation();
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
    endGesture();
  }, [endGesture]);

  // Mouse events for gesture card
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    const { x, y } = getEventPosition(event);
    startGesture(x, y);
  }, [getEventPosition, startGesture]);

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDrawing) return;
    event.preventDefault();
    const { x, y } = getEventPosition(event);
    addPoint(x, y);
  }, [getEventPosition, addPoint, isDrawing]);

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    endGesture();
  }, [endGesture]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-brutalist text-4xl md:text-6xl mb-6 text-foreground">
            What's Next?
          </h1>
          <Card 
            ref={gestureCardRef}
            className="max-w-3xl mx-auto bg-background hover:border-primary/20 transition-colors cursor-crosshair select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ 
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            <CardContent className="p-8 space-y-2 text-foreground/70 text-left">
              <p className="font-industrial text-lg leading-relaxed">
                The good stuff lands here first.
              </p>
              <p className="font-industrial text-lg leading-relaxed">
                Gigs. Tastings. Talks. Takeovers. Secret menus.
              </p>
              <p className="font-industrial text-lg leading-relaxed">
                Some you'll see on the posters. Some you'll only find here.
              </p>
              <p className="font-industrial text-lg leading-relaxed">
                Quiet heads-up. Limited numbers. No fanfare. Just first access,
              </p>
              <p className="font-industrial text-lg leading-relaxed">
                if you're paying attention.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="font-industrial text-xl font-medium min-w-[200px] text-center">
              {viewType === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
              }
            </h2>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('month')}
            >
              <Grid3X3 className="h-4 w-4 mr-2" />
              Month
            </Button>
            <Button
              variant={viewType === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('week')}
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Week
            </Button>
          </div>
        </div>

        {/* Calendar */}
        <div className="mb-16">
          {viewType === 'month' ? renderMonthView() : renderWeekView()}
        </div>
      </div>

      <Footer />
      
      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={handleEventSave}
      />
      
      <EventDetailModal
        event={selectedEvent}
        isOpen={showEventDetail}
        onClose={() => {
          setShowEventDetail(false);
          setSelectedEvent(null);
        }}
      />
    </div>
  );
};

export default Calendar;