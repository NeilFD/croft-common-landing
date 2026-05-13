import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMarketingPost, useUpsertPost, useDeletePost } from '@/hooks/useMarketing';
import { ALL_CHANNELS, CHANNEL_META } from './channelMeta';
import { ChannelPreview } from './ChannelPreview';
import { STATUS_LABELS, STATUS_ORDER, PROPERTY_LABELS, type MarketingStatus, type PropertyTag } from '@/lib/marketing/types';
import { toast } from 'sonner';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { format } from 'date-fns';

interface Props {
  postId: string | null;
  open: boolean;
  initialDate?: Date | null;
  onClose: () => void;
}

export const PostDrawer = ({ postId, open, initialDate, onClose }: Props) => {
  const { data: post } = useMarketingPost(postId);
  const upsert = useUpsertPost();
  const del = useDeletePost();
  const { managementUser } = useManagementAuth();
  const isAdmin = managementUser?.role === 'admin';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [channels, setChannels] = useState<string[]>(['instagram']);
  const [property, setProperty] = useState<PropertyTag | ''>('');
  const [status, setStatus] = useState<MarketingStatus>('draft');
  const [previewChannel, setPreviewChannel] = useState('instagram');

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setBody(post.body || '');
      setHashtags((post.hashtags || []).join(' '));
      setScheduledAt(post.scheduled_at ? format(new Date(post.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '');
      setChannels(post.channels || []);
      setProperty((post.property_tag as PropertyTag) || '');
      setStatus(post.status);
      setPreviewChannel((post.channels && post.channels[0]) || 'instagram');
    } else if (initialDate) {
      setTitle('');
      setBody('');
      setHashtags('');
      setScheduledAt(format(initialDate, "yyyy-MM-dd'T'10:00"));
      setChannels(['instagram']);
      setProperty('');
      setStatus('draft');
      setPreviewChannel('instagram');
    }
  }, [post, initialDate, open]);

  const toggleChannel = (k: string) =>
    setChannels((prev) => (prev.includes(k) ? prev.filter((c) => c !== k) : [...prev, k]));

  const handleSave = async (newStatus?: MarketingStatus) => {
    try {
      await upsert.mutateAsync({
        id: postId || undefined,
        title: title || null,
        body: body || null,
        hashtags: hashtags.split(/\s+/).map((h) => h.replace(/^#/, '')).filter(Boolean),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        property_tag: property || null,
        status: newStatus || status,
        channels,
      });
      toast.success(postId ? 'Saved' : 'Created');
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
  };

  const handleDelete = async () => {
    if (!postId || !confirm('Delete this post?')) return;
    await del.mutateAsync(postId);
    toast.success('Deleted');
    onClose();
  };

  const charLimit = CHANNEL_META[previewChannel]?.charLimit;
  const charCount = (body + (hashtags ? ' ' + hashtags : '')).length;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-[1100px] overflow-y-auto p-0">
        <SheetHeader className="px-6 py-4 border-b border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between gap-4">
            <SheetTitle className="font-display text-xl uppercase">
              {postId ? 'Edit Post' : 'New Post'}
            </SheetTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-display uppercase">{STATUS_LABELS[status]}</Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-0">
          <div className="p-6 border-r border-foreground/10">
            <Tabs defaultValue="content">
              <TabsList>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="channels">Channels</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Title (internal)</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday brunch push" />
                </div>
                <div>
                  <Label>Body</Label>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write the post body" />
                  <div className={`text-xs mt-1 ${charLimit && charCount > charLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {charCount}{charLimit ? ` / ${charLimit}` : ''} chars ({CHANNEL_META[previewChannel]?.label})
                  </div>
                </div>
                <div>
                  <Label>Hashtags (space separated, no #)</Label>
                  <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="brunch crazybear weekend" />
                </div>
              </TabsContent>

              <TabsContent value="channels" className="space-y-3">
                <Label>Publish to</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CHANNELS.map((k) => {
                    const on = channels.includes(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => toggleChannel(k)}
                        className={`px-3 py-1.5 border-2 text-xs font-display uppercase tracking-wider transition-all ${on ? 'border-foreground bg-foreground text-background' : 'border-foreground/30 hover:border-foreground'}`}
                      >
                        <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ background: CHANNEL_META[k].color }} />
                        {CHANNEL_META[k].label}
                      </button>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <div>
                  <Label>Date & time (Europe/London)</Label>
                  <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
                </div>
              </TabsContent>

              <TabsContent value="audience" className="space-y-4">
                <div>
                  <Label>Property</Label>
                  <div className="flex gap-2 mt-1">
                    {(['town', 'country', 'group'] as PropertyTag[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setProperty(property === p ? '' : p)}
                        className={`px-3 py-1.5 border-2 text-xs font-display uppercase ${property === p ? 'border-foreground bg-foreground text-background' : 'border-foreground/30'}`}
                      >
                        {PROPERTY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-6 bg-foreground/5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {channels.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPreviewChannel(c)}
                  className={`text-[10px] font-display uppercase tracking-wider px-2 py-1 ${previewChannel === c ? 'bg-foreground text-background' : 'bg-background border border-foreground/20'}`}
                >
                  {CHANNEL_META[c]?.label}
                </button>
              ))}
            </div>
            {channels.length > 0 ? (
              <ChannelPreview
                channel={previewChannel}
                body={body}
                hashtags={hashtags.split(/\s+/).filter(Boolean)}
                imageUrl={post?.asset_urls?.[0]}
              />
            ) : (
              <div className="text-sm text-muted-foreground">Select a channel to preview</div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-foreground sticky bottom-0 bg-background flex items-center gap-2 flex-wrap">
          <Button onClick={() => handleSave()} disabled={upsert.isPending}>Save draft</Button>
          {status === 'draft' && (
            <Button variant="outline" onClick={() => handleSave('in_review')}>Request review</Button>
          )}
          {status === 'in_review' && isAdmin && (
            <Button variant="outline" onClick={() => handleSave('approved')}>Approve</Button>
          )}
          {status === 'approved' && (
            <Button variant="outline" onClick={() => handleSave('scheduled')}>Schedule</Button>
          )}
          {status === 'scheduled' && (
            <Button variant="outline" onClick={() => handleSave('published')}>Mark published</Button>
          )}
          <div className="ml-auto flex gap-2">
            {postId && isAdmin && (
              <Button variant="ghost" onClick={handleDelete} className="text-red-600">Delete</Button>
            )}
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
