import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Event, eventCategoryColors } from '@/types/event';
import { format } from 'date-fns';
import { Clock, MapPin, User, DollarSign, Mail } from 'lucide-react';

interface EventDotModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDotModal = ({ event, isOpen, onClose }: EventDotModalProps) => {
  const [showFullDetails, setShowFullDetails] = useState(false);

  const handleClose = () => {
    setShowFullDetails(false);
    onClose();
  };

  if (!event) return null;

  const categoryColors = eventCategoryColors[event.category];

  const MinimalView = () => (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground leading-tight pr-2">
            {event.title}
          </h3>
          {event.isSoldOut && (
            <Badge variant="destructive" className="mt-2">
              SOLD OUT
            </Badge>
          )}
        </div>
        {event.imageUrl && (
          <img 
            src={event.imageUrl} 
            alt={event.title}
            className="w-16 h-16 object-cover rounded-md flex-shrink-0"
          />
        )}
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span>{event.location}</span>
        </div>
        {event.price && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span>£{event.price}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <Button 
          onClick={() => setShowFullDetails(true)}
          className="flex-1"
          size="sm"
        >
          More Details
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClose}
          size="sm"
        >
          Close
        </Button>
      </div>
    </div>
  );

  const FullView = () => (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {event.imageUrl && (
        <img 
          src={event.imageUrl} 
          alt={event.title}
          className="w-full h-40 object-cover rounded-md"
        />
      )}
      
      <div className="flex items-center gap-2">
        <Badge 
          variant="outline" 
          className="border-2" 
          style={{
            borderColor: `hsl(var(--accent-${categoryColors.accent.replace('accent-', '')}))`
          }}
        >
          {event.category}
        </Badge>
        {event.isSoldOut && (
          <Badge variant="destructive">
            SOLD OUT
          </Badge>
        )}
      </div>

      <div>
        <h3 className="font-bold text-xl text-foreground mb-2">
          {event.title}
        </h3>
        <p className="text-foreground leading-relaxed">
          {event.description}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 text-sm">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Time:</span> {event.time}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Date:</span> {format(new Date(event.date), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Location:</span> {event.location}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <User className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Organizer:</span> {event.organizer}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <div>
            <span className="font-medium">Contact:</span>{' '}
            <a 
              href={`mailto:${event.contactEmail}`}
              className="text-primary hover:underline"
            >
              {event.contactEmail}
            </a>
          </div>
        </div>
        {event.price && (
          <div className="flex items-center gap-3">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <span className="font-medium">Price:</span> £{event.price}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-4">
        <Button 
          variant="outline"
          onClick={() => setShowFullDetails(false)}
          className="flex-1"
          size="sm"
        >
          Back
        </Button>
        <Button 
          variant="outline" 
          onClick={handleClose}
          size="sm"
        >
          Close
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Event Details</DialogTitle>
        </DialogHeader>
        {showFullDetails ? <FullView /> : <MinimalView />}
      </DialogContent>
    </Dialog>
  );
};