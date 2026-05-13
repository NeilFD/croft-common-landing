import { useMemo, useState } from 'react';
import { addMonths, endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarGrid } from '@/components/marketing/CalendarGrid';
import { PostDrawer } from '@/components/marketing/PostDrawer';
import { DayPostsModal } from '@/components/marketing/DayPostsModal';
import { ToneOfVoiceDialog } from '@/components/marketing/ToneOfVoiceDialog';
import { useMarketingPosts } from '@/hooks/useMarketing';
import { ALL_CHANNELS, CHANNEL_META } from '@/components/marketing/channelMeta';
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/marketing/types';

const MarketingCalendar = () => {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [dayModalDate, setDayModalDate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [tovOpen, setTovOpen] = useState(false);

  const range = useMemo(() => ({
    from: startOfMonth(month).toISOString(),
    to: endOfMonth(month).toISOString(),
  }), [month]);

  const { data: posts = [], isLoading } = useMarketingPosts(range);

  const filtered = posts.filter((p) => {
    if (search && !(p.title || '').toLowerCase().includes(search.toLowerCase()) && !(p.body || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (channelFilter.length && !(p.channels || []).some((c) => channelFilter.includes(c))) return false;
    if (statusFilter.length && !statusFilter.includes(p.status)) return false;
    return true;
  });

  const openCreate = (date: Date) => {
    setEditingId(null);
    setInitialDate(date);
    setDrawerOpen(true);
  };
  const openEdit = (id: string) => {
    setEditingId(id);
    setInitialDate(null);
    setDrawerOpen(true);
  };

  const toggle = (arr: string[], setter: (v: string[]) => void, v: string) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <ManagementLayout>
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display uppercase tracking-wider text-3xl md:text-4xl">Marketing Calendar</h1>
            <p className="text-sm text-muted-foreground mt-1">Plan, review and approve every post.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setMonth(addMonths(month, -1))}>{'<'}</Button>
            <Button variant="outline" onClick={() => setMonth(startOfMonth(new Date()))}>Today</Button>
            <div className="font-display text-lg uppercase min-w-[160px] text-center">
              {format(month, 'MMMM yyyy')}
            </div>
            <Button variant="outline" onClick={() => setMonth(addMonths(month, 1))}>{'>'}</Button>
            <Button variant="outline" onClick={() => setTovOpen(true)}>Tone of voice</Button>
            <Button onClick={() => openCreate(new Date())}>+ New post</Button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap border-y border-foreground/10 py-3">
          <Input
            placeholder="Search posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[260px]"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Channel</span>
            {ALL_CHANNELS.map((c) => {
              const on = channelFilter.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(channelFilter, setChannelFilter, c)}
                  className={`text-[10px] uppercase font-display tracking-wider px-2 py-1 border ${on ? 'bg-foreground text-background border-foreground' : 'border-foreground/20 hover:border-foreground'}`}
                  title={CHANNEL_META[c].label}
                >
                  <span className="inline-block w-1.5 h-1.5 rounded-full mr-1" style={{ background: CHANNEL_META[c].color }} />
                  {CHANNEL_META[c].label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">Status</span>
            {STATUS_ORDER.map((s) => {
              const on = statusFilter.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(statusFilter, setStatusFilter, s)}
                  className={`text-[10px] uppercase font-display tracking-wider px-2 py-1 border ${on ? 'bg-foreground text-background border-foreground' : 'border-foreground/20 hover:border-foreground'}`}
                >
                  {STATUS_LABELS[s]}
                </button>
              );
            })}
          </div>
          {(search.length > 0 || channelFilter.length > 0 || statusFilter.length > 0) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setChannelFilter([]); setStatusFilter([]); }}>
              Clear
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : (
          <CalendarGrid
            month={month}
            posts={filtered}
            onSelectPost={openEdit}
            onCreate={openCreate}
            onOpenDay={(d) => setDayModalDate(d)}
          />
        )}
      </div>

      <DayPostsModal
        open={!!dayModalDate}
        date={dayModalDate}
        posts={filtered.filter((p) => dayModalDate && p.scheduled_at && isSameDay(new Date(p.scheduled_at), dayModalDate))}
        onClose={() => setDayModalDate(null)}
        onOpenPost={openEdit}
        onCreate={openCreate}
      />

      <ToneOfVoiceDialog open={tovOpen} onOpenChange={setTovOpen} />
      <PostDrawer
        open={drawerOpen}
        postId={editingId}
        initialDate={initialDate}
        onClose={() => setDrawerOpen(false)}
      />
    </ManagementLayout>
  );
};

export default MarketingCalendar;
