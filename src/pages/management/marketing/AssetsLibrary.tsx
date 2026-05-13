import { useRef, useState } from 'react';
import { ManagementLayout } from '@/components/management/ManagementLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMarketingAssets, useUploadAsset, useDeleteAsset } from '@/hooks/useMarketing';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { toast } from 'sonner';

const AssetsLibrary = () => {
  const { data: assets = [], isLoading } = useMarketingAssets();
  const upload = useUploadAsset();
  const del = useDeleteAsset();
  const { managementUser } = useManagementAuth();
  const isAdmin = managementUser?.role === 'admin';
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    for (const f of files) {
      try { await upload.mutateAsync(f); }
      catch (err: any) { toast.error(err.message || 'Upload failed'); }
    }
    if (files.length) toast.success(`Uploaded ${files.length} file${files.length > 1 ? 's' : ''}`);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this asset?')) return;
    try { await del.mutateAsync(id); toast.success('Deleted'); }
    catch (e: any) { toast.error(e.message || 'Delete failed'); }
  };

  const filtered = assets.filter((a) =>
    !search || (a.alt_text || '').toLowerCase().includes(search.toLowerCase()) || (a.tags || []).join(' ').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ManagementLayout>
      <div className="space-y-4">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display uppercase tracking-wider text-3xl md:text-4xl">Assets</h1>
            <p className="text-sm text-muted-foreground mt-1">Reusable images and video for marketing posts.</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search alt text or tags"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-[260px]"
            />
            <Button onClick={() => inputRef.current?.click()} disabled={upload.isPending}>
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
        </div>

        {isLoading ? (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="border border-foreground/15 p-8 text-center text-muted-foreground">
            {search ? 'No matches.' : 'No assets yet. Upload your first one.'}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filtered.map((a) => (
              <div key={a.id} className="border border-foreground/15 group relative">
                <div className="aspect-square bg-foreground/5">
                  {a.kind === 'video' ? (
                    <video src={a.url} className="w-full h-full object-cover" muted controls />
                  ) : (
                    <img src={a.url} alt={a.alt_text || ''} className="w-full h-full object-cover" loading="lazy" />
                  )}
                </div>
                <div className="p-2 flex items-center justify-between text-[10px] uppercase font-display tracking-wider">
                  <span className="text-muted-foreground">{a.kind || 'image'}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => remove(a.id)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagementLayout>
  );
};

export default AssetsLibrary;
