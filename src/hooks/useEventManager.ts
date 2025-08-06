import { useState, useCallback } from 'react';
import { Event } from '@/types/event';

// Sample events data
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

export const useEventManager = () => {
  const [events, setEvents] = useState<Event[]>(initialEvents);

  const addEvent = useCallback((eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString()
    };
    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEvent = useCallback((id: string, eventData: Partial<Event>) => {
    setEvents(prev => prev.map(event => 
      event.id === id ? { ...event, ...eventData } : event
    ));
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  }, []);

  const getEventsByDate = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  }, [events]);

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    getEventsByDate
  };
};