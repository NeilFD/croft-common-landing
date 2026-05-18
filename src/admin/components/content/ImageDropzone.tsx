import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  label?: string;
  folder: string;
  value: string | null;
  onChange: (url: string | null) => void;
  aspect?: string;
}

const BUCKET = "cb-content";

export const ImageDropzone = ({ label = "Image", folder, value, onChange, aspect = "aspect-[16/10]" }: Props) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const upload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast({ title: "Images only", variant: "destructive" });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Max 10 MB", variant: "destructive" });
        return;
      }
      setUploading(true);
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "31536000",
        contentType: file.type,
      });
      setUploading(false);
      if (error) {
        toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        return;
      }
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      onChange(data.publicUrl);
    },
    [folder, onChange],
  );

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void upload(file);
        }}
        className={`relative ${aspect} w-full overflow-hidden border-2 border-dashed rounded-md transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"
        }`}
      >
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute bottom-2 right-2 flex gap-2">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                  }}
                />
                <span className="bg-background/95 text-foreground px-3 py-1.5 text-xs font-medium rounded-md border shadow-sm hover:bg-background">
                  Replace
                </span>
              </label>
              <button
                type="button"
                onClick={() => onChange(null)}
                className="bg-background/95 text-destructive px-3 py-1.5 text-xs font-medium rounded-md border shadow-sm hover:bg-background"
              >
                Remove
              </button>
            </div>
          </>
        ) : (
          <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer text-center p-6">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void upload(f);
              }}
            />
            <span className="text-sm font-medium">
              {uploading ? "Uploading…" : "Drop an image or click to choose"}
            </span>
            <span className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP up to 10 MB</span>
          </label>
        )}
      </div>
      {value && (
        <div className="text-[10px] text-muted-foreground truncate">{value}</div>
      )}
    </div>
  );
};

export default ImageDropzone;
