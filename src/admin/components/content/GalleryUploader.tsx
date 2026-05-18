import { useCallback, useState } from "react";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  label?: string;
  folder: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

const BUCKET = "cb-content";

export const GalleryUploader = ({ label = "Gallery", folder, value, onChange }: Props) => {
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setUploading(true);
      const next = [...value];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "31536000",
          contentType: file.type,
        });
        if (error) {
          toast({ title: "Upload failed", description: error.message, variant: "destructive" });
          continue;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        next.push(data.publicUrl);
      }
      setUploading(false);
      onChange(next);
    },
    [folder, value, onChange],
  );

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...value];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid grid-cols-3 gap-2">
        {value.map((url, idx) => (
          <div key={url} className="relative aspect-square overflow-hidden rounded border bg-muted">
            <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute top-1 right-1 flex gap-1">
              <button
                type="button"
                onClick={() => move(idx, -1)}
                className="bg-background/95 px-1.5 text-xs rounded border"
                title="Move up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(idx, 1)}
                className="bg-background/95 px-1.5 text-xs rounded border"
                title="Move down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(url)}
                className="bg-background/95 px-1.5 text-xs rounded border text-destructive"
                title="Remove"
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <label className="aspect-square flex flex-col items-center justify-center cursor-pointer text-center border-2 border-dashed rounded text-xs text-muted-foreground hover:border-primary hover:bg-primary/5 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              void handleFiles(e.target.files);
              e.currentTarget.value = "";
            }}
          />
          <span>{uploading ? "Uploading…" : "+ Add images"}</span>
        </label>
      </div>
    </div>
  );
};

export const estimateReadingMinutes = (html: string): number => {
  const words = html.replace(/<[^>]+>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

export default GalleryUploader;
