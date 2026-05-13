import { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
} from 'date-fns';
import type { MarketingPost } from '@/lib/marketing/types';
import { PostCell } from './PostCell';

interface Props {
  month: Date;
  posts: MarketingPost[];
  onSelectPost: (id: string) => void;
  onCreate: (date: Date) => void;
  onOpenDay: (date: Date) => void;
}

export const CalendarGrid = ({ month, posts, onSelectPost, onCreate, onOpenDay }: Props) => {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const today = new Date();

  return (
    <div className="border border-foreground bg-foreground/10">
      <div className="grid grid-cols-7 bg-foreground text-background">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="px-2 py-1.5 text-xs font-display uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const isToday = isSameDay(day, today);
          const dayPosts = posts.filter(
            (p) => p.scheduled_at && isSameDay(new Date(p.scheduled_at), day),
          );
          return (
            <div
              key={day.toISOString()}
              onClick={() => onOpenDay(day)}
              className={`min-h-[120px] bg-background p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-foreground/5 transition-colors ${inMonth ? '' : 'opacity-40'}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-display ${isToday ? 'bg-foreground text-background px-1.5' : ''}`}
                >
                  {format(day, 'd')}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onCreate(day); }}
                  className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-xs text-muted-foreground hover:text-foreground"
                  title="Create post"
                >
                  +
                </button>
              </div>
              {dayPosts.slice(0, 4).map((p) => (
                <div key={p.id} onClick={(e) => e.stopPropagation()}>
                  <PostCell post={p} onClick={() => onSelectPost(p.id)} />
                </div>
              ))}
              {dayPosts.length > 4 && (
                <div className="text-[10px] text-muted-foreground">+{dayPosts.length - 4} more</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
