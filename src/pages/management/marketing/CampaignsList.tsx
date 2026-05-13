import { useState } from 'react';
import { format } from 'date-fns';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useMarketingCampaigns, useUpsertCampaign, useDeleteCampaign } from '@/hooks/useMarketing';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { toast } from 'sonner';
import type { MarketingCampaign } from '@/lib/marketing/types';

const CampaignsList = () => {
  const { data: campaigns = [], isLoading } = useMarketingCampaigns();
  const upsert = useUpsertCampaign();
  const del = useDeleteCampaign();
  const { managementUser } = useManagementAuth();
  const isAdmin = managementUser?.role === 'admin';

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingCampaign | null>(null);

  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [kpi, setKpi] = useState('');
  const [budget, setBudget] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const startNew = () => {
    setEditing(null);
    setName(''); setGoal(''); setKpi(''); setBudget(''); setStart(''); setEnd('');
    setOpen(true);
  };

  const startEdit = (c: MarketingCampaign) => {
    setEditing(c);
    setName(c.name);
    setGoal(c.goal || '');
    setKpi(c.kpi || '');
    setBudget(c.budget?.toString() || '');
    setStart(c.start_date || '');
    setEnd(c.end_date || '');
    setOpen(true);
  };

  const save = async () => {
    if (!name.trim()) return toast.error('Name required');
    try {
      await upsert.mutateAsync({
        id: editing?.id,
        name: name.trim(),
        goal: goal || null,
        kpi: kpi || null,
        budget: budget ? Number(budget) : null,
        start_date: start || null,
        end_date: end || null,
      });
      toast.success(editing ? 'Updated' : 'Created');
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
  };

  const remove = async (c: MarketingCampaign) => {
    if (!confirm(`Delete campaign "${c.name}"?`)) return;
    try {
      await del.mutateAsync(c.id);
      toast.success('Deleted');
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  return (
    <ManagementLayout>
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display uppercase tracking-wider text-3xl md:text-4xl">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">Group posts under named campaigns with goals and budget.</p>
          </div>
          <Button onClick={startNew}>+ New campaign</Button>
        </div>

        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="border border-foreground/15 p-8 text-center text-muted-foreground">No campaigns yet.</div>
        ) : (
          <div className="border border-foreground/15">
            <table className="w-full text-sm">
              <thead className="bg-foreground/5 text-[10px] uppercase font-display tracking-wider">
                <tr>
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Goal</th>
                  <th className="text-left p-3">KPI</th>
                  <th className="text-right p-3">Budget</th>
                  <th className="text-left p-3">Window</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-foreground/10 hover:bg-foreground/5">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="p-3 text-muted-foreground">{c.goal || '-'}</td>
                    <td className="p-3 text-muted-foreground">{c.kpi || '-'}</td>
                    <td className="p-3 text-right">{c.budget ? `£${Number(c.budget).toLocaleString('en-GB')}` : '-'}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {c.start_date ? format(new Date(c.start_date), 'd MMM yyyy') : '-'}
                      {' to '}
                      {c.end_date ? format(new Date(c.end_date), 'd MMM yyyy') : '-'}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => startEdit(c)}>Edit</Button>
                      {isAdmin && (
                        <Button size="sm" variant="ghost" onClick={() => remove(c)} className="text-red-600">Delete</Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display uppercase tracking-wider">
              {editing ? 'Edit campaign' : 'New campaign'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bottomless brunch launch" />
            </div>
            <div>
              <Label>Goal</Label>
              <Textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={2} placeholder="Drive Saturday covers" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>KPI</Label>
                <Input value={kpi} onChange={(e) => setKpi(e.target.value)} placeholder="200 covers" />
              </div>
              <div>
                <Label>Budget (£)</Label>
                <Input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start</Label>
                <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </div>
              <div>
                <Label>End</Label>
                <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save} disabled={upsert.isPending}>{editing ? 'Save' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ManagementLayout>
  );
};

export default CampaignsList;
