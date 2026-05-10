import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Upload, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";
import {
  cmsImageRegistry,
  allPagesWithAssets,
  slotsForPage,
  findSlot,
  type AssetSlot,
} from "@/data/cmsImageRegistry";

interface DbRow {
  id: string;
  page: string;
  slot: string | null;
  section: string;
  image_url: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number | null;
  published: boolean | null;
  is_draft: boolean | null;
}

const useSlotRows = (page: string, slot: string) => {
  const [rows, setRows] = useState<DbRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("cms_images")
      .select("id, page, slot, section, image_url, alt_text, caption, sort_order, published, is_draft")
      .eq("page", page)
      .eq("slot", slot)
      .order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data as DbRow[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, [page, slot]);
  return { rows, loading, refresh };
};

const SlotEditor = ({ slot }: { slot: AssetSlot }) => {
  const { user } = useAuth();
  const { rows, loading, refresh } = useSlotRows(slot.page, slot.slot);

  // Drafts override published view
  const drafts = rows.filter((r) => r.is_draft || !r.published);
  const published = rows.filter((r) => r.published && !r.is_draft);
  const hasDrafts = drafts.length > 0;
  const display = hasDrafts ? drafts : published;

  // Fall back to bundled defaults so admins see what's currently live
  const showingDefaults = display.length === 0;
  const items = showingDefaults
    ? slot.defaults.map((d, i) => ({
        id: `default-${i}`,
        page: slot.page,
        slot: slot.slot,
        section: slot.slot,
        image_url: d.src,
        alt_text: d.alt ?? null,
        caption: d.caption ?? null,
        sort_order: i,
        published: true,
        is_draft: false,
        _isDefault: true,
      } as DbRow & { _isDefault: boolean }))
    : display.map((r) => ({ ...r, _isDefault: false }));

  const handleUpload = async (files: FileList | null) => {
    if (!files || !user) return;
    const isReplacingDefaults = showingDefaults;
    let nextOrder = items.length;

    // First upload: if this is a hero (single), and we currently have defaults,
    // we just add a new draft row that will replace.
    for (const file of Array.from(files)) {
      try {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${slot.page}/${slot.slot}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("cms-assets").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("cms-assets").getPublicUrl(path);

        // For hero (single), only ever one draft — clear other drafts first
        if (slot.kind === "hero") {
          await (supabase as any)
            .from("cms_images")
            .delete()
            .eq("page", slot.page)
            .eq("slot", slot.slot)
            .eq("is_draft", true);
        }

        const { error: insErr } = await (supabase as any)
          .from("cms_images")
          .insert({
            page: slot.page,
            slot: slot.slot,
            section: slot.slot,
            image_url: pub.publicUrl,
            alt_text: file.name.replace(/\.[^/.]+$/, ""),
            caption: null,
            sort_order: slot.kind === "hero" ? 0 : nextOrder++,
            published: false,
            is_draft: true,
          });
        if (insErr) throw insErr;
      } catch (e: any) {
        toast.error(e.message ?? "Upload failed");
      }
    }

    // If this slot has published rows but no drafts yet, we also need to clone them
    // as drafts so publish replaces them. Simpler approach: when publishing we
    // delete published of this slot before flipping drafts.
    void isReplacingDefaults;
    await refresh();
    window.dispatchEvent(new CustomEvent("draftContentChanged", { detail: { page: slot.page, section: slot.slot } }));
    toast.success("Uploaded as draft");
  };

  const updateRow = async (id: string, patch: Partial<DbRow>) => {
    const { error } = await (supabase as any).from("cms_images").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
  };

  const deleteRow = async (id: string) => {
    if (!confirm("Delete this image?")) return;
    const { error } = await (supabase as any).from("cms_images").delete().eq("id", id);
    if (error) return toast.error(error.message);
    await refresh();
    window.dispatchEvent(new CustomEvent("draftContentChanged", { detail: { page: slot.page, section: slot.slot } }));
  };

  const persistOrder = async (ordered: typeof items) => {
    // Write sequential sort_order for every non-default row
    await Promise.all(
      ordered.map((r, i) =>
        (r as any)._isDefault
          ? Promise.resolve()
          : (supabase as any).from("cms_images").update({ sort_order: i }).eq("id", r.id)
      )
    );
    await refresh();
    window.dispatchEvent(new CustomEvent("draftContentChanged", { detail: { page: slot.page, section: slot.slot } }));
  };

  const move = async (id: string, dir: -1 | 1) => {
    const idx = items.findIndex((r) => r.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    if ((items[idx] as any)._isDefault || (items[swapIdx] as any)._isDefault) {
      toast.error("Upload images first to reorder");
      return;
    }
    const next = [...items];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    await persistOrder(next);
  };

  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDrop = async (targetId: string) => {
    const fromId = dragId;
    setDragId(null);
    setOverId(null);
    if (!fromId || fromId === targetId) return;
    const fromIdx = items.findIndex((r) => r.id === fromId);
    const toIdx = items.findIndex((r) => r.id === targetId);
    if (fromIdx < 0 || toIdx < 0) return;
    if ((items[fromIdx] as any)._isDefault) {
      toast.error("Upload images first to reorder");
      return;
    }
    const next = [...items];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    await persistOrder(next);
  };

  const publishSlot = async () => {
    // Delete current published rows for this slot, then flip drafts to published.
    const { error: delErr } = await (supabase as any)
      .from("cms_images")
      .delete()
      .eq("page", slot.page)
      .eq("slot", slot.slot)
      .eq("published", true)
      .eq("is_draft", false);
    if (delErr) return toast.error(delErr.message);
    const { error: upErr } = await (supabase as any)
      .from("cms_images")
      .update({ published: true, is_draft: false })
      .eq("page", slot.page)
      .eq("slot", slot.slot)
      .eq("is_draft", true);
    if (upErr) return toast.error(upErr.message);
    toast.success("Published");
    await refresh();
    window.dispatchEvent(new CustomEvent("draftContentChanged", { detail: { page: slot.page, section: slot.slot } }));
  };

  const discardDrafts = async () => {
    const { error } = await (supabase as any)
      .from("cms_images")
      .delete()
      .eq("page", slot.page)
      .eq("slot", slot.slot)
      .eq("is_draft", true);
    if (error) return toast.error(error.message);
    toast.success("Drafts discarded");
    await refresh();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="text-base">{slot.label}</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {slot.page} · {slot.slot} · {slot.kind}
            {hasDrafts && <Badge variant="secondary" className="ml-2">Draft</Badge>}
            {showingDefaults && <Badge variant="outline" className="ml-2">Using bundled defaults</Badge>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              multiple={slot.kind !== "hero"}
              className="hidden"
              onChange={(e) => handleUpload(e.target.files)}
            />
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border text-sm hover:bg-accent">
              <Upload className="h-4 w-4" />
              {slot.kind === "hero" ? "Replace" : "Add"}
            </span>
          </label>
          {hasDrafts && (
            <>
              <Button size="sm" variant="outline" onClick={discardDrafts}>Discard drafts</Button>
              <Button size="sm" onClick={publishSlot}>Publish</Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading…</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((r, i) => (
              <div key={r.id} className="space-y-2">
                <div className="aspect-video bg-muted rounded overflow-hidden relative">
                  <img src={r.image_url} alt={r.alt_text ?? ""} className="w-full h-full object-cover" />
                  <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/70 text-white">#{i + 1}</span>
                </div>
                {!(r as any)._isDefault && (
                  <>
                    <Input
                      defaultValue={r.alt_text ?? ""}
                      placeholder="Alt text"
                      className="h-8 text-xs"
                      onBlur={(e) => e.target.value !== (r.alt_text ?? "") && updateRow(r.id, { alt_text: e.target.value })}
                    />
                    {slot.kind === "gallery" && (
                      <Input
                        defaultValue={r.caption ?? ""}
                        placeholder="Caption"
                        className="h-8 text-xs"
                        onBlur={(e) => e.target.value !== (r.caption ?? "") && updateRow(r.id, { caption: e.target.value })}
                      />
                    )}
                    <div className="flex items-center gap-1">
                      {slot.kind !== "hero" && (
                        <>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => move(r.id, -1)}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => move(r.id, 1)}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                      <Button size="icon" variant="outline" className="h-7 w-7 ml-auto" onClick={() => deleteRow(r.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full text-sm text-muted-foreground flex items-center gap-2">
                <ImageIcon className="h-4 w-4" /> No images yet — upload one above.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const AssetsManager = () => {
  const pages = allPagesWithAssets();
  const [page, setPage] = useState<string>(pages[0]);
  const slots = slotsForPage(page);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage every image used on the public site. Pick a page, replace heroes,
            add or reorder carousel slides, edit gallery captions, then publish.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Page</span>
            <Select value={page} onValueChange={setPage}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pages.map((p) => (
                  <SelectItem key={p} value={p}>/{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">{slots.length} slot{slots.length === 1 ? "" : "s"}</span>
          </div>
        </CardContent>
      </Card>

      {slots.map((s) => (
        <SlotEditor key={`${s.page}::${s.slot}`} slot={s} />
      ))}
    </div>
  );
};

export default AssetsManager;
