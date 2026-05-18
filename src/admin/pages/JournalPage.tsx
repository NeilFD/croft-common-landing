import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/admin/components/content/RichTextEditor";
import ImageDropzone from "@/admin/components/content/ImageDropzone";
import SeoFields from "@/admin/components/content/SeoFields";
import AiAssistPanel from "@/admin/components/content/AiAssistPanel";
import { estimateReadingMinutes } from "@/admin/components/content/GalleryUploader";

type JournalRow = {
  id?: string;
  title: string;
  subtitle: string | null;
  slug: string;
  excerpt: string | null;
  body: string | null;
  hero_url: string | null;
  author: string | null;
  tags: string[];
  site_scope: "both" | "town" | "country";
  published: boolean;
  published_at: string | null;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  reading_minutes: number | null;
};

const empty: JournalRow = {
  title: "",
  subtitle: "",
  slug: "",
  excerpt: "",
  body: "",
  hero_url: null,
  author: "",
  tags: [],
  site_scope: "both",
  published: false,
  published_at: null,
  sort_order: 0,
  seo_title: "",
  seo_description: "",
  og_image_url: null,
  reading_minutes: null,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const JournalPage = () => {
  const [rows, setRows] = useState<JournalRow[]>([]);
  const [editing, setEditing] = useState<JournalRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cb_journal_posts" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to load posts", description: error.message, variant: "destructive" });
      return;
    }
    setRows(((data ?? []) as unknown) as JournalRow[]);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    const slug = editing.slug.trim() || slugify(editing.title);
    const reading = editing.reading_minutes ?? (editing.body ? estimateReadingMinutes(editing.body) : null);
    setSaving(true);
    const payload: any = {
      ...editing,
      slug,
      subtitle: editing.subtitle || null,
      excerpt: editing.excerpt || null,
      body: editing.body || null,
      author: editing.author || null,
      published_at: editing.published_at || null,
      tags: editing.tags ?? [],
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      reading_minutes: reading,
    };
    const { error } = editing.id
      ? await supabase.from("cb_journal_posts" as any).update(payload).eq("id", editing.id)
      : await supabase.from("cb_journal_posts" as any).insert(payload);
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Saved" });
    setEditing(null);
    setTagInput("");
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("cb_journal_posts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const addTag = () => {
    if (!editing) return;
    const t = tagInput.trim();
    if (!t || editing.tags.includes(t)) return;
    setEditing({ ...editing, tags: [...editing.tags, t] });
    setTagInput("");
  };
  const removeTag = (t: string) => {
    if (!editing) return;
    setEditing({ ...editing, tags: editing.tags.filter((x) => x !== t) });
  };

  if (editing) {
    const folder = `journal/${editing.slug || "new"}`;
    const liveReadingMins = editing.body ? estimateReadingMinutes(editing.body) : 0;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{editing.id ? "Edit post" : "New post"}</h1>
            <p className="text-xs text-muted-foreground mt-1">/journal · {liveReadingMins} min read</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditing(null); setTagInput(""); }}>Cancel</Button>
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
                placeholder="A long lunch at the Country"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={editing.subtitle ?? ""}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="The standfirst, one line"
              />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                rows={2}
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                placeholder="Shown on the listing card and as the default meta description"
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <RichTextEditor
                value={editing.body ?? ""}
                onChange={(html) => setEditing({ ...editing, body: html })}
                folder={folder}
                placeholder="Open with a hook. Never a summary."
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
                  <Label className="text-xs">Author</Label>
                  <Input value={editing.author ?? ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Site scope</Label>
                  <Select value={editing.site_scope} onValueChange={(v) => setEditing({ ...editing, site_scope: v as JournalRow["site_scope"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Both</SelectItem>
                      <SelectItem value="town">Town</SelectItem>
                      <SelectItem value="country">Country</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Published at</Label>
                  <Input type="datetime-local" value={editing.published_at ?? ""} onChange={(e) => setEditing({ ...editing, published_at: e.target.value || null })} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Read mins</Label>
                    <Input
                      type="number"
                      min={0}
                      value={editing.reading_minutes ?? liveReadingMins}
                      onChange={(e) => setEditing({ ...editing, reading_minutes: Number(e.target.value) || null })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Sort</Label>
                    <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                      placeholder="Add tag, press enter"
                    />
                    <Button type="button" variant="outline" size="sm" onClick={addTag}>Add</Button>
                  </div>
                  {editing.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {editing.tags.map((t) => (
                        <button key={t} type="button" onClick={() => removeTag(t)} className="text-[10px] px-2 py-0.5 rounded-full border hover:bg-muted">
                          {t} ×
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Hero image</CardTitle></CardHeader>
              <CardContent>
                <ImageDropzone
                  label="Hero (top of the post and listing card)"
                  folder={`${folder}/hero`}
                  value={editing.hero_url}
                  onChange={(url) => setEditing({ ...editing, hero_url: url })}
                />
              </CardContent>
            </Card>

            <AiAssistPanel
              title={editing.title}
              currentBody={editing.body ?? ""}
              onInsert={(html) => setEditing({ ...editing, body: (editing.body ? editing.body + "\n" : "") + html })}
              onSeo={(seo) =>
                setEditing({
                  ...editing,
                  seo_title: seo.seo_title ?? editing.seo_title,
                  seo_description: seo.seo_description ?? editing.seo_description,
                  excerpt: seo.excerpt ?? editing.excerpt,
                })
              }
            />

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
          <h1 className="text-3xl font-bold">Journal</h1>
          <p className="text-muted-foreground mt-2">Blog posts shown on /journal. AI writing assist on the editor.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>New post</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{loading ? "Loading…" : `${rows.length} post${rows.length === 1 ? "" : "s"}`}</CardTitle>
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
                      {r.published_at ?? "no date"} · {r.published ? "published" : "draft"} · {r.site_scope}
                      {r.reading_minutes ? ` · ${r.reading_minutes} min` : ""}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => r.id && remove(r.id)}>Delete</Button>
                </div>
              </div>
            ))}
            {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground py-6">No posts yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JournalPage;
