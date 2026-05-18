import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import ImageDropzone from "./ImageDropzone";

interface Props {
  folder: string;
  seoTitle: string | null;
  seoDescription: string | null;
  ogImageUrl: string | null;
  onChange: (patch: {
    seo_title?: string | null;
    seo_description?: string | null;
    og_image_url?: string | null;
  }) => void;
}

const Counter = ({ value, max }: { value: string | null; max: number }) => {
  const len = value?.length ?? 0;
  const over = len > max;
  return (
    <span className={`text-[10px] tabular-nums ${over ? "text-destructive" : "text-muted-foreground"}`}>
      {len}/{max}
    </span>
  );
};

export const SeoFields = ({ folder, seoTitle, seoDescription, ogImageUrl, onChange }: Props) => {
  return (
    <div className="space-y-4 rounded-md border p-4 bg-muted/20">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide">SEO &amp; social</h3>
        <span className="text-[10px] text-muted-foreground">Falls back to title and hero image</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">SEO title</Label>
          <Counter value={seoTitle} max={60} />
        </div>
        <Input
          value={seoTitle ?? ""}
          onChange={(e) => onChange({ seo_title: e.target.value || null })}
          placeholder="Shown in Google results and browser tabs"
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Meta description</Label>
          <Counter value={seoDescription} max={158} />
        </div>
        <Textarea
          rows={3}
          value={seoDescription ?? ""}
          onChange={(e) => onChange({ seo_description: e.target.value || null })}
          placeholder="One sentence that makes someone click"
        />
      </div>
      <ImageDropzone
        label="Social share image (optional, 1200x630)"
        folder={`${folder}/social`}
        aspect="aspect-[1200/630]"
        value={ogImageUrl}
        onChange={(url) => onChange({ og_image_url: url })}
      />
    </div>
  );
};

export default SeoFields;
