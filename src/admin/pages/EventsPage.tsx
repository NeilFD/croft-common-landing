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

type EventRow = {
  id?: string;
  title: string;
  subtitle: string | null;
  slug: string;
  site: "town" | "country" | "both";
  starts_at: string | null;
  ends_at: string | null;
  excerpt: string | null;
  body: string | null;
  poster_url: string | null;
  external_url: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  published: boolean;
  sort_order: number;
};

const empty: EventRow = {
  title: "",
  subtitle: "",
  slug: "",
  site: "both",
  starts_at: null,
  ends_at: null,
  excerpt: "",
  body: "",
  poster_url: null,
  external_url: "",
  seo_title: "",
  seo_description: "",
  og_image_url: null,
  published: false,
  sort_order: 0,
};

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const EventsPage = () => {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cb_events" as any)
      .select("*")
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to load events", description: error.message, variant: "destructive" });
      return;
    }
    setRows(((data ?? []) as unknown) as EventRow[]);
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
    setSaving(true);
    const payload: any = {
      ...editing,
      slug,
      subtitle: editing.subtitle || null,
      excerpt: editing.excerpt || null,
      body: editing.body || null,
      external_url: editing.external_url || null,
      seo_title: editing.seo_title || null,
      seo_description: editing.seo_description || null,
      starts_at: editing.starts_at || null,
      ends_at: editing.ends_at || null,
    };
    const { error } = editing.id
      ? await supabase.from("cb_events" as any).update(payload).eq("id", editing.id)
      : await supabase.from("cb_events" as any).insert(payload);
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
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("cb_events" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  if (editing) {
    const folder = `events/${editing.slug || "new"}`;
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{editing.id ? "Edit event" : "New event"}</h1>
            <p className="text-xs text-muted-foreground mt-1">/whats-on</p>
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
                placeholder="Karaoke Friday"
              />
            </div>
            <div className="space-y-2">
              <Label>Subtitle</Label>
              <Input
                value={editing.subtitle ?? ""}
                onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })}
                placeholder="Microphones, mistakes, magic"
              />
            </div>
            <div className="space-y-2">
              <Label>Excerpt</Label>
              <Textarea
                rows={2}
                value={editing.excerpt ?? ""}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                placeholder="One or two sentences shown on the listing card"
              />
            </div>
            <div className="space-y-2">
              <Label>Body</Label>
              <RichTextEditor
                value={editing.body ?? ""}
                onChange={(html) => setEditing({ ...editing, body: html })}
                folder={folder}
                placeholder="Tell the story. Set the scene."
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
                  <Label className="text-xs">Site</Label>
                  <Select value={editing.site} onValueChange={(v) => setEditing({ ...editing, site: v as EventRow["site"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="town">Town</SelectItem>
                      <SelectItem value="country">Country</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Sort order</Label>
                  <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) || 0 })} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Schedule</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-xs">Starts at</Label>
                  <Input type="datetime-local" value={editing.starts_at ?? ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value || null })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Ends at</Label>
                  <Input type="datetime-local" value={editing.ends_at ?? ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value || null })} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">External ticket / booking URL</Label>
                  <Input value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} placeholder="https://" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm">Poster image</CardTitle></CardHeader>
              <CardContent>
                <ImageDropzone
                  label="Poster (shown on cards and detail)"
                  folder={`${folder}/poster`}
                  aspect="aspect-[4/5]"
                  value={editing.poster_url}
                  onChange={(url) => setEditing({ ...editing, poster_url: url })}
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
          <h1 className="text-3xl font-bold">What's Happening</h1>
          <p className="text-muted-foreground mt-2">Events shown on /whats-on across Town and Country.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>New event</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{loading ? "Loading…" : `${rows.length} event${rows.length === 1 ? "" : "s"}`}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  {r.poster_url && (
                    <img src={r.poster_url} alt="" className="h-14 w-14 object-cover rounded bg-muted" />
                  )}
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {r.title} <span className="text-xs text-muted-foreground">/ {r.slug}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.site} · {r.starts_at ?? "no date"} · {r.published ? "published" : "draft"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditing(r)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => r.id && remove(r.id)}>Delete</Button>
                </div>
              </div>
            ))}
            {!loading && rows.length === 0 && <div className="text-sm text-muted-foreground py-6">No events yet.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EventsPage;
