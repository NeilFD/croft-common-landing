import { useState, useCallback, useEffect } from 'react';
import { Event } from '@/types/event';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Sample events data for demo purposes (will be replaced by Supabase data)
const initialEvents: Event[] = [
  {
    id: '1',
    title: "Wine Tasting: Natural Wines",
    date: "2025-01-15",
    time: "19:00",
    description: "Limited to 12 people. Explore natural wines from small producers across Europe.",
    category: "tastings",
    organizer: "Sophie Chen",
    location: "Main Hall",
    price: 45.00,
    contactEmail: "whatsnext@croftcommon.com"
  },
  {
    id: '2',
    title: "Live Jazz: The Quartet",
    date: "2025-01-18",
    time: "20:30",
    description: "Intimate jazz session featuring local musicians",
    category: "gigs",
    organizer: "Music Collective",
    location: "Courtyard",
    price: 25.00,
    contactEmail: "whatsnext@croftcommon.com"
  },
  {
    id: '3',
    title: "Chef's Table",
    date: "2025-01-22",
    time: "18:00",
    description: "Secret menu preview with our head chef",
    category: "food",
    organizer: "Head Chef Marcus",
    location: "Kitchen",
    price: 85.00,
    contactEmail: "whatsnext@croftcommon.com"
  },
  {
    id: '4',
    title: "Coffee Cupping",
    date: "2025-01-25",
    time: "10:00",
    description: "Single origin exploration and brewing techniques",
    category: "tastings",
    organizer: "Coffee Team",
    location: "Cafe Area",
    price: 15.00,
    contactEmail: "whatsnext@croftcommon.com"
  }
];

// Transform database event to frontend Event type
const transformDbEvent = (dbEvent: any): Event => ({
  id: dbEvent.id,
  title: dbEvent.title,
  description: dbEvent.description,
  date: dbEvent.date,
  time: dbEvent.time,
  organizer: dbEvent.organizer,
  location: dbEvent.location,
  price: dbEvent.price,
  category: dbEvent.category,
  imageUrl: dbEvent.image_url,
  contactEmail: dbEvent.contact_email,
  isSoldOut: dbEvent.is_sold_out,
  managementToken: dbEvent.management_token,
  managementEmail: dbEvent.management_email
});

// Transform frontend Event to database format
const transformEventForDb = (event: Omit<Event, 'id'> & { managementToken?: string; managementEmail?: string }) => ({
  title: event.title,
  description: event.description,
  date: event.date,
  time: event.time,
  organizer: event.organizer,
  location: event.location,
  price: event.price,
  category: event.category,
  image_url: event.imageUrl || null,
  contact_email: event.contactEmail,
  is_sold_out: event.isSoldOut || false,
  management_token: event.managementToken || crypto.randomUUID(),
  management_email: event.managementEmail || event.contactEmail
});

export const useEventManager = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Load events from Supabase on mount
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });

      if (error) {
        console.error('Error loading events:', error);
        setEvents(initialEvents);
      } else {
        const transformedEvents = data.map(transformDbEvent);
        setEvents(transformedEvents);
      }
    } catch (error) {
      console.error('Error in loadEvents:', error);
      setEvents(initialEvents);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for auth state changes and reload events
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          loadEvents();
        }
      }
    );

    loadEvents();

    return () => subscription.unsubscribe();
  }, [loadEvents]);

  const addEvent = useCallback(async (eventData: Omit<Event, 'id'>) => {
    try {
      console.log('Creating event:', eventData);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create events",
          variant: "destructive"
        });
        return null;
      }

      // Generate management token and prepare event data
      const managementToken = crypto.randomUUID();
      const eventWithToken = {
        ...eventData,
        managementToken,
        managementEmail: eventData.contactEmail
      };

      const dbEvent = {
        ...transformEventForDb(eventWithToken),
        user_id: session.session.user.id
      };

      console.log('Inserting event to database:', dbEvent);
      const { data, error } = await supabase
        .from('events')
        .insert([dbEvent])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        toast({
          title: "Error",
          description: "Failed to create event",
          variant: "destructive"
        });
        return null;
      }

      console.log('Event created in database:', data);
      const newEvent = transformDbEvent(data);
      
      // Send management email to the authenticated user (event creator)
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const creatorEmail = user?.email;
        
        if (creatorEmail) {
          await supabase.functions.invoke('send-event-management-email', {
            body: {
              eventTitle: newEvent.title,
              organizerEmail: creatorEmail, // Send to event creator, not contact email
              managementToken,
              eventDate: newEvent.date,
              eventTime: newEvent.time,
              eventLocation: newEvent.location,
              isNewEvent: true
            }
          });
          console.log('Management email sent to event creator:', creatorEmail);
        } else {
          console.error('No authenticated user found to send management email');
        }
      } catch (emailError) {
        console.error('Error sending management email:', emailError);
        // Don't fail the event creation if email fails
      }
      
      // Force refresh all events from database to ensure UI sync
      console.log('Refreshing all events after creation...');
      await loadEvents();
      
      toast({
        title: "Success",
        description: "Event created successfully! Check your email for the management link."
      });
      
      return newEvent;
    } catch (error) {
      console.error('Error in addEvent:', error);
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
      return null;
    }
  }, [loadEvents]);

  const updateEvent = useCallback(async (id: string, eventData: Partial<Event>) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to update events",
          variant: "destructive"
        });
        return;
      }

      const dbEventData = transformEventForDb(eventData as Omit<Event, 'id'>);

      const { error } = await supabase
        .from('events')
        .update(dbEventData)
        .eq('id', id)
        .eq('user_id', session.session.user.id);

      if (error) {
        console.error('Error updating event:', error);
        toast({
          title: "Error",
          description: "Failed to update event",
          variant: "destructive"
        });
        return;
      }

      setEvents(prev => prev.map(event => 
        event.id === id ? { ...event, ...eventData } : event
      ));
      
      toast({
        title: "Success",
        description: "Event updated successfully"
      });
    } catch (error) {
      console.error('Error in updateEvent:', error);
      toast({
        title: "Error",
        description: "Failed to update event",
        variant: "destructive"
      });
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    try {
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to delete events",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)
        .eq('user_id', session.session.user.id);

      if (error) {
        console.error('Error deleting event:', error);
        toast({
          title: "Error",
          description: "Failed to delete event",
          variant: "destructive"
        });
        return;
      }

      setEvents(prev => prev.filter(event => event.id !== id));
      
      toast({
        title: "Success",
        description: "Event deleted successfully"
      });
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive"
      });
    }
  }, []);

  const getEventsByDate = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  }, [events]);

  return {
    events,
    loading,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate,
    refreshEvents: loadEvents
  };
};