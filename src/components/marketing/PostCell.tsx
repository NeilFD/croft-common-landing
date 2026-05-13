import { format } from 'date-fns';
import type { MarketingPost } from '@/lib/marketing/types';
import { CHANNEL_META } from './channelMeta';

interface Props {
  post: MarketingPost;
  onClick: () => void;
}

const STATUS_BORDER: Record<string, string> = {
  draft: 'border-l-muted-foreground',
  in_review: 'border-l-yellow-500',
  approved: 'border-l-blue-500',
  scheduled: 'border-l-[hsl(var(--accent-pink))]',
  published: 'border-l-green-600',
  archived: 'border-l-muted',
};

export const PostCell = ({ post, onClick }: Props) => {
  const channels = (post.channels || []).slice(0, 3);
  const more = (post.channels || []).length - channels.length;
  const time = post.scheduled_at ? format(new Date(post.scheduled_at), 'HH:mm') : '';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full text-left bg-background border border-foreground/10 border-l-4 ${STATUS_BORDER[post.status] ?? 'border-l-foreground'} px-2 py-1 hover:border-foreground hover:shadow-[2px_2px_0_0_hsl(var(--foreground))] transition-all`}
    >
      <div className="flex items-center gap-1 mb-0.5">
        {channels.map((c) => {
          const meta = CHANNEL_META[c];
          return (
            <span
              key={c}
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: meta?.color ?? 'hsl(var(--foreground))' }}
              title={meta?.label ?? c}
            />
          );
        })}
        {more > 0 && <span className="text-[10px] text-muted-foreground">+{more}</span>}
        {time && <span className="ml-auto text-[10px] text-muted-foreground">{time}</span>}
      </div>
      <div className="text-xs font-medium truncate">{post.title || post.body || 'Untitled'}</div>
    </button>
  );
};
