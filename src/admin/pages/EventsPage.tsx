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

type EventRow = {
  id?: string;
  title: string;
  slug: string;
  site: string;
  starts_at: string | null;
  ends_at: string | null;
  body: string | null;
  poster_url: string | null;
  external_url: string | null;
  published: boolean;
  sort_order: number;
};

const empty: EventRow = {
  title: "",
  slug: "",
  site: "both",
  starts_at: null,
  ends_at: null,
  body: "",
  poster_url: "",
  external_url: "",
  published: false,
  sort_order: 0,
};

export const EventsPage = () => {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("cb_events")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("starts_at", { ascending: true });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to load events", description: error.message, variant: "destructive" });
      return;
    }
    setRows((data ?? []) as EventRow[]);
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!editing) return;
    const payload = {
      ...editing,
      starts_at: editing.starts_at || null,
      ends_at: editing.ends_at || null,
      poster_url: editing.poster_url || null,
      external_url: editing.external_url || null,
      body: editing.body || null,
    };
    const { error } = editing.id
      ? await supabase.from("cb_events").update(payload).eq("id", editing.id)
      : await supabase.from("cb_events").insert(payload);
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
    const { error } = await supabase.from("cb_events").delete().eq("id", id);
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
          <h1 className="text-3xl font-bold">What's Happening</h1>
          <p className="text-muted-foreground mt-2">Events shown on /whats-on across Town and Country.</p>
        </div>
        <Button onClick={() => setEditing({ ...empty })}>New event</Button>
      </div>

      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>{editing.id ? "Edit event" : "New event"}</CardTitle>
          </CardHeader>
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
              <div className="space-y-2">
                <Label>Site</Label>
                <Select value={editing.site} onValueChange={(v) => setEditing({ ...editing, site: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="town">Town</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sort order</Label>
                <Input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Starts at</Label>
                <Input type="datetime-local" value={editing.starts_at ?? ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Ends at</Label>
                <Input type="datetime-local" value={editing.ends_at ?? ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Poster URL</Label>
                <Input value={editing.poster_url ?? ""} onChange={(e) => setEditing({ ...editing, poster_url: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>External link</Label>
                <Input value={editing.external_url ?? ""} onChange={(e) => setEditing({ ...editing, external_url: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Body</Label>
                <Textarea rows={6} value={editing.body ?? ""} onChange={(e) => setEditing({ ...editing, body: e.target.value })} />
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
        <CardHeader><CardTitle>{loading ? "Loading..." : `${rows.length} event${rows.length === 1 ? "" : "s"}`}</CardTitle></CardHeader>
        <CardContent>
          <div className="divide-y">
            {rows.map((r) => (
              <div key={r.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="font-medium truncate">{r.title} <span className="text-xs text-muted-foreground">/ {r.slug}</span></div>
                  <div className="text-xs text-muted-foreground">{r.site} · {r.starts_at ?? "no date"} · {r.published ? "published" : "draft"}</div>
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
