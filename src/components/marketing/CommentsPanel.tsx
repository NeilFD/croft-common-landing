import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMarketingComments, useAddComment, useDeleteComment } from '@/hooks/useMarketing';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { toast } from 'sonner';

interface Props {
  postId: string;
}

export const CommentsPanel = ({ postId }: Props) => {
  const { data: comments = [], isLoading } = useMarketingComments(postId);
  const add = useAddComment();
  const del = useDeleteComment();
  const { managementUser } = useManagementAuth();
  const [body, setBody] = useState('');

  const handleAdd = async () => {
    const text = body.trim();
    if (!text) return;
    const mentions = Array.from(text.matchAll(/@([\w-]+)/g)).map((m) => m[1]);
    try {
      await add.mutateAsync({ post_id: postId, body: text, mentions });
      setBody('');
    } catch (e: any) {
      toast.error(e.message || 'Could not post comment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete comment?')) return;
    try {
      await del.mutateAsync({ id, post_id: postId });
    } catch (e: any) {
      toast.error(e.message || 'Delete failed');
    }
  };

  const initial = (c: any) => {
    const f = c.author?.first_name?.[0] || '?';
    const l = c.author?.last_name?.[0] || '';
    return (f + l).toUpperCase();
  };

  return (
    <div className="space-y-3">
      <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
        Comments {comments.length ? `(${comments.length})` : ''}
      </div>

      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
        {isLoading && <div className="text-xs text-muted-foreground">Loading...</div>}
        {!isLoading && comments.length === 0 && (
          <div className="text-xs text-muted-foreground italic">Be the first to comment.</div>
        )}
        {comments.map((c) => (
          <div key={c.id} className="border border-foreground/15 p-2.5">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-foreground text-background text-[10px] font-display flex items-center justify-center">
                  {initial(c)}
                </div>
                <span className="text-xs font-medium">
                  {c.author ? `${c.author.first_name || ''} ${c.author.last_name || ''}`.trim() || 'Unknown' : 'Unknown'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}
                </span>
              </div>
              {(c.author_id === managementUser?.user.id || managementUser?.role === 'admin') && (
                <button
                  type="button"
                  onClick={() => handleDelete(c.id)}
                  className="text-[10px] uppercase text-muted-foreground hover:text-foreground"
                >
                  Delete
                </button>
              )}
            </div>
            <div className="text-sm whitespace-pre-wrap">{c.body}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Leave a comment, use @ to mention"
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={add.isPending || !body.trim()}>
            Post
          </Button>
        </div>
      </div>
    </div>
  );
};
