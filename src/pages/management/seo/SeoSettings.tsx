import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SettingsRow {
  site_name: string;
  default_title_suffix: string | null;
  default_description: string | null;
  default_og_image: string | null;
  organization_jsonld: any;
}

export default function SeoSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [siteName, setSiteName] = useState('');
  const [titleSuffix, setTitleSuffix] = useState('');
  const [defaultDesc, setDefaultDesc] = useState('');
  const [defaultImg, setDefaultImg] = useState('');
  const [orgJson, setOrgJson] = useState('');

  const { data } = useQuery({
    queryKey: ['seo-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      return data as SettingsRow | null;
    },
  });

  useEffect(() => {
    if (data) {
      setSiteName(data.site_name ?? '');
      setTitleSuffix(data.default_title_suffix ?? '');
      setDefaultDesc(data.default_description ?? '');
      setDefaultImg(data.default_og_image ?? '');
      setOrgJson(JSON.stringify(data.organization_jsonld ?? {}, null, 2));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      let parsedJson: any = {};
      try { parsedJson = orgJson ? JSON.parse(orgJson) : {}; }
      catch { throw new Error('Organisation JSON-LD is not valid JSON'); }
      const { error } = await supabase
        .from('seo_settings')
        .update({
          site_name: siteName,
          default_title_suffix: titleSuffix || null,
          default_description: defaultDesc || null,
          default_og_image: defaultImg || null,
          organization_jsonld: parsedJson,
        })
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Saved' });
      qc.invalidateQueries({ queryKey: ['seo-settings'] });
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  return (
    <ManagementLayout>
      <div className="p-3 md:p-6 space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/management/seo" className="text-sm text-muted-foreground hover:underline">
              ← All pages
            </Link>
            <h1 className="font-display uppercase tracking-tight text-2xl md:text-3xl font-black mt-1">
              SEO Settings
            </h1>
            <p className="font-cb-sans text-muted-foreground mt-1">
              Defaults used when a page doesn't set its own.
            </p>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? 'Saving…' : 'Save'}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="font-display uppercase tracking-wide text-base">Site defaults</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="font-cb-sans">Site name</Label>
              <Input value={siteName} onChange={e => setSiteName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="font-cb-sans">Title suffix</Label>
              <Input
                value={titleSuffix}
                onChange={e => setTitleSuffix(e.target.value)}
                placeholder="| Crazy Bear"
                className="mt-1"
              />
              <div className="text-xs text-muted-foreground mt-1">Appended to page titles where useful.</div>
            </div>
            <div>
              <Label className="font-cb-sans">Default description</Label>
              <Textarea
                value={defaultDesc}
                onChange={e => setDefaultDesc(e.target.value)}
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-cb-sans">Default sharing image</Label>
              <Input
                value={defaultImg}
                onChange={e => setDefaultImg(e.target.value)}
                placeholder="/brand/og-default.jpg"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="font-display uppercase tracking-wide text-base">Organisation schema (advanced)</CardTitle></CardHeader>
          <CardContent>
            <Label className="font-cb-sans">Organisation JSON-LD</Label>
            <Textarea
              value={orgJson}
              onChange={e => setOrgJson(e.target.value)}
              rows={10}
              className="mt-1 font-mono text-xs"
              placeholder='{"@context":"https://schema.org","@type":"Organization","name":"Crazy Bear"}'
            />
            <div className="text-xs text-muted-foreground mt-1">
              Helps Google understand your brand. Leave empty if unsure.
            </div>
          </CardContent>
        </Card>
      </div>
    </ManagementLayout>
  );
}
