import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { FAQ } from "@/components/seo/CBStructuredData";

export interface CMSFaqRow {
  id: string;
  page: string;
  question: string;
  answer: string | null;
  sort_order: number;
  published: boolean;
  is_draft: boolean;
}

export interface CMSFaqDisplay extends FAQ {
  id: string;
  sort_order: number;
  isDraft: boolean;
  isPersisted: boolean; // false for fallback rows
}

interface Options {
  /** "live" returns only published rows; "cms" merges drafts on top of published. */
  mode?: "live" | "cms";
  fallback?: FAQ[];
}

/**
 * Hook for FAQ content backed by `cms_faq_content`.
 * - Live mode: published rows only, falling back to bundled FAQs when empty.
 * - CMS mode: drafts override published rows so the editor sees pending edits.
 */
export const useCMSFaqs = (page: string, opts: Options = {}) => {
  const mode = opts.mode ?? "live";
  const fallback = opts.fallback ?? [];

  const [rows, setRows] = useState<CMSFaqRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = (supabase as any)
      .from("cms_faq_content")
      .select("id, page, question, answer, sort_order, published, is_draft")
      .eq("page", page)
      .order("sort_order", { ascending: true });
    if (mode === "live") query = query.eq("published", true).eq("is_draft", false);
    const { data, error } = await query;
    if (error) console.warn("useCMSFaqs fetch error", error);
    setRows((data as CMSFaqRow[]) ?? []);
    setLoading(false);
  }, [page, mode]);

  useEffect(() => { fetch(); }, [fetch]);

  // Merge drafts over published when in CMS mode (drafts win on identical sort_order key).
  const items: CMSFaqDisplay[] = (() => {
    if (mode === "cms") {
      const drafts = rows.filter((r) => r.is_draft);
      const published = rows.filter((r) => !r.is_draft && r.published);
      const hasDrafts = drafts.length > 0;
      const source = hasDrafts ? drafts : published;
      const display = source
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map<CMSFaqDisplay>((r) => ({
          id: r.id,
          question: r.question,
          answer: r.answer ?? "",
          sort_order: r.sort_order,
          isDraft: r.is_draft,
          isPersisted: true,
        }));
      // If the page has nothing yet, show the bundled fallbacks (read-only) so the editor is never blank.
      if (display.length === 0) {
        return fallback.map((f, i) => ({
          id: `fallback-${i}`,
          question: f.question,
          answer: f.answer,
          sort_order: i,
          isDraft: false,
          isPersisted: false,
        }));
      }
      return display;
    }
    // live
    if (rows.length === 0) {
      return fallback.map((f, i) => ({
        id: `fallback-${i}`,
        question: f.question,
        answer: f.answer,
        sort_order: i,
        isDraft: false,
        isPersisted: false,
      }));
    }
    return rows.map<CMSFaqDisplay>((r) => ({
      id: r.id,
      question: r.question,
      answer: r.answer ?? "",
      sort_order: r.sort_order,
      isDraft: false,
      isPersisted: true,
    }));
  })();

  /** Fired so the global Publish button knows there are FAQ drafts. */
  const notifyDraftChange = () => {
    window.dispatchEvent(
      new CustomEvent("draftContentChanged", { detail: { page, section: "faq" } })
    );
  };

  /** Promote any fallback rows to real draft rows so the page has a starting set to edit. */
  const ensureSeeded = async (): Promise<CMSFaqRow[]> => {
    if (rows.length > 0) return rows;
    if (fallback.length === 0) return [];
    const seed = fallback.map((f, i) => ({
      page,
      question: f.question,
      answer: f.answer,
      sort_order: i,
      published: false,
      is_draft: true,
    }));
    const { data, error } = await (supabase as any)
      .from("cms_faq_content")
      .insert(seed)
      .select("id, page, question, answer, sort_order, published, is_draft");
    if (error) {
      console.error("FAQ seed error", error);
      return [];
    }
    const next = (data as CMSFaqRow[]) ?? [];
    setRows(next);
    notifyDraftChange();
    return next;
  };

  const updateFaq = async (
    id: string,
    patch: Partial<Pick<CMSFaqRow, "question" | "answer">>
  ) => {
    // Editing a fallback row first seeds the table, then updates the matching seeded row.
    if (id.startsWith("fallback-")) {
      const seeded = await ensureSeeded();
      const idx = Number(id.split("-")[1]);
      const target = seeded[idx];
      if (!target) return;
      id = target.id;
    }
    // If we're updating a published row, clone it as a draft to avoid mutating live content.
    const existing = rows.find((r) => r.id === id);
    if (existing && !existing.is_draft) {
      const { data, error } = await (supabase as any)
        .from("cms_faq_content")
        .insert({
          page,
          question: patch.question ?? existing.question,
          answer: patch.answer ?? existing.answer,
          sort_order: existing.sort_order,
          published: false,
          is_draft: true,
        })
        .select()
        .single();
      if (error) return console.error("FAQ draft clone error", error);
      setRows((rs) => [...rs, data as CMSFaqRow]);
    } else {
      const { error } = await (supabase as any)
        .from("cms_faq_content")
        .update({ ...patch, is_draft: true, published: false })
        .eq("id", id);
      if (error) return console.error("FAQ update error", error);
    }
    await fetch();
    notifyDraftChange();
  };

  const addFaq = async () => {
    const seeded = await ensureSeeded();
    const base = seeded.length > 0 ? seeded : rows;
    const nextOrder = base.length ? Math.max(...base.map((r) => r.sort_order)) + 1 : 0;
    const { error } = await (supabase as any)
      .from("cms_faq_content")
      .insert({
        page,
        question: "New question",
        answer: "New answer.",
        sort_order: nextOrder,
        published: false,
        is_draft: true,
      });
    if (error) return console.error("FAQ add error", error);
    await fetch();
    notifyDraftChange();
  };

  const removeFaq = async (id: string) => {
    if (id.startsWith("fallback-")) {
      // Seed first so that "delete" on a fallback persists by deleting the corresponding seeded row.
      const seeded = await ensureSeeded();
      const idx = Number(id.split("-")[1]);
      const target = seeded[idx];
      if (!target) return;
      id = target.id;
    }
    const existing = rows.find((r) => r.id === id);
    if (existing && !existing.is_draft) {
      // Mark the published row as a draft tombstone via deletion: easier to insert a "deleted" marker?
      // Simpler approach: also delete the published row immediately. Publishing then has nothing to flip.
      const { error } = await (supabase as any)
        .from("cms_faq_content")
        .delete()
        .eq("id", id);
      if (error) return console.error("FAQ remove error", error);
    } else {
      const { error } = await (supabase as any)
        .from("cms_faq_content")
        .delete()
        .eq("id", id);
      if (error) return console.error("FAQ remove error", error);
    }
    await fetch();
    notifyDraftChange();
  };

  const reorder = async (orderedIds: string[]) => {
    // Seed first if we're reordering fallbacks
    let working = rows;
    if (orderedIds.some((id) => id.startsWith("fallback-"))) {
      working = await ensureSeeded();
      // Remap fallback ids to seeded ids
      orderedIds = orderedIds.map((id) => {
        if (!id.startsWith("fallback-")) return id;
        const idx = Number(id.split("-")[1]);
        return working[idx]?.id ?? id;
      });
    }
    await Promise.all(
      orderedIds.map((id, i) =>
        (supabase as any)
          .from("cms_faq_content")
          .update({ sort_order: i, is_draft: true, published: false })
          .eq("id", id)
      )
    );
    await fetch();
    notifyDraftChange();
  };

  return { items, loading, addFaq, updateFaq, removeFaq, reorder, refresh: fetch };
};
