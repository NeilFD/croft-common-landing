import React from 'react';
import { useEventManager } from '@/hooks/useEventManager';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { eventCategoryColors } from '@/types/event';
import OptimizedImage from '@/components/OptimizedImage';

const UpcomingEventsCarousel: React.FC = () => {
  const { events, loading } = useEventManager();

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
      {upcomingEvents.length <= 2 ? (
        // Simple list for 1-2 events
        <div className="space-y-3">
          {upcomingEvents.map((event) => {
            const categoryStyles = getCategoryStyles(event.category);
            
            return (
              <div key={event.id} className="flex gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer group">
                <div className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-lg">
                  {event.imageUrl ? (
                    <OptimizedImage
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${categoryStyles.bg} flex items-center justify-center`}>
                      <Calendar className={`h-4 w-4 ${categoryStyles.text}`} />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-foreground mb-1 truncate group-hover:text-primary transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3 flex-shrink-0" />
                    <span>{getDateLabel(event.date)}</span>
                    {event.time && <span>• {event.time}</span>}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{event.location}</span>
                    </div>
                  )}
                </div>
                
                <Badge className={`${categoryStyles.bg} ${categoryStyles.text} ${categoryStyles.border} border capitalize text-xs self-start`}>
                  {event.category}
                </Badge>
              </div>
            );
          })}
        </div>
      ) : (
        // Carousel for 3+ events
        <Carousel className="w-full">
          <CarouselContent className="-ml-2">
            {upcomingEvents.map((event) => {
              const categoryStyles = getCategoryStyles(event.category);
              
              return (
                <CarouselItem key={event.id} className="pl-2 basis-4/5 md:basis-1/2">
                  <Card className="border-border bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group h-full">
                    <CardContent className="p-0 h-full flex flex-col">
                      {/* Event Image */}
                      <div className="relative h-24 overflow-hidden rounded-t-lg">
                        {event.imageUrl ? (
                          <OptimizedImage
                            src={event.imageUrl}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${categoryStyles.bg} flex items-center justify-center`}>
                            <Calendar className={`h-6 w-6 ${categoryStyles.text}`} />
                          </div>
                        )}
                        
                        {/* Category Badge */}
                        <Badge className={`absolute top-1 right-1 ${categoryStyles.bg} ${categoryStyles.text} ${categoryStyles.border} border capitalize text-xs`}>
                          {event.category}
                        </Badge>
                      </div>

                      {/* Event Content */}
                      <div className="p-3 flex-1 flex flex-col">
                        <h4 className="font-semibold text-sm leading-tight text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {event.title}
                        </h4>
                        
                        <div className="space-y-1 mb-3 flex-1">
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
                        </div>

                        {/* Event Footer */}
                        {event.price && (
                          <div className="text-sm font-semibold text-primary text-center">
                            £{event.price}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex -left-3 h-7 w-7" />
          <CarouselNext className="hidden md:flex -right-3 h-7 w-7" />
        </Carousel>
      )}
    </div>
  );
};

export default UpcomingEventsCarousel;