import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface CMSListRow {
  id: string;
  page: string;
  section: string;
  sort_order: number;
  heading: string | null;
  body: string | null;
  meta: Record<string, any>;
  published: boolean;
  is_draft: boolean;
}

export interface CMSListSeed {
  heading?: string;
  body?: string;
  meta?: Record<string, any>;
}

export interface CMSListDisplay {
  id: string;
  heading: string;
  body: string;
  meta: Record<string, any>;
  sort_order: number;
  isDraft: boolean;
  isPersisted: boolean;
}

interface Options {
  mode?: "live" | "cms";
  fallback?: CMSListSeed[];
}

/**
 * Generic CMS list hook backed by `cms_list_items`. Mirrors useCMSFaqs:
 * - Live mode: published, non-draft rows (with bundled fallback when empty).
 * - CMS mode: drafts win, fallback shown read-only until first edit seeds the table.
 */
export const useCMSList = (page: string, section: string, opts: Options = {}) => {
  const mode = opts.mode ?? "live";
  const fallback = opts.fallback ?? [];

  const [rows, setRows] = useState<CMSListRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any)
      .from("cms_list_items")
      .select("id, page, section, sort_order, heading, body, meta, published, is_draft")
      .eq("page", page)
      .eq("section", section)
      .order("sort_order", { ascending: true });
    if (mode === "live") query = query.eq("published", true).eq("is_draft", false);
    const { data, error } = await query;
    if (error) console.warn("useCMSList fetch error", error);
    setRows((data as CMSListRow[]) ?? []);
    setLoading(false);
  }, [page, section, mode]);

  useEffect(() => { fetch(); }, [fetch]);

  const items: CMSListDisplay[] = (() => {
    const buildFromSeed = (): CMSListDisplay[] =>
      fallback.map((f, i) => ({
        id: `fallback-${i}`,
        heading: f.heading ?? "",
        body: f.body ?? "",
        meta: f.meta ?? {},
        sort_order: i,
        isDraft: false,
        isPersisted: false,
      }));

    if (mode === "cms") {
      const drafts = rows.filter((r) => r.is_draft);
      const published = rows.filter((r) => !r.is_draft && r.published);
      const source = drafts.length > 0 ? drafts : published;
      const display = source
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map<CMSListDisplay>((r) => ({
          id: r.id,
          heading: r.heading ?? "",
          body: r.body ?? "",
          meta: r.meta ?? {},
          sort_order: r.sort_order,
          isDraft: r.is_draft,
          isPersisted: true,
        }));
      return display.length === 0 ? buildFromSeed() : display;
    }
    if (rows.length === 0) return buildFromSeed();
    return rows.map<CMSListDisplay>((r) => ({
      id: r.id,
      heading: r.heading ?? "",
      body: r.body ?? "",
      meta: r.meta ?? {},
      sort_order: r.sort_order,
      isDraft: false,
      isPersisted: true,
    }));
  })();

  const notifyDraftChange = () => {
    window.dispatchEvent(
      new CustomEvent("draftContentChanged", { detail: { page, section } })
    );
  };

  const ensureSeeded = async (): Promise<CMSListRow[]> => {
    if (rows.length > 0) return rows;
    if (fallback.length === 0) return [];
    const seed = fallback.map((f, i) => ({
      page,
      section,
      heading: f.heading ?? null,
      body: f.body ?? null,
      meta: f.meta ?? {},
      sort_order: i,
      published: false,
      is_draft: true,
    }));
    const { data, error } = await (supabase as any)
      .from("cms_list_items")
      .insert(seed)
      .select("id, page, section, sort_order, heading, body, meta, published, is_draft");
    if (error) {
      console.error("CMS list seed error", error);
      return [];
    }
    const next = (data as CMSListRow[]) ?? [];
    setRows(next);
    notifyDraftChange();
    return next;
  };

  const updateItem = async (
    id: string,
    patch: Partial<Pick<CMSListRow, "heading" | "body" | "meta">>
  ) => {
    if (id.startsWith("fallback-")) {
      const seeded = await ensureSeeded();
      const idx = Number(id.split("-")[1]);
      const target = seeded[idx];
      if (!target) return;
      id = target.id;
    }
    const existing = rows.find((r) => r.id === id);
    if (existing && !existing.is_draft) {
      const { data, error } = await (supabase as any)
        .from("cms_list_items")
        .insert({
          page,
          section,
          heading: patch.heading ?? existing.heading,
          body: patch.body ?? existing.body,
          meta: patch.meta ?? existing.meta,
          sort_order: existing.sort_order,
          published: false,
          is_draft: true,
        })
        .select()
        .single();
      if (error) return console.error("CMS list draft clone error", error);
      setRows((rs) => [...rs, data as CMSListRow]);
    } else {
      const { error } = await (supabase as any)
        .from("cms_list_items")
        .update({ ...patch, is_draft: true, published: false })
        .eq("id", id);
      if (error) return console.error("CMS list update error", error);
    }
    await fetch();
    notifyDraftChange();
  };

  const addItem = async (seed?: CMSListSeed) => {
    const seeded = await ensureSeeded();
    const base = seeded.length > 0 ? seeded : rows;
    const nextOrder = base.length ? Math.max(...base.map((r) => r.sort_order)) + 1 : 0;
    const { error } = await (supabase as any)
      .from("cms_list_items")
      .insert({
        page,
        section,
        heading: seed?.heading ?? "New entry",
        body: seed?.body ?? "Tell the story.",
        meta: seed?.meta ?? {},
        sort_order: nextOrder,
        published: false,
        is_draft: true,
      });
    if (error) return console.error("CMS list add error", error);
    await fetch();
    notifyDraftChange();
  };

  const removeItem = async (id: string) => {
    if (id.startsWith("fallback-")) {
      const seeded = await ensureSeeded();
      const idx = Number(id.split("-")[1]);
      const target = seeded[idx];
      if (!target) return;
      id = target.id;
    }
    const { error } = await (supabase as any)
      .from("cms_list_items")
      .delete()
      .eq("id", id);
    if (error) return console.error("CMS list remove error", error);
    await fetch();
    notifyDraftChange();
  };

  const reorder = async (orderedIds: string[]) => {
    let working = rows;
    if (orderedIds.some((id) => id.startsWith("fallback-"))) {
      working = await ensureSeeded();
      orderedIds = orderedIds.map((id) => {
        if (!id.startsWith("fallback-")) return id;
        const idx = Number(id.split("-")[1]);
        return working[idx]?.id ?? id;
      });
    }
    await Promise.all(
      orderedIds.map((id, i) =>
        (supabase as any)
          .from("cms_list_items")
          .update({ sort_order: i, is_draft: true, published: false })
          .eq("id", id)
      )
    );
    await fetch();
    notifyDraftChange();
  };

  return { items, loading, addItem, updateItem, removeItem, reorder, refresh: fetch };
};
