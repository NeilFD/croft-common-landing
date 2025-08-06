export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  organizer: string;
  location: string;
  price: number | null;
  category: EventCategory;
  imageUrl?: string;
  contactEmail: string;
}

export type EventCategory = 'gigs' | 'tastings' | 'talks' | 'takeovers' | 'food' | 'special';

export const eventCategoryColors: Record<EventCategory, {
  bg: string;
  border: string;
  text: string;
  accent: string;
}> = {
  gigs: {
    bg: 'bg-accent-orange-subtle',
    border: 'border-accent-orange',
    text: 'text-accent-orange-dark',
    accent: 'accent-orange'
  },
  tastings: {
    bg: 'bg-accent-pink-subtle',
    border: 'border-accent-pink',
    text: 'text-accent-pink-dark',
    accent: 'accent-pink'
  },
  talks: {
    bg: 'bg-accent-electric-blue/20',
    border: 'border-accent-electric-blue',
    text: 'text-accent-electric-blue',
    accent: 'accent-electric-blue'
  },
  takeovers: {
    bg: 'bg-accent-lime-subtle',
    border: 'border-accent-lime',
    text: 'text-accent-lime-dark',
    accent: 'accent-lime'
  },
  food: {
    bg: 'bg-accent-blood-red-subtle',
    border: 'border-accent-blood-red',
    text: 'text-accent-blood-red-dark',
    accent: 'accent-blood-red'
  },
  special: {
    bg: 'bg-accent-vivid-purple-subtle',
    border: 'border-accent-vivid-purple',
    text: 'text-accent-vivid-purple-dark',
    accent: 'accent-vivid-purple'
  }
};