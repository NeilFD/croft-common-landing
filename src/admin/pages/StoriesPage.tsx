import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/admin/components/content/RichTextEditor";
import ImageDropzone from "@/admin/components/content/ImageDropzone";
import SeoFields from "@/admin/components/content/SeoFields";
import GalleryUploader from "@/admin/components/content/GalleryUploader";

type StoryRow = {
  id?: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  body: string | null;
  hero_url: string | null;
  gallery_urls: string[];
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  published: boolean;
  published_at: string | null;
  sort_order: number;
};

const empty: StoryRow = {
  title: "",
  subtitle: "",
  slug: "",
  excerpt: "",
  body: "",
  hero_url: null,
  gallery_urls: [],
  seo_title: "",
  seo_description: "",
  og_image_url: null,
  published: false,
  published_at: null,
  sort_order: 0,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const StoriesPage = () => {
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [editing, setEditing] = useState<StoryRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cb_stories" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to load stories", description: error.message, variant: "destructive" });
      return;
    }
    setRows(((data ?? []) as unknown) as StoryRow[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    const slug = editing.slug.trim() || slugify(editing.title);
    setSaving(true);
    const payload: any = {
      ...editing,
      slug,
      subtitle: editing.subtitle || null,
      excerpt: editing.excerpt || null,
      body: editing.body || null,
      published_at: editing.published_at || null,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      gallery_urls: editing.gallery_urls ?? [],
    };
    const { error } = editing.id
      ? await supabase.from("cb_stories" as any).update(payload).eq("id", editing.id)
      : await supabase.from("cb_stories" as any).insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this story?")) return;
    const { error } = await supabase.from("cb_stories" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  if (editing) {
    const folder = `stories/${editing.slug || "new"}`;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{editing.id ? "Edit story" : "New story"}</h1>
            <p className="text-xs text-muted-foreground mt-1">/stories</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={editing.title}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    title: e.target.value,
                    slug: editing.slug || slugify(e.target.value),
                  })
                }
                placeholder="The night the chef did karaoke"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={editing.subtitle ?? ""}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="The one-liner"
              />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                rows={2}
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                placeholder="Shown on the listing card"
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <RichTextEditor
                value={editing.body ?? ""}
                onChange={(html) => setEditing({ ...editing, body: html })}
                folder={folder}
                placeholder="Tell the story."
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-sm">Status</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
                  <Label>{editing.published ? "Published" : "Draft"}</Label>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Slug</Label>
                  <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: slugify(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Published at</Label>
                  <Input type="datetime-local" value={editing.published_at ?? ""} onChange={(e) => setEditing({ ...editing, published_at: e.target.value || null })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sort order</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Hero image</CardTitle></CardHeader>
              <CardContent>
                <ImageDropzone
                  label="Hero (top of the story)"
                  folder={`${folder}/hero`}
                  value={editing.hero_url}
                  onChange={(url) => setEditing({ ...editing, hero_url: url })}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Gallery</CardTitle></CardHeader>
              <CardContent>
                <GalleryUploader
                  label="Extra images shown below the story"
                  folder={`${folder}/gallery`}
                  value={editing.gallery_urls}
                  onChange={(urls) => setEditing({ ...editing, gallery_urls: urls })}
                />
              </CardContent>
            </Card>

            <SeoFields
              folder={folder}
              seoTitle={editing.seo_title}
              seoDescription={editing.seo_description}
              ogImageUrl={editing.og_image_url}
              onChange={(patch) => setEditing({ ...editing, ...patch })}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stories from the Bear</h1>
          <p className="text-muted-foreground mt-2">Posts shown on /stories.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>New story</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{loading ? "Loading…" : `${rows.length} stor${rows.length === 1 ? "y" : "ies"}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {r.hero_url && <img src={r.hero_url} alt="" className="h-14 w-14 object-cover rounded bg-muted" />}
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.title} <span className="text-xs text-muted-foreground">/ {r.slug}</span></div>
                    <div className="text-xs text-muted-foreground">
                      {r.published_at ?? "no date"} · {r.published ? "published" : "draft"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => r.id && remove(r.id)}>Delete</Button>
                </div>
              </div>
            ))}
            {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground py-6">No stories yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoriesPage;
