import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

type StoryRow = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  hero_url: string | null;
  published: boolean;
  published_at: string | null;
  sort_order: number;
};

const empty: StoryRow = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  hero_url: "",
  published: false,
  published_at: null,
  sort_order: 0,
};

export const StoriesPage = () => {
  const [rows, setRows] = useState<StoryRow[]>([]);
  const [editing, setEditing] = useState<StoryRow | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cb_stories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("published_at", { ascending: false, nullsFirst: false });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to load stories", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as StoryRow[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      ...editing,
      excerpt: editing.excerpt || null,
      body: editing.body || null,
      hero_url: editing.hero_url || null,
      published_at: editing.published_at || null,
    };
    const { error } = editing.id
      ? await supabase.from("cb_stories").update(payload).eq("id", editing.id)
      : await supabase.from("cb_stories").insert(payload);
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
    const { error } = await supabase.from("cb_stories").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Stories from the Bear</h1>
          <p className="text-muted-foreground mt-2">Posts shown on /stories.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>New story</Button>
      </div>

      {editing && (
        <Card>
          <CardHeader><CardTitle>{editing.id ? "Edit story" : "New story"}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Hero image URL</Label>
                <Input value={editing.hero_url ?? ""} onChange={(e) => setEditing({ ...editing, hero_url: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Excerpt</Label>
                <Textarea rows={2} value={editing.excerpt ?? ""} onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Body (Markdown / HTML)</Label>
                <Textarea rows={12} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Published at</Label>
                <Input type="datetime-local" value={editing.published_at ?? ""} onChange={(e) => setEditing({ ...editing, published_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={editing.published} onCheckedChange={(v) => setEditing({ ...editing, published: v })} />
                <Label>Published</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={save}>Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>{loading ? "Loading..." : `${rows.length} stor${rows.length === 1 ? "y" : "ies"}`}</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.title} <span className="text-xs text-muted-foreground">/ {r.slug}</span></div>
                  <div className="text-xs text-muted-foreground">{r.published_at ?? "no date"} · {r.published ? "published" : "draft"}</div>
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
