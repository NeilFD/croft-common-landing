import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, User, Mail, DollarSign } from 'lucide-react';
import { Event, eventCategoryColors } from '@/types/event';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface EventDetailModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, isOpen, onClose }) => {
  if (!event) return null;

  const categoryColors = eventCategoryColors[event.category];
  const eventDate = parseISO(event.date);

  const handleContact = () => {
    window.location.href = `mailto:${event.contactEmail}?subject=Booking enquiry: ${event.title}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <DialogTitle className="font-brutalist text-2xl pr-4">
                {event.title}
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    categoryColors.text,
                    categoryColors.border
                  )}
                >
                  {event.category}
                </Badge>
                {event.isSoldOut && (
                  <Badge variant="destructive">SOLD OUT</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Event Image */}
          {event.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={event.imageUrl} 
                alt={event.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* Event Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{format(eventDate, 'EEEE, MMMM d, yyyy')}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="font-medium">{event.time}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Organized by</div>
                <div className="font-medium">{event.organizer}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{event.location}</div>
              </div>
            </div>
            
            {event.price && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Price</div>
                  <div className="font-medium">£{event.price.toFixed(2)}</div>
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <div className="text-sm text-muted-foreground">Contact</div>
                <div className="font-medium text-sm">{event.contactEmail}</div>
              </div>
            </div>
          </div>

          {/* Description */}
          {event.description && (
            <div className="space-y-2">
              <h3 className="font-medium text-lg">About this event</h3>
              <p className="text-muted-foreground leading-relaxed">
                {event.description}
              </p>
            </div>
          )}

          {/* Category Banner */}
          <div className={cn(
            "p-4 rounded-lg border-l-4",
            categoryColors.bg,
            categoryColors.border
          )}>
            <div className={cn("font-medium", categoryColors.text)}>
              {event.category.charAt(0).toUpperCase() + event.category.slice(1)} Event
            </div>
            <div className="text-sm opacity-75 mt-1">
              {event.category === 'gigs' && 'Live music and performances'}
              {event.category === 'tastings' && 'Curated tastings and workshops'}
              {event.category === 'talks' && 'Conversations and presentations'}
              {event.category === 'takeovers' && 'Special collaborations'}
              {event.category === 'food' && 'Culinary experiences'}
              {event.category === 'special' && 'Unique experiences'}
            </div>
          </div>

          {/* Booking CTA */}
          {event.isSoldOut ? (
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-lg mb-2 text-muted-foreground">This event is sold out</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Contact the organizer for any questions or to join a waiting list
                </p>
                <Button 
                  variant="outline" 
                  onClick={handleContact} 
                  className="w-full md:w-auto"
                >
                  Contact Organizer
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 p-6 rounded-lg space-y-4">
              <div className="text-center">
                <h3 className="font-medium text-lg mb-2">Ready to join us?</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Get in touch to book your spot or ask any questions
                </p>
                <Button onClick={handleContact} className="w-full md:w-auto">
                  Book or Enquire
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventDetailModal;