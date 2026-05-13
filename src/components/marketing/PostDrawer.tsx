import { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useMarketingPost, useUpsertPost, useDeletePost, useMarketingCampaigns } from '@/hooks/useMarketing';
import { ALL_CHANNELS, CHANNEL_META } from './channelMeta';
import { ChannelPreview } from './ChannelPreview';
import { CommentsPanel } from './CommentsPanel';
import { StatusTimeline } from './StatusTimeline';
import { AssetPicker } from './AssetPicker';
import { AiAssistButton } from './AiAssistButton';
import { STATUS_LABELS, PROPERTY_LABELS, type MarketingStatus, type PropertyTag } from '@/lib/marketing/types';
import { toast } from 'sonner';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { format } from 'date-fns';

interface Props {
  postId: string | null;
  open: boolean;
  initialDate?: Date | null;
  onClose: () => void;
}

const AUTHORISER_EMAILS = [
  'jen.needham@crazybear.co.uk',
  'neil.fincham-dukes@crazybear.co.uk',
];

export const PostDrawer = ({ postId, open, initialDate, onClose }: Props) => {
  const { data: post } = useMarketingPost(postId);
  const upsert = useUpsertPost();
  const del = useDeletePost();
  const { managementUser } = useManagementAuth();
  const isAdmin = managementUser?.role === 'admin';
  const isAuthoriser = !!managementUser?.user?.email
    && AUTHORISER_EMAILS.includes(managementUser.user.email.toLowerCase());

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [channels, setChannels] = useState<string[]>(['instagram']);
  const [property, setProperty] = useState<PropertyTag | ''>('');
  const [status, setStatus] = useState<MarketingStatus>('draft');
  const [previewChannel, setPreviewChannel] = useState('instagram');
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [assetUrls, setAssetUrls] = useState<string[]>([]);
  const [campaignId, setCampaignId] = useState<string>('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');

  const { data: campaigns = [] } = useMarketingCampaigns();

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
      const pa: any[] = (post as any).marketing_post_assets || [];
      setAssetIds(pa.map((a) => a.marketing_assets?.id).filter(Boolean));
      setAssetUrls(post.asset_urls || []);
      setCampaignId(post.campaign_id || '');
      setCtaText(post.cta_text || '');
      setCtaUrl(post.cta_url || '');
    } else if (initialDate) {
      setTitle('');
      setBody('');
      setHashtags('');
      setScheduledAt(format(initialDate, "yyyy-MM-dd'T'10:00"));
      setChannels(['instagram']);
      setProperty('');
      setStatus('draft');
      setPreviewChannel('instagram');
      setAssetIds([]);
      setAssetUrls([]);
      setCampaignId('');
      setCtaText('');
      setCtaUrl('');
    }
  }, [post, initialDate, open]);

  const toggleChannel = (k: string) =>
    setChannels((prev) => (prev.includes(k) ? prev.filter((c) => c !== k) : [...prev, k]));

  // Keep previewChannel in sync with selected channels
  useEffect(() => {
    if (channels.length === 0) return;
    if (!channels.includes(previewChannel)) {
      setPreviewChannel(channels[0]);
    }
  }, [channels, previewChannel]);

  const handleSave = async (newStatus?: MarketingStatus, opts?: { note?: string; silent?: boolean }) => {
    try {
      const newId = await upsert.mutateAsync({
        id: postId || undefined,
        title: title || null,
        body: body || null,
        hashtags: hashtags.split(/\s+/).map((h) => h.replace(/^#/, '')).filter(Boolean),
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        property_tag: property || null,
        campaign_id: campaignId || null,
        cta_text: ctaText || null,
        cta_url: ctaUrl || null,
        status: newStatus || status,
        channels,
        asset_ids: assetIds,
      });
      toast.success(postId ? 'Saved' : 'Created');
      if (newStatus) setStatus(newStatus);

      // Fire branded email to authoriser on transitions
      if (!opts?.silent && newStatus && (postId || newId)) {
        const idForNotify = postId || newId;
        if (newStatus === 'in_review') await fireNotify(idForNotify, 'review_requested');
        if (newStatus === 'approved') await fireNotify(idForNotify, 'approved');
        if (newStatus === 'rejected') await fireNotify(idForNotify, 'rejected', opts?.note);
        if (newStatus === 'changes_requested')
          await fireNotify(idForNotify, 'changes_requested', opts?.note);
      }

      if (!postId && newId) return;
      onClose();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
  };

  const fireNotify = async (id: string, action: string, note?: string) => {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.functions.invoke('marketing-review-notify', {
        body: { postId: id, action, note },
      });
    } catch (e) {
      console.warn('notify failed', e);
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
              <TabsList className="flex-wrap h-auto">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="media">Media</TabsTrigger>
                <TabsTrigger value="channels">Channels</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
                <TabsTrigger value="audience">Audience</TabsTrigger>
                <TabsTrigger value="comments" disabled={!postId}>Comments</TabsTrigger>
                <TabsTrigger value="history" disabled={!postId}>History</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Title (internal)</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Friday brunch push" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Body</Label>
                    <AiAssistButton
                      body={body}
                      channel={previewChannel}
                      onApply={(text) => setBody(text)}
                    />
                  </div>
                  <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={8} placeholder="Write the post body" />
                  <div className={`text-xs mt-1 ${charLimit && charCount > charLimit ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {charCount}{charLimit ? ` / ${charLimit}` : ''} chars ({CHANNEL_META[previewChannel]?.label})
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>Hashtags (space separated, no #)</Label>
                    <AiAssistButton
                      body={body}
                      channel={previewChannel}
                      onApply={(text) => setHashtags(text.replace(/#/g, ''))}
                    />
                  </div>
                  <Input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="brunch crazybear weekend" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>CTA text</Label>
                    <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Book now" />
                  </div>
                  <div>
                    <Label>CTA URL</Label>
                    <Input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="media">
                <AssetPicker
                  selectedIds={assetIds}
                  selectedUrls={assetUrls}
                  onChange={(ids, urls) => { setAssetIds(ids); setAssetUrls(urls); }}
                />
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
                <div>
                  <Label>Campaign</Label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full border border-foreground/20 bg-background px-3 py-2 text-sm"
                  >
                    <option value="">No campaign</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </TabsContent>

              <TabsContent value="comments">
                {postId && <CommentsPanel postId={postId} />}
              </TabsContent>

              <TabsContent value="history">
                {postId && <StatusTimeline postId={postId} />}
              </TabsContent>
            </Tabs>
          </div>

          <div className="p-6 bg-foreground/5">
            <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground mb-2">
              Preview as
            </div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {channels.length === 0 && (
                <div className="text-xs text-muted-foreground">Select a channel on the Channels tab</div>
              )}
              {channels.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setPreviewChannel(c)}
                  className={`text-[10px] font-display uppercase tracking-wider px-2 py-1 border-2 transition-all ${previewChannel === c ? 'bg-foreground text-background border-foreground' : 'bg-background border-foreground/20 hover:border-foreground'}`}
                >
                  <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: CHANNEL_META[c]?.color }} />
                  {CHANNEL_META[c]?.label}
                </button>
              ))}
            </div>
            {channels.length > 0 && channels.includes(previewChannel) ? (
              <ChannelPreview
                channel={previewChannel}
                body={body}
                hashtags={hashtags.split(/\s+/).filter(Boolean)}
                imageUrl={assetUrls[0]}
                ctaUrl={ctaUrl}
              />
            ) : null}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-foreground sticky bottom-0 bg-background flex items-center gap-2 flex-wrap">
          <Button onClick={() => handleSave()} disabled={upsert.isPending}>Save draft</Button>
          {(status === 'draft' || status === 'changes_requested' || status === 'rejected') && (
            <Button variant="outline" onClick={() => handleSave('in_review')}>Request review</Button>
          )}
          {status === 'in_review' && isAuthoriser && (
            <>
              <Button
                variant="outline"
                className="border-green-700 text-green-700 hover:bg-green-700 hover:text-white"
                onClick={() => handleSave('approved')}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                className="border-yellow-700 text-yellow-700 hover:bg-yellow-700 hover:text-white"
                onClick={() => {
                  const note = window.prompt('What needs to change? (this is sent to the author)');
                  if (note === null) return;
                  handleSave('changes_requested', { note });
                }}
              >
                Request changes
              </Button>
              <Button
                variant="outline"
                className="border-red-700 text-red-700 hover:bg-red-700 hover:text-white"
                onClick={() => {
                  const note = window.prompt('Reason for rejection? (sent to the author)');
                  if (note === null) return;
                  handleSave('rejected', { note });
                }}
              >
                Reject
              </Button>
            </>
          )}
          {status === 'in_review' && !isAuthoriser && (
            <span className="text-xs text-muted-foreground italic ml-1">
              Awaiting sign-off from Jen Needham (or Neil Fincham-Dukes)
            </span>
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
