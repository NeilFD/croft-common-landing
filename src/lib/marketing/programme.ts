// Programme (Gantt) lane definitions, layout helpers and date math.

import { addDays, differenceInCalendarDays, endOfMonth, startOfMonth, format } from 'date-fns';

export type Lane =
  | 'key_dates'
  | 'room_promo'
  | 'fnb_promo'
  | 'live_campaign'
  | 'programming'
  | 'social'
  | 'newsletter';

export const LANE_ORDER: Lane[] = [
  'key_dates',
  'room_promo',
  'fnb_promo',
  'live_campaign',
  'programming',
  'social',
  'newsletter',
];

export const LANE_LABELS: Record<Lane, string> = {
  key_dates: 'Key Dates',
  room_promo: 'Room Promos',
  fnb_promo: 'F&B Promos',
  live_campaign: 'Live Campaigns',
  programming: 'Programming',
  social: 'Social Comms',
  newsletter: 'Newsletter',
};

// Subtle B&W friendly fills with a single accent bar on the left.
// Background is intentionally light grey so a wall of bars stays calm.
export const LANE_FILL: Record<Lane, string> = {
  key_dates: 'bg-foreground text-background',
  room_promo: 'bg-muted text-foreground',
  fnb_promo: 'bg-muted text-foreground',
  live_campaign: 'bg-muted text-foreground',
  programming: 'bg-muted text-foreground',
  social: 'bg-muted text-foreground',
  newsletter: 'bg-muted text-foreground',
};

export type PropertyTag = 'town' | 'country' | 'group';

export const PROPERTY_ACCENT: Record<PropertyTag, string> = {
  town: '#E91E63', // Town accent
  country: '#2E7D32', // Country accent
  group: '#111111',
};

export const PROPERTY_LABELS: Record<PropertyTag, string> = {
  town: 'Town',
  country: 'Country',
  group: 'Group',
};

export type WindowSize = 'month' | 'quarter';

export interface ProgrammeWindow {
  size: WindowSize;
  start: Date;
  end: Date;
  days: number;
}

export const buildWindow = (anchor: Date, size: WindowSize): ProgrammeWindow => {
  const start = startOfMonth(anchor);
  const end =
    size === 'month'
      ? endOfMonth(anchor)
      : endOfMonth(addDays(start, 90)); // approx 3 months
  return {
    size,
    start,
    end,
    days: differenceInCalendarDays(end, start) + 1,
  };
};

export const clampToWindow = (d: Date, win: ProgrammeWindow): Date => {
  if (d < win.start) return win.start;
  if (d > win.end) return win.end;
  return d;
};

export const dayIndex = (d: Date, win: ProgrammeWindow): number =>
  differenceInCalendarDays(d, win.start);

export const indexToDate = (i: number, win: ProgrammeWindow): Date =>
  addDays(win.start, Math.max(0, Math.min(win.days - 1, i)));

export const formatRange = (start: string | null, end: string | null): string => {
  if (!start && !end) return 'No dates set';
  const s = start ? format(new Date(start), 'd MMM') : '?';
  const e = end ? format(new Date(end), 'd MMM') : '?';
  return s === e ? s : `${s} – ${e}`;
};
