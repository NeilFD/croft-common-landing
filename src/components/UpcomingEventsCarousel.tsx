import React, { useState } from 'react';
import { useEventManager } from '@/hooks/useEventManager';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { eventCategoryColors, Event } from '@/types/event';
import OptimizedImage from '@/components/OptimizedImage';
import EventDetailModal from '@/components/EventDetailModal';

const UpcomingEventsCarousel: React.FC = () => {
  const { events, loading } = useEventManager();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventDetail, setShowEventDetail] = useState(false);

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setShowEventDetail(true);
  };

  const handleCloseModal = () => {
    setShowEventDetail(false);
    setSelectedEvent(null);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <Carousel className="w-full max-w-xs">
              <CarouselContent>
                {Array.from({ length: 3 }).map((_, i) => (
                  <CarouselItem key={i}>
                    <Card className="border-border bg-white">
                      <CardContent className="p-0">
                        <Skeleton className="h-32 w-full rounded-t-lg" />
                        <div className="p-4 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-2/3" />
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        </div>
      </div>
    );
  }

  // Get upcoming events (next 7 days)
  const now = new Date();
  const nextWeek = addDays(now, 7);
  
  const upcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= now && eventDate <= nextWeek;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-8 px-4 bg-white rounded-lg border border-border">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium text-foreground mb-2">No Upcoming Events</h3>
        <p className="text-sm text-muted-foreground">Check back soon for exciting events!</p>
      </div>
    );
  }

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  const getCategoryStyles = (category: string) => {
    return eventCategoryColors[category as keyof typeof eventCategoryColors] || eventCategoryColors.house;
  };

  return (
    <div className="relative w-full">
      <Carousel className="w-full">
        <CarouselContent className="-ml-2">
          {upcomingEvents.map((event) => {
            const categoryStyles = getCategoryStyles(event.category);
            
            return (
              <CarouselItem key={event.id} className="pl-2 basis-full md:basis-1/2 lg:basis-1/3">
                <Card 
                  className="border-border bg-card hover:shadow-lg transition-all duration-300 cursor-pointer group h-full"
                  onClick={() => handleEventClick(event)}
                >
                  <CardContent className="p-0 h-full flex flex-col">
                    {/* Event Image */}
                    <div className="relative h-32 overflow-hidden rounded-t-lg">
                      {event.imageUrl ? (
                        <OptimizedImage
                          src={event.imageUrl}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className={`w-full h-full bg-gradient-to-br ${categoryStyles.bg} flex items-center justify-center`}>
                          <Calendar className={`h-8 w-8 ${categoryStyles.text}`} />
                        </div>
                      )}
                      
                      {/* Category Badge */}
                      <Badge className={`absolute top-2 right-2 ${categoryStyles.bg} ${categoryStyles.text} ${categoryStyles.border} border capitalize text-xs`}>
                        {event.category}
                      </Badge>
                    </div>

                    {/* Event Content */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h4 className="font-semibold text-sm leading-tight text-card-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                        {event.title}
                      </h4>
                      
                      <div className="space-y-2 mb-4 flex-1">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 flex-shrink-0" />
                          <span className="font-medium">{getDateLabel(event.date)}</span>
                          {event.time && <span>• {event.time}</span>}
                        </div>
                        
                        {event.location && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{event.location}</span>
                          </div>
                        )}
                        
                        {event.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      {/* Event Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <div className="text-xs text-muted-foreground truncate">
                          By {event.organizer}
                        </div>
                        {event.price && (
                          <div className="text-sm font-semibold text-primary">
                            £{event.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-4 h-8 w-8" />
        <CarouselNext className="hidden md:flex -right-4 h-8 w-8" />
      </Carousel>
      
      <EventDetailModal
        event={selectedEvent}
        isOpen={showEventDetail}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default UpcomingEventsCarousel;