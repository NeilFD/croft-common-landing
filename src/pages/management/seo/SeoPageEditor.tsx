import { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PageRow {
  id: string;
  route: string;
  label: string | null;
  title: string | null;
  description: string | null;
  og_image: string | null;
  keywords: string[] | null;
  noindex: boolean;
}

interface AuditRow {
  overall_score: number | null;
  overall_grade: string | null;
  perf_score: number | null;
  seo_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  lcp_ms: number | null;
  cls: number | null;
  inp_ms: number | null;
  internal_checks: any;
  run_at: string;
  error: string | null;
}

function lengthHint(value: string, min: number, max: number) {
  const len = value.length;
  if (len === 0) return { color: 'text-muted-foreground', text: 'Not set' };
  if (len < min) return { color: 'text-yellow-600', text: `${len} chars — too short (aim ${min}–${max})` };
  if (len > max) return { color: 'text-yellow-600', text: `${len} chars — too long (Google cuts at ${max})` };
  return { color: 'text-green-600', text: `${len} chars — good` };
}

export default function SeoPageEditor() {
  const [params] = useSearchParams();
  const route = params.get('route') ?? '/';
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [keywords, setKeywords] = useState('');
  const [noindex, setNoindex] = useState(false);
  const [retesting, setRetesting] = useState(false);
  const [aiBusy, setAiBusy] = useState<null | 'all' | 'title' | 'description' | 'keywords'>(null);
  const [aiRationale, setAiRationale] = useState<string | null>(null);

  const { data: page } = useQuery({
    queryKey: ['seo-page', route],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_pages')
        .select('*')
        .eq('route', route)
        .maybeSingle();
      if (error) throw error;
      return data as PageRow | null;
    },
  });

  const { data: audit } = useQuery({
    queryKey: ['seo-page-audit', route],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_audits')
        .select('*')
        .eq('route', route)
        .order('run_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AuditRow | null;
    },
  });

  useEffect(() => {
    if (page) {
      setTitle(page.title ?? '');
      setDescription(page.description ?? '');
      setOgImage(page.og_image ?? '');
      setKeywords((page.keywords ?? []).join(', '));
      setNoindex(page.noindex);
    }
  }, [page]);

  const runAudit = async () => {
    setRetesting(true);
    try {
      const { error } = await supabase.functions.invoke('seo-audit', { body: { route } });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['seo-page-audit', route] });
      qc.invalidateQueries({ queryKey: ['seo-latest-audits'] });
    } finally {
      setRetesting(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('seo_pages')
        .update({
          title: title || null,
          description: description || null,
          og_image: ogImage || null,
          keywords: keywords
            ? keywords.split(',').map(k => k.trim()).filter(Boolean)
            : null,
          noindex,
        })
        .eq('route', route);
      if (error) throw error;
    },
    onSuccess: async () => {
      qc.invalidateQueries({ queryKey: ['seo-page', route] });
      qc.invalidateQueries({ queryKey: ['seo-pages'] });
      try {
        await runAudit();
        toast({ title: 'Saved & re-tested' });
      } catch (e: any) {
        toast({
          title: 'Saved (re-test failed)',
          description: e.message ?? 'Click Re-test to try again.',
          variant: 'destructive',
        });
      }
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  const manualRetest = async () => {
    try {
      await runAudit();
      toast({ title: 'Re-tested' });
    } catch (e: any) {
      toast({ title: 'Audit failed', description: e.message, variant: 'destructive' });
    }
  };


  const aiSuggest = async (which: 'all' | 'title' | 'description' | 'keywords') => {
    setAiBusy(which);
    setAiRationale(null);
    try {
      const fields = which === 'all' ? ['title', 'description', 'keywords'] : [which];
      const { data, error } = await supabase.functions.invoke('seo-copywriter', {
        body: {
          route,
          label: page?.label,
          fields,
          current: { title, description },
        },
      });
      if (error) throw error;
      const d = data as any;
      if (d?.error) throw new Error(d.error);
      if (d.title && fields.includes('title')) setTitle(d.title);
      if (d.description && fields.includes('description')) setDescription(d.description);
      if (d.keywords && fields.includes('keywords'))
        setKeywords(Array.isArray(d.keywords) ? d.keywords.join(', ') : String(d.keywords));
      if (d.rationale) setAiRationale(d.rationale);
      toast({ title: 'AI suggested copy ready', description: 'Review and Save when happy.' });
    } catch (e: any) {
      toast({ title: 'AI suggest failed', description: e.message, variant: 'destructive' });
    } finally {
      setAiBusy(null);
    }
  };

  const titleHint = lengthHint(title, 30, 60);
  const descHint = lengthHint(description, 70, 160);
  const previewTitle = title || '(no title set)';
  const previewDesc = description || '(no description set)';
  const previewUrl = `www.crazybear.dev${route}`;

  return (
    <ManagementLayout>
      <div className="p-3 md:p-6 space-y-6 max-w-5xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link to="/management/seo" className="text-sm text-muted-foreground hover:underline">
              ← All pages
            </Link>
            <h1 className="font-display uppercase tracking-tight text-2xl md:text-3xl font-black mt-1">
              {page?.label || route}
            </h1>
            <div className="text-sm text-muted-foreground mt-1">{route}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => aiSuggest('all')}
              disabled={aiBusy !== null}
            >
              {aiBusy === 'all' ? 'Writing…' : '✨ Suggest with AI'}
            </Button>
            <Button variant="outline" onClick={manualRetest} disabled={retesting || save.isPending}>
              {retesting && !save.isPending ? 'Testing…' : 'Re-test'}
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || retesting}>
              {save.isPending ? 'Saving…' : retesting ? 'Re-testing…' : 'Save'}
            </Button>
          </div>
        </div>

        {aiRationale && (
          <div className="border border-foreground/20 bg-muted/40 p-3 text-sm">
            <span className="font-cb-sans font-medium uppercase text-xs tracking-wide mr-2">
              AI note
            </span>
            {aiRationale}
          </div>
        )}

        {/* Google preview */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide text-base">
              How this looks on Google
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border border-foreground/20 p-4 bg-background space-y-1 max-w-2xl">
              <div className="text-xs text-muted-foreground">{previewUrl}</div>
              <div className="text-blue-700 text-xl truncate">{previewTitle}</div>
              <div className="text-sm text-muted-foreground line-clamp-2">{previewDesc}</div>
            </div>
          </CardContent>
        </Card>

        {/* Editor */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide text-base">
              Edit page SEO
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <Label className="font-cb-sans">Page title shown on Google</Label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Crazy Bear Country — Stadhampton"
                className="mt-1"
              />
              <div className={`text-xs mt-1 ${titleHint.color}`}>{titleHint.text}</div>
            </div>

            <div>
              <Label className="font-cb-sans">Short summary (under the title)</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="One or two sentences about the page."
                rows={3}
                className="mt-1"
              />
              <div className={`text-xs mt-1 ${descHint.color}`}>{descHint.text}</div>
            </div>

            <div>
              <Label className="font-cb-sans">Sharing image (WhatsApp / Facebook / iMessage)</Label>
              <Input
                value={ogImage}
                onChange={e => setOgImage(e.target.value)}
                placeholder="/brand/og-country.jpg or full https URL"
                className="mt-1"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Leave blank to use the site default. Use 1200×630 for best results.
              </div>
              {ogImage && (
                <img
                  src={ogImage.startsWith('http') ? ogImage : `https://www.crazybear.dev${ogImage}`}
                  alt="Sharing preview"
                  className="mt-3 max-w-sm border border-foreground/20"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
                />
              )}
            </div>

            <div>
              <Label className="font-cb-sans">Keywords (optional, comma-separated)</Label>
              <Input
                value={keywords}
                onChange={e => setKeywords(e.target.value)}
                placeholder="boutique hotel, country pub, weddings"
                className="mt-1"
              />
              <div className="text-xs text-muted-foreground mt-1">
                Google ignores these but they don't hurt.
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-foreground/10 pt-4">
              <div>
                <Label className="font-cb-sans">Hide from Google</Label>
                <div className="text-xs text-muted-foreground">
                  Stops this page appearing in search results.
                </div>
              </div>
              <Switch checked={noindex} onCheckedChange={setNoindex} />
            </div>
          </CardContent>
        </Card>

        {/* Audit results */}
        <Card>
          <CardHeader>
            <CardTitle className="font-display uppercase tracking-wide text-base">
              Latest test results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!audit ? (
              <div className="text-muted-foreground">
                Not tested yet. Click <strong>Re-test</strong> above.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-xs text-muted-foreground">
                  Tested {new Date(audit.run_at).toLocaleString()}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ScoreTile label="Overall" score={audit.error ? null : audit.overall_score} grade={audit.error ? null : audit.overall_grade} />
                  <ScoreTile label="Performance" score={audit.perf_score} />
                  <ScoreTile label="SEO" score={audit.seo_score} />
                  <ScoreTile label="Accessibility" score={audit.accessibility_score} />
                  <ScoreTile label="Best Practices" score={audit.best_practices_score} />
                  <CWVTile label="LCP" value={audit.lcp_ms ? `${(audit.lcp_ms / 1000).toFixed(1)}s` : '—'} hint="Loading speed" />
                  <CWVTile label="CLS" value={audit.cls !== null ? audit.cls!.toFixed(2) : '—'} hint="Layout stability" />
                  <CWVTile label="INP" value={audit.inp_ms ? `${audit.inp_ms}ms` : '—'} hint="Interactivity" />
                </div>

                {audit.error && (
                  <div className="text-sm text-destructive">
                    Lighthouse failed: {audit.error}. No overall score is shown because this was not a complete live test. Internal checks below still ran.
                  </div>
                )}

                <div>
                  <h3 className="font-display uppercase tracking-wide text-sm mb-2">Checks</h3>
                  <div className="space-y-2">
                    {(audit.internal_checks ?? []).map((c: any) => (
                      <div
                        key={c.id}
                        className="flex items-start gap-3 border border-foreground/10 p-3"
                      >
                        <Badge
                          variant={c.status === 'pass' ? 'default' : c.status === 'warn' ? 'secondary' : 'destructive'}
                          className="font-display uppercase text-xs"
                        >
                          {c.status}
                        </Badge>
                        <div>
                          <div className="font-cb-sans font-medium">{c.label}</div>
                          <div className="text-sm text-muted-foreground">{c.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}

function ScoreTile({ label, score, grade }: { label: string; score: number | null; grade?: string | null }) {
  const color =
    score === null ? 'text-muted-foreground' :
    score >= 90 ? 'text-green-600' :
    score >= 70 ? 'text-foreground' :
    score >= 50 ? 'text-yellow-600' : 'text-destructive';
  return (
    <div className="border border-foreground/20 p-3">
      <div className="text-xs uppercase font-cb-sans text-muted-foreground">{label}</div>
      <div className={`text-3xl font-display font-black ${color}`}>
        {score ?? '—'}
        {grade && <span className="text-sm ml-2 align-middle">({grade})</span>}
      </div>
    </div>
  );
}

function CWVTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-foreground/20 p-3">
      <div className="text-xs uppercase font-cb-sans text-muted-foreground">{label}</div>
      <div className="text-2xl font-display font-black">{value}</div>
      <div className="text-xs text-muted-foreground">{hint}</div>
    </div>
  );
}
