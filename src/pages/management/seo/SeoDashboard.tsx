import { useMemo, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface PageRow {
  id: string;
  route: string;
  label: string | null;
  title: string | null;
  description: string | null;
  og_image: string | null;
  noindex: boolean;
  updated_at: string;
}

interface AuditRow {
  route: string;
  run_at: string;
  overall_score: number | null;
  overall_grade: string | null;
  perf_score: number | null;
  seo_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  internal_score: number | null;
  internal_checks: any;
  error: string | null;
}

const gradeColor = (g?: string | null) => {
  if (!g) return 'bg-muted text-muted-foreground';
  if (g.startsWith('A')) return 'bg-foreground text-background';
  if (g.startsWith('B')) return 'bg-muted text-foreground border border-foreground';
  if (g.startsWith('C')) return 'bg-background text-foreground border border-foreground';
  return 'bg-background text-foreground border-2 border-foreground font-bold';
};

const auditPause = (ms: number) => new Promise(resolve => window.setTimeout(resolve, ms));

export default function SeoDashboard() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [auditing, setAuditing] = useState<string | null>(null);
  const [auditingAll, setAuditingAll] = useState(false);
  const [progressDone, setProgressDone] = useState(0);
  const [progressRoute, setProgressRoute] = useState<string | null>(null);

  const { data: pages = [], isLoading: pagesLoading } = useQuery({
    queryKey: ['seo-pages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .order('route');
      if (error) throw error;
      return data as PageRow[];
    },
  });

  const { data: latestAudits = [] } = useQuery({
    queryKey: ['seo-latest-audits'],
    queryFn: async () => {
      // Get all audits then dedupe by route (latest run_at)
      const { data, error } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('hidden_from_dashboard', false)
        .order('run_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      const seen = new Set<string>();
      const latest: AuditRow[] = [];
      for (const a of (data as AuditRow[])) {
        if (!seen.has(a.route)) {
          seen.add(a.route);
          latest.push(a);
        }
      }
      return latest;
    },
  });

  const auditMap = useMemo(() => {
    const m = new Map<string, AuditRow>();
    for (const a of latestAudits) m.set(a.route, a);
    return m;
  }, [latestAudits]);

  const overall = useMemo(() => {
    const scores = latestAudits
      .filter(a => !a.error)
      .map(a => a.overall_score)
      .filter((s): s is number => typeof s === 'number');
    if (!scores.length) return null;
    const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    return avg;
  }, [latestAudits]);

  const runOne = useMutation({
    mutationFn: async (route: string) => {
      setAuditing(route);
      const { data, error } = await supabase.functions.invoke('seo-audit', {
        body: { route },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['seo-latest-audits'] });
      toast({ title: 'Audit complete' });
    },
    onError: (e: any) => toast({ title: 'Audit failed', description: e.message, variant: 'destructive' }),
    onSettled: () => setAuditing(null),
  });

  const runAll = useMutation({
    mutationFn: async () => {
      setAuditingAll(true);
      setProgressDone(0);
      setProgressRoute(null);

      const results: any[] = [];
      const errors: any[] = [];
      const skipped: any[] = [];
      const routes = pages.map(page => page.route);

      for (let i = 0; i < routes.length; i += 1) {
        const route = routes[i];
        setProgressRoute(route);
        const { data, error } = await supabase.functions.invoke('seo-audit', {
          body: { route },
        });

        if (error) {
          errors.push({ route, error: error.message });
        } else {
          results.push(...(data?.results ?? []));
          skipped.push(...(data?.skipped ?? []));
          errors.push(...(data?.errors ?? []));
        }

        setProgressDone(i + 1);
        qc.invalidateQueries({ queryKey: ['seo-latest-audits'] });

        if (i < routes.length - 1) await auditPause(8000);
      }

      return { ok: true, results, errors, skipped };
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['seo-latest-audits'] });
      const failed = data?.results?.filter((r: any) => r.error).length ?? data?.errors?.length ?? 0;
      const skipped = data?.skipped?.length ?? 0;
      const parts = [`${data?.results?.length ?? 0} pages tested`];
      if (failed) parts.push(`${failed} Lighthouse failures`);
      if (skipped) parts.push(`${skipped} rate-limited (kept previous score)`);
      toast({
        title: 'Site audit complete',
        description: parts.join(', ') + '.',
      });
    },
    onError: (e: any) => toast({ title: 'Audit failed', description: e.message, variant: 'destructive' }),
    onSettled: () => {
      setAuditingAll(false);
      setProgressDone(0);
      setProgressRoute(null);
    },
  });

  const sortedRows = useMemo(() => {
    return [...pages].sort((a, b) => {
      const auditA = auditMap.get(a.route);
      const auditB = auditMap.get(b.route);
      const sa = auditA?.error ? -1 : auditA?.overall_score ?? 200;
      const sb = auditB?.error ? -1 : auditB?.overall_score ?? 200;
      return sa - sb;
    });
  }, [pages, auditMap]);

  return (
    <ManagementLayout>
      <div className="p-3 md:p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="font-display uppercase tracking-tight text-2xl md:text-4xl font-black">
              SEO MONITOR
            </h1>
            <p className="font-cb-sans text-muted-foreground mt-1">
              How your pages look to Google. Edit anything, retest anytime.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/management/seo/settings">Settings</Link>
              </Button>
              <Button
                onClick={() => runAll.mutate()}
                disabled={auditingAll}
                className="font-display uppercase tracking-wide"
              >
                {auditingAll
                  ? `Testing ${Math.min(progressDone, pages.length)} / ${pages.length}…`
                  : 'Re-test entire site'}
              </Button>
            </div>
            {auditingAll && pages.length > 0 && (
              <div className="w-full md:w-72 space-y-1">
                <div className="h-1.5 w-full bg-muted overflow-hidden rounded-sm">
                  <div
                    className="h-full bg-foreground transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.round((progressDone / pages.length) * 100))}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground font-cb-sans text-right">
                  {progressRoute ? `Now testing ${progressRoute}` : 'Starting queue'} · one page at a time
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-cb-sans text-sm text-muted-foreground uppercase">
                Site Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-display font-black">
                {overall !== null ? `${overall}/100` : '—'}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {overall !== null ? 'Average across pages with full tests' : 'Lighthouse data needed for a score'}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-cb-sans text-sm text-muted-foreground uppercase">
                Pages Tracked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-display font-black">{pages.length}</div>
              <div className="text-sm text-muted-foreground mt-1">{latestAudits.length} tested</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="font-cb-sans text-sm text-muted-foreground uppercase">
                Need Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-display font-black">
                {latestAudits.filter(a => a.error || (a.overall_score ?? 100) < 70).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Failed tests or pages scoring under 70</div>
            </CardContent>
          </Card>
        </div>

        {latestAudits.some(a => a.error) && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 text-sm text-destructive">
              Lighthouse did not return live scores for {latestAudits.filter(a => a.error).length} page{latestAudits.filter(a => a.error).length === 1 ? '' : 's'}. Those pages are shown as failed, not scored, so the dashboard does not fake a 50/100 result.
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide">All Pages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {pagesLoading ? (
              <div className="p-6 text-muted-foreground">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-foreground/20 text-left">
                      <th className="px-4 py-3 font-cb-sans uppercase tracking-wide">Route</th>
                      <th className="px-4 py-3 font-cb-sans uppercase tracking-wide w-24">Score</th>
                      <th className="px-4 py-3 font-cb-sans uppercase tracking-wide w-20">Grade</th>
                      <th className="px-4 py-3 font-cb-sans uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 font-cb-sans uppercase tracking-wide w-48 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedRows.map(p => {
                      const a = auditMap.get(p.route);
                      const issues = (a?.internal_checks ?? []).filter((c: any) => c.status !== 'pass').length;
                      return (
                        <tr key={p.id} className="border-b border-foreground/10 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="font-cb-sans">{p.label || p.route}</div>
                            <div className="text-xs text-muted-foreground">{p.route}</div>
                          </td>
                          <td className="px-4 py-3 font-display font-bold">
                            {a?.error ? '—' : a?.overall_score ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            {a?.overall_grade && !a.error ? (
                              <Badge className={`${gradeColor(a.overall_grade)} font-display`}>
                                {a.overall_grade}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {!a && 'Not yet tested'}
                            {a?.error && <span className="text-destructive">Lighthouse failed: {a.error}</span>}
                            {a && !a.error && issues === 0 && 'All checks passing'}
                            {a && !a.error && issues > 0 && `${issues} issue${issues > 1 ? 's' : ''}`}
                          </td>
                          <td className="px-4 py-3 text-right space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => runOne.mutate(p.route)}
                              disabled={auditing === p.route}
                            >
                              {auditing === p.route ? 'Testing…' : 'Re-test'}
                            </Button>
                            <Button asChild size="sm">
                              <Link to={`/management/seo/page?route=${encodeURIComponent(p.route)}`}>
                                Edit
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}
