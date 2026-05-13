import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useMarketingAssets, useUploadAsset, type MarketingAsset } from '@/hooks/useMarketing';
import { toast } from 'sonner';

interface Props {
  selectedIds: string[];
  selectedUrls: string[];
  onChange: (ids: string[], urls: string[]) => void;
}

export const AssetPicker = ({ selectedIds, selectedUrls, onChange }: Props) => {
  const { data: assets = [], isLoading } = useMarketingAssets();
  const upload = useUploadAsset();
  const inputRef = useRef<HTMLInputElement>(null);

  const toggle = (a: MarketingAsset) => {
    const has = selectedIds.includes(a.id);
    const ids = has ? selectedIds.filter((x) => x !== a.id) : [...selectedIds, a.id];
    const urls = has ? selectedUrls.filter((u) => u !== a.url) : [...selectedUrls, a.url];
    onChange(ids, urls);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const f of files) {
      try {
        const a = await upload.mutateAsync(f);
        onChange([...selectedIds, a.id], [...selectedUrls, a.url]);
      } catch (err: any) {
        toast.error(err.message || 'Upload failed');
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
          Media {selectedIds.length ? `- ${selectedIds.length} selected` : ''}
        </div>
        <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
          {upload.isPending ? 'Uploading...' : '+ Upload'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*,video/*"
          multiple
          onChange={handleUpload}
        />
      </div>

      {isLoading && <div className="text-xs text-muted-foreground">Loading library...</div>}

      <div className="grid grid-cols-4 gap-2 max-h-[260px] overflow-y-auto">
        {assets.map((a) => {
          const on = selectedIds.includes(a.id);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => toggle(a)}
              className={`relative aspect-square border-2 ${on ? 'border-foreground' : 'border-foreground/15 hover:border-foreground/40'}`}
            >
              {a.kind === 'video' ? (
                <video src={a.url} className="w-full h-full object-cover" muted />
              ) : (
                <img src={a.url} alt={a.alt_text || ''} className="w-full h-full object-cover" loading="lazy" />
              )}
              {on && (
                <div className="absolute top-1 right-1 bg-foreground text-background text-[10px] font-display uppercase px-1.5 py-0.5">
                  ON
                </div>
              )}
            </button>
          );
        })}
        {!isLoading && assets.length === 0 && (
          <div className="col-span-4 text-xs text-muted-foreground italic">No assets yet. Upload your first one.</div>
        )}
      </div>
    </div>
  );
};
