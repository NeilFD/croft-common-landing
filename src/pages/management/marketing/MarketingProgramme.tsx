import { useMemo, useRef, useState } from 'react';
import { addMonths, format, startOfMonth } from 'date-fns';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GanttGrid } from '@/components/marketing/programme/GanttGrid';
import { CampaignDrawer } from '@/components/marketing/programme/CampaignDrawer';
import {
  useProgrammeCampaigns,
  useOptimisticDates,
  useUpsertCampaign,
} from '@/hooks/useProgrammeCampaigns';
import {
  buildWindow,
  LANE_LABELS,
  PROPERTY_LABELS,
  type Lane,
  type WindowSize,
} from '@/lib/marketing/programme';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PROPERTY_TABS = ['all', 'town', 'country', 'group'] as const;
type PropertyTab = (typeof PROPERTY_TABS)[number];

const MarketingProgramme = () => {
  const { toast } = useToast();
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [size, setSize] = useState<WindowSize>('month');
  const [property, setProperty] = useState<PropertyTab>('all');
  const [search, setSearch] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [initialLane, setInitialLane] = useState<Lane | undefined>(undefined);
  const [initialDate, setInitialDate] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);

  const win = useMemo(() => buildWindow(anchor, size), [anchor, size]);
  const range = useMemo(
    () => ({ from: format(win.start, 'yyyy-MM-dd'), to: format(win.end, 'yyyy-MM-dd') }),
    [win.start, win.end],
  );

  const { data: campaigns = [], isLoading } = useProgrammeCampaigns(range);
  const upsert = useUpsertCampaign();
  const optimistic = useOptimisticDates();

  const filtered = useMemo(() => {
    return campaigns.filter((c) => {
      if (property !== 'all' && c.property_tag !== property) return false;
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [campaigns, property, search]);

  const exportRef = useRef<HTMLDivElement>(null);

  const openEdit = (id: string) => {
    setEditingId(id);
    setInitialLane(undefined);
    setInitialDate(null);
    setDrawerOpen(true);
  };
  const openCreate = (lane?: Lane, date?: Date) => {
    setEditingId(null);
    setInitialLane(lane);
    setInitialDate(date ?? new Date());
    setDrawerOpen(true);
  };

  const commitDates = async (id: string, startISO: string, endISO: string) => {
    const { error } = await (supabase as any)
      .from('marketing_campaigns')
      .update({ start_date: startISO, end_date: endISO })
      .eq('id', id);
    if (error) {
      toast({ title: 'Could not save dates', description: error.message, variant: 'destructive' });
      throw error;
    }
  };

  const snapshot = async (): Promise<string | null> => {
    if (!exportRef.current) return null;
    return toPng(exportRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      filter: (n) => !(n instanceof HTMLElement && n.dataset.exportHide === 'true'),
    });
  };

  const onExportPng = async () => {
    setExporting(true);
    try {
      const dataUrl = await snapshot();
      if (!dataUrl) return;
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `crazy-bear-programme-${format(win.start, 'yyyy-MM')}.png`;
      a.click();
      toast({ title: 'PNG downloaded' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err?.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const onExportPdf = async () => {
    setExporting(true);
    try {
      const dataUrl = await snapshot();
      if (!dataUrl) return;
      // A3 landscape (420x297mm)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
      const img = new Image();
      img.src = dataUrl;
      await new Promise((res) => (img.onload = res));
      const pageW = 420;
      const pageH = 297;
      const ratio = img.width / img.height;
      let w = pageW - 20;
      let h = w / ratio;
      if (h > pageH - 20) {
        h = pageH - 20;
        w = h * ratio;
      }
      pdf.addImage(dataUrl, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h);
      pdf.save(`crazy-bear-programme-${format(win.start, 'yyyy-MM')}.pdf`);
      toast({ title: 'PDF downloaded' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err?.message, variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <ManagementLayout>
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display uppercase tracking-wider text-3xl md:text-4xl">Programme</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every campaign and promo, one view. Drag a bar to shift it. Drag an edge to stretch it.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setAnchor(addMonths(anchor, -1))}>{'<'}</Button>
            <Button variant="outline" onClick={() => setAnchor(startOfMonth(new Date()))}>Today</Button>
            <div className="font-display text-lg uppercase min-w-[160px] text-center">
              {format(win.start, 'MMMM yyyy')}
              {size === 'quarter' ? ` +` : ''}
            </div>
            <Button variant="outline" onClick={() => setAnchor(addMonths(anchor, 1))}>{'>'}</Button>
            <div className="border-l border-foreground/20 h-6 mx-1" />
            <Button
              variant={size === 'month' ? 'default' : 'outline'}
              onClick={() => setSize('month')}
            >
              Month
            </Button>
            <Button
              variant={size === 'quarter' ? 'default' : 'outline'}
              onClick={() => setSize('quarter')}
            >
              Quarter
            </Button>
            <div className="border-l border-foreground/20 h-6 mx-1" />
            <Button variant="outline" onClick={onExportPng} disabled={exporting}>
              Share PNG
            </Button>
            <Button variant="outline" onClick={onExportPdf} disabled={exporting}>
              Share PDF
            </Button>
            <Button onClick={() => openCreate()}>+ New campaign</Button>
          </div>
        </div>

        <div
          className="flex items-center gap-3 flex-wrap border-y border-foreground/10 py-3"
          data-export-hide="true"
        >
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-[260px]"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
              Property
            </span>
            {PROPERTY_TABS.map((p) => {
              const on = property === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProperty(p)}
                  className={`text-[10px] uppercase font-display tracking-wider px-3 py-1.5 border ${
                    on
                      ? 'bg-foreground text-background border-foreground'
                      : 'border-foreground/30 hover:border-foreground'
                  }`}
                >
                  {p === 'all' ? 'All' : PROPERTY_LABELS[p as keyof typeof PROPERTY_LABELS]}
                </button>
              );
            })}
          </div>
        </div>

        <div ref={exportRef} className="bg-background p-6 border border-foreground/10">
          {/* Branded header for exports */}
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="font-display uppercase text-[10px] tracking-[0.4em] text-muted-foreground">
                Crazy Bear
              </p>
              <h2 className="font-display uppercase text-2xl tracking-wider">
                Marketing Programme · {format(win.start, 'MMMM yyyy')}
                {size === 'quarter' ? ` – ${format(win.end, 'MMM yyyy')}` : ''}
              </h2>
            </div>
            <p className="font-display uppercase text-[10px] tracking-[0.3em] text-muted-foreground">
              {property === 'all' ? 'All properties' : PROPERTY_LABELS[property as keyof typeof PROPERTY_LABELS]}
              {' · '}Generated {format(new Date(), "d MMM yyyy 'at' HH:mm")}
            </p>
          </div>

          {isLoading ? (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Loading…
            </div>
          ) : (
            <GanttGrid
              window={win}
              campaigns={filtered}
              onOpenCampaign={openEdit}
              onCreateInLane={(lane, date) => openCreate(lane, date)}
              onCommitDates={commitDates}
              optimisticUpdate={optimistic}
            />
          )}

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 flex-wrap text-[10px] font-display uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-3" style={{ background: '#E91E63' }} />
              Town
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-3" style={{ background: '#2E7D32' }} />
              Country
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block w-2 h-3" style={{ background: '#111' }} />
              Group
            </span>
            <span className="ml-auto">
              {filtered.length} of {campaigns.length} campaigns · {Object.keys(LANE_LABELS).length} lanes
            </span>
          </div>
        </div>
      </div>

      <CampaignDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        campaignId={editingId}
        initialLane={initialLane}
        initialDate={initialDate}
      />
    </ManagementLayout>
  );
};

export default MarketingProgramme;
