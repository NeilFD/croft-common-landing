import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { findSlot } from "@/data/cmsImageRegistry";

export interface CMSAsset {
  id?: string;
  src: string;
  alt?: string;
  caption?: string;
  sort_order?: number;
}

/**
 * Read assets for (page, slot).
 * - On the live site: returns published rows only.
 * - In the CMS visual editor (URL contains /cms/visual): returns drafts merged
 *   over published, so previews reflect unsaved work.
 * - Falls back to bundled defaults from the registry if no rows exist.
 */
export const useCMSAssets = (page: string, slot: string) => {
  const includeDrafts =
    typeof window !== "undefined" &&
    window.location.pathname.includes("/cms/visual");

  const { data, isLoading } = useQuery({
    queryKey: ["cms-assets", page, slot, includeDrafts],
    queryFn: async (): Promise<CMSAsset[]> => {
      const { data, error } = await (supabase as any)
        .from("cms_images")
        .select("id, image_url, alt_text, caption, sort_order, published, is_draft")
        .eq("page", page)
        .eq("slot", slot)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      const rows = data ?? [];

      let chosen = rows;
      if (includeDrafts) {
        // Drafts override published of the same slot when present
        const drafts = rows.filter((r: any) => r.is_draft || !r.published);
        if (drafts.length > 0) chosen = drafts;
        else chosen = rows.filter((r: any) => r.published);
      } else {
        chosen = rows.filter((r: any) => r.published);
      }

      if (chosen.length === 0) return [];
      return chosen.map((r: any) => ({
        id: r.id,
        src: r.image_url,
        alt: r.alt_text ?? undefined,
        caption: r.caption ?? undefined,
        sort_order: r.sort_order ?? 0,
      }));
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const fromCms = data ?? [];
  if (fromCms.length > 0) return { assets: fromCms, loading: isLoading, source: "cms" as const };

  const slotDef = findSlot(page, slot);
  const defaults: CMSAsset[] = (slotDef?.defaults ?? []).map((d, i) => ({
    src: d.src,
    alt: d.alt,
    caption: d.caption,
    sort_order: i,
  }));
  return { assets: defaults, loading: isLoading, source: "default" as const };
};
