import { useState, useRef, useCallback } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import GestureOverlay from '@/components/GestureOverlay';
import CreateEventModal from '@/components/CreateEventModal';
import EventDetailModal from '@/components/EventDetailModal';
import { EventDotModal } from '@/components/EventDotModal';
import { EventColorLegend } from '@/components/EventColorLegend';
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
  const [showDotModal, setShowDotModal] = useState(false);
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
            className={`min-h-[80px] md:min-h-[120px] border border-border p-1 md:p-2 ${
              !isSameMonth(day, monthStart) ? 'text-muted-foreground bg-muted/20' : 'bg-background'
            }`}
          >
            <span className={`text-xs md:text-sm font-medium ${
              isSameDay(day, new Date()) ? 'text-primary font-bold' : ''
            }`}>
              {format(cloneDay, dateFormat)}
            </span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {dayEvents.slice(0, 4).map((event, index) => {
                const categoryColors = eventCategoryColors[event.category];
                return (
                  <button
                    key={event.id}
                    className={`aspect-square rounded cursor-pointer hover:scale-105 transition-transform shadow-sm border border-border/20 ${
                      event.isSoldOut ? 'opacity-60' : ''
                    }`}
                    style={{
                      backgroundColor: `hsl(var(--accent-${categoryColors.accent.replace('accent-', '')}))`
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDotModal(true);
                    }}
                    title={event.title}
                  />
                );
              })}
              {/* Fill remaining slots with empty divs to maintain grid */}
              {Array.from({ length: Math.max(0, 4 - dayEvents.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="aspect-square rounded border border-dashed border-border/20" />
              ))}
            </div>
            {dayEvents.length > 4 && (
              <div className="text-[10px] text-muted-foreground font-medium mt-1 text-center">
                +{dayEvents.length - 4}
              </div>
            )}
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
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => {
            const fullDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return (
              <div key={`${day}-${index}`} className="p-2 md:p-3 text-center font-medium text-muted-foreground border border-border">
                <span className="md:hidden">{day}</span>
                <span className="hidden md:inline">{fullDays[index]}</span>
              </div>
            );
          })}
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
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(weekStart, i);
      const dayEvents = events.filter(event => 
        isSameDay(parseISO(event.date), day)
      );

      weekDays.push(
        <div key={day.toString()} className="flex-1 border-r border-border last:border-r-0 min-w-[120px]">
          <div className="p-2 md:p-3 border-b border-border bg-muted/30">
            <div className="text-center">
              <div className="text-xs md:text-sm text-muted-foreground font-medium">
                {dayNames[i]}
              </div>
              <div className={`text-sm md:text-lg font-bold ${
                isSameDay(day, new Date()) ? 'text-primary' : 'text-foreground'
              }`}>
                {format(day, 'd')}
              </div>
            </div>
          </div>
          <div className="h-[200px] md:h-[250px] p-2">
            <div className="grid grid-cols-2 gap-1 h-full">
              {dayEvents.slice(0, 4).map((event, index) => {
                const categoryColors = eventCategoryColors[event.category];
                return (
                  <button
                    key={event.id}
                    className={`rounded cursor-pointer hover:scale-105 transition-transform shadow-sm border border-border/20 ${
                      event.isSoldOut ? 'opacity-60' : ''
                    }`}
                    style={{
                      backgroundColor: `hsl(var(--accent-${categoryColors.accent.replace('accent-', '')}))`
                    }}
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowDotModal(true);
                    }}
                    title={event.title}
                  />
                );
              })}
              {/* Fill remaining slots with empty divs to maintain grid */}
              {Array.from({ length: Math.max(0, 4 - dayEvents.length) }).map((_, index) => (
                <div key={`empty-${index}`} className="rounded border border-dashed border-border/20" />
              ))}
            </div>
            {dayEvents.length > 4 && (
              <div className="text-xs text-muted-foreground font-medium mt-2 text-center">
                +{dayEvents.length - 4} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-background border border-border rounded-lg overflow-hidden relative">
        {/* Scroll arrows for mobile */}
        <div className="md:hidden absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const container = document.getElementById('week-container');
              if (container) container.scrollBy({ left: -100, behavior: 'smooth' });
            }}
            className="bg-background/80 backdrop-blur-sm h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <div className="md:hidden absolute right-2 top-1/2 transform -translate-y-1/2 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const container = document.getElementById('week-container');
              if (container) container.scrollBy({ left: 100, behavior: 'smooth' });
            }}
            className="bg-background/80 backdrop-blur-sm h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div id="week-container" className="flex overflow-x-auto md:overflow-x-visible scrollbar-hide">
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
      
      <div className="container mx-auto px-4 md:px-6 pt-24 pb-8 md:py-12 lg:py-24">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <h1 className="font-brutalist text-2xl md:text-4xl lg:text-6xl mb-4 md:mb-6 text-foreground leading-tight">
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
            <CardContent className="p-4 md:p-8 space-y-2 text-foreground/70 text-left">
              <p className="font-industrial text-sm md:text-lg leading-relaxed">
                The good stuff lands here first.
              </p>
              <p className="font-industrial text-sm md:text-lg leading-relaxed">
                Gigs. Tastings. Talks. Takeovers. Secret menus.
              </p>
              <p className="font-industrial text-sm md:text-lg leading-relaxed">
                Some you'll see on the posters. Some you'll only find here.
              </p>
              <p className="font-industrial text-sm md:text-lg leading-relaxed">
                Quiet heads-up. Limited numbers. No fanfare. Just first access,
              </p>
              <p className="font-industrial text-sm md:text-lg leading-relaxed">
                if you're paying attention.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Calendar Controls */}
        <div className="flex flex-col gap-4 mb-6 md:mb-8">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
              className="flex-shrink-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <h2 className="font-industrial text-lg md:text-xl font-medium text-center px-4">
              {viewType === 'month' 
                ? format(currentDate, 'MMMM yyyy')
                : `Week of ${format(startOfWeek(currentDate), 'MMM d, yyyy')}`
              }
            </h2>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
              className="flex-shrink-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <Button
              variant={viewType === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('month')}
              className="text-xs md:text-sm"
            >
              <Grid3X3 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Month
            </Button>
            <Button
              variant={viewType === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewType('week')}
              className="text-xs md:text-sm"
            >
              <CalendarIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              Week
            </Button>
          </div>
        </div>

        {/* Color Legend */}
        <EventColorLegend className="md:hidden" />

        {/* Calendar */}
        <div className="mb-8 md:mb-16">
          {viewType === 'month' ? (
            <>
              <EventColorLegend className="hidden md:block" />
              {renderMonthView()}
            </>
          ) : (
            renderWeekView()
          )}
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
      
      <EventDotModal
        event={selectedEvent}
        isOpen={showDotModal}
        onClose={() => {
          setShowDotModal(false);
          setSelectedEvent(null);
        }}
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