import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useDeleteCampaign, useUpsertCampaign } from '@/hooks/useProgrammeCampaigns';
import { LANE_LABELS, LANE_ORDER, PROPERTY_LABELS, type Lane } from '@/lib/marketing/programme';
import type { MarketingCampaign } from '@/lib/marketing/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaignId: string | null;
  initialLane?: Lane;
  initialDate?: Date | null;
  onSaved?: () => void;
}

const STATUS_OPTIONS = ['planned', 'live', 'paused', 'finished'] as const;

export const CampaignDrawer = ({
  open,
  onOpenChange,
  campaignId,
  initialLane,
  initialDate,
  onSaved,
}: Props) => {
  const { toast } = useToast();
  const upsert = useUpsertCampaign();
  const del = useDeleteCampaign();

  const [form, setForm] = useState<Partial<MarketingCampaign>>({});

  useEffect(() => {
    if (!open) return;
    if (campaignId) {
      (async () => {
        const { data } = await (supabase as any)
          .from('marketing_campaigns')
          .select('*')
          .eq('id', campaignId)
          .maybeSingle();
        if (data) setForm(data);
      })();
    } else {
      const iso = initialDate ? format(initialDate, 'yyyy-MM-dd') : null;
      setForm({
        name: '',
        lane: initialLane ?? 'live_campaign',
        property_tag: 'group',
        status: 'planned',
        start_date: iso,
        end_date: iso,
        notes: null,
        goal: null,
        kpi: null,
      });
    }
  }, [open, campaignId, initialLane, initialDate]);

  const update = <K extends keyof MarketingCampaign>(k: K, v: MarketingCampaign[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    if (!form.name?.trim()) {
      toast({ title: 'Name required', variant: 'destructive' });
      return;
    }
    if (form.start_date && form.end_date && form.start_date > form.end_date) {
      toast({ title: 'End date must be on or after start date', variant: 'destructive' });
      return;
    }
    try {
      await upsert.mutateAsync({
        id: campaignId ?? undefined,
        name: form.name!,
        lane: form.lane as Lane,
        property_tag: (form.property_tag ?? null) as any,
        start_date: form.start_date ?? null,
        end_date: form.end_date ?? null,
        status: form.status ?? 'planned',
        notes: form.notes ?? null,
        goal: form.goal ?? null,
        kpi: form.kpi ?? null,
      });
      toast({ title: campaignId ? 'Campaign updated' : 'Campaign created' });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message, variant: 'destructive' });
    }
  };

  const onDelete = async () => {
    if (!campaignId) return;
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    try {
      await del.mutateAsync(campaignId);
      toast({ title: 'Campaign deleted' });
      onSaved?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Delete failed', description: err?.message, variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle className="font-display uppercase tracking-wider">
            {campaignId ? 'Edit campaign' : 'New campaign'}
          </SheetTitle>
          <SheetDescription>
            On the Programme. Shown to the team on the Gantt.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name ?? ''}
              onChange={(e) => update('name', e.target.value)}
              placeholder="Spring Suite Offer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Lane</Label>
              <select
                className="w-full h-10 border border-input bg-background px-3 text-sm"
                value={form.lane ?? 'live_campaign'}
                onChange={(e) => update('lane', e.target.value as Lane)}
              >
                {LANE_ORDER.map((l) => (
                  <option key={l} value={l}>{LANE_LABELS[l]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Property</Label>
              <select
                className="w-full h-10 border border-input bg-background px-3 text-sm"
                value={form.property_tag ?? 'group'}
                onChange={(e) => update('property_tag', e.target.value as any)}
              >
                {(['group', 'town', 'country'] as const).map((p) => (
                  <option key={p} value={p}>{PROPERTY_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start">Start</Label>
              <Input
                id="start"
                type="date"
                value={form.start_date ?? ''}
                onChange={(e) => update('start_date', e.target.value || null)}
              />
            </div>
            <div>
              <Label htmlFor="end">End</Label>
              <Input
                id="end"
                type="date"
                value={form.end_date ?? ''}
                onChange={(e) => update('end_date', e.target.value || null)}
              />
            </div>
          </div>

          <div>
            <Label>Status</Label>
            <div className="flex gap-2 flex-wrap mt-1">
              {STATUS_OPTIONS.map((s) => {
                const on = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => update('status', s)}
                    className={`text-[10px] uppercase font-display tracking-wider px-3 py-1.5 border ${
                      on ? 'bg-foreground text-background border-foreground' : 'border-foreground/30 hover:border-foreground'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <Label htmlFor="goal">Goal</Label>
            <Input
              id="goal"
              value={form.goal ?? ''}
              onChange={(e) => update('goal', e.target.value)}
              placeholder="What does success look like?"
            />
          </div>

          <div>
            <Label htmlFor="kpi">KPI</Label>
            <Input
              id="kpi"
              value={form.kpi ?? ''}
              onChange={(e) => update('kpi', e.target.value)}
              placeholder="e.g. 60 bookings, +20% bar covers"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes for site teams</Label>
            <Textarea
              id="notes"
              rows={4}
              value={form.notes ?? ''}
              onChange={(e) => update('notes', e.target.value)}
              placeholder="Briefing, assets, staffing notes…"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {campaignId && (
                <Button variant="ghost" onClick={onDelete} className="text-destructive">
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={upsert.isPending}>
                {campaignId ? 'Save' : 'Create'}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
