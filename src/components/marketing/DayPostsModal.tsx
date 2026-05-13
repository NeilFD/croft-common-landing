import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CHANNEL_META } from './channelMeta';
import { STATUS_LABELS, type MarketingPost } from '@/lib/marketing/types';

interface Props {
  open: boolean;
  date: Date | null;
  posts: MarketingPost[];
  onClose: () => void;
  onOpenPost: (id: string) => void;
  onCreate: (date: Date) => void;
}

const STATUS_DOT: Record<string, string> = {
  draft: 'bg-muted-foreground',
  in_review: 'bg-yellow-500',
  approved: 'bg-blue-500',
  scheduled: 'bg-[hsl(var(--accent-pink))]',
  published: 'bg-green-600',
  archived: 'bg-muted',
};

const PostThumb = ({ post, onClick }: { post: MarketingPost; onClick: () => void }) => {
  const time = post.scheduled_at ? format(new Date(post.scheduled_at), 'HH:mm') : '';
  const img = post.asset_urls?.[0];
  const hashtags = post.hashtags || [];
  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-background border-2 border-foreground/10 hover:border-foreground hover:shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all overflow-hidden"
    >
      <div className="aspect-[16/10] bg-foreground/5 relative overflow-hidden">
        {img ? (
          <img src={img} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] font-display uppercase tracking-wider text-muted-foreground">
            No image
          </div>
        )}
        {time && (
          <div className="absolute top-2 left-2 bg-foreground text-background text-[10px] font-display uppercase tracking-wider px-1.5 py-0.5">
            {time}
          </div>
        )}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          <span className={`inline-block w-2 h-2 rounded-full ${STATUS_DOT[post.status] ?? 'bg-foreground'}`} />
          <span className="bg-background/90 text-[9px] font-display uppercase tracking-wider px-1 py-0.5">
            {STATUS_LABELS[post.status]}
          </span>
        </div>
      </div>
      <div className="p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {(post.channels || []).map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1 text-[9px] font-display uppercase tracking-wider px-1.5 py-0.5 border border-foreground/20"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: CHANNEL_META[c]?.color }} />
              {CHANNEL_META[c]?.label}
            </span>
          ))}
        </div>
        <div className="font-display uppercase text-sm leading-tight line-clamp-1">
          {post.title || 'Untitled'}
        </div>
        {post.body && (
          <div className="text-xs text-muted-foreground line-clamp-2 whitespace-pre-wrap">
            {post.body}
          </div>
        )}
        {hashtags.length > 0 && (
          <div className="text-[11px] text-blue-700 line-clamp-1">
            {hashtags.map((h) => `#${h}`).join(' ')}
          </div>
        )}
      </div>
    </button>
  );
};

export const DayPostsModal = ({ open, date, posts, onClose, onOpenPost, onCreate }: Props) => {
  if (!date) return null;
  const dayPosts = posts
    .filter((p) => p.scheduled_at)
    .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime());

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-0 bg-background">
        <DialogHeader className="px-6 py-4 border-b-2 border-foreground sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                {format(date, 'EEEE')}
              </div>
              <DialogTitle className="font-display uppercase text-2xl">
                {format(date, 'd MMMM yyyy')}
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-display uppercase">
                {dayPosts.length} {dayPosts.length === 1 ? 'post' : 'posts'}
              </Badge>
              <Button onClick={() => { onCreate(date); onClose(); }}>+ New post</Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          {dayPosts.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-foreground/20">
              <div className="font-display uppercase text-lg mb-1">Nothing scheduled</div>
              <div className="text-sm text-muted-foreground mb-4">No posts planned for this day yet.</div>
              <Button onClick={() => { onCreate(date); onClose(); }}>+ Create the first one</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dayPosts.map((p) => (
                <PostThumb
                  key={p.id}
                  post={p}
                  onClick={() => { onOpenPost(p.id); onClose(); }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
