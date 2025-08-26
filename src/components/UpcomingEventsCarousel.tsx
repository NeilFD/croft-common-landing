import React from 'react';
import { useEventManager } from '@/hooks/useEventManager';
import { format, isToday, isTomorrow, addDays } from 'date-fns';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const UpcomingEventsCarousel: React.FC = () => {
  const { events, loading } = useEventManager();

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="border-pink-500/10">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-3 w-1/2 mb-1" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
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
    .slice(0, 3);

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No upcoming events</p>
        <p className="text-xs">Check back soon!</p>
      </div>
    );
  }

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <div className="space-y-3">
      {upcomingEvents.map((event) => (
        <Card 
          key={event.id} 
          className="border-pink-500/10 hover:border-pink-500/30 transition-colors cursor-pointer hover:shadow-sm"
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/10 to-primary/10 flex items-center justify-center">
                <Calendar className="h-4 w-4 text-pink-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm leading-tight truncate text-foreground">
                  {event.title}
                </h4>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{getDateLabel(event.date)}</span>
                  {event.time && <span>• {event.time}</span>}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default UpcomingEventsCarousel;