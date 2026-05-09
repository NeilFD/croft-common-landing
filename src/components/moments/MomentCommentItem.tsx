import React, { useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { MomentComment, Emoji } from '@/hooks/useMomentComments';
import MomentReactionBar from './MomentReactionBar';
import { cn } from '@/lib/utils';

interface Props {
  comment: MomentComment;
  myId: string | null;
  depth: number;
  onReply: (id: string, name: string) => void;
  onToggleReaction: (id: string, e: Emoji) => void;
  onEdit: (id: string, body: string) => void;
  onDelete: (id: string) => void;
}

const EDIT_WINDOW_MS = 15 * 60 * 1000;

const MomentCommentItem: React.FC<Props> = ({
  comment,
  myId,
  depth,
  onReply,
  onToggleReaction,
  onEdit,
  onDelete,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.body);
  const [collapsed, setCollapsed] = useState(false);

  const isMine = myId === comment.user_id;
  const canEdit =
    isMine &&
    !comment.is_deleted &&
    Date.now() - new Date(comment.created_at).getTime() < EDIT_WINDOW_MS;

  const indent = depth === 0 ? 0 : depth === 1 ? 16 : 16; // cap indent at level 1
  const visibleReplies = collapsed ? [] : comment.replies;

  return (
    <div
      className={cn('relative', depth > 0 && 'border-l border-white/15 pl-3')}
      style={{ marginLeft: indent }}
    >
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono text-[10px] tracking-[0.3em] uppercase text-white truncate">
            {comment.author_name}
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40">
            {formatDistanceToNowStrict(new Date(comment.created_at), { addSuffix: false })}
            {comment.updated_at !== comment.created_at && ' · edited'}
          </span>
        </div>
        {isMine && !comment.is_deleted && (
          <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.3em] uppercase text-white/40">
            {canEdit && (
              <button type="button" onClick={() => setEditing((v) => !v)} className="hover:text-white">
                {editing ? 'Cancel' : 'Edit'}
              </button>
            )}
            <button type="button" onClick={() => onDelete(comment.id)} className="hover:text-white">
              Delete
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2 mb-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 500))}
            rows={2}
            className="w-full bg-transparent border border-white/20 p-2 font-sans text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white resize-none"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                onEdit(comment.id, draft);
                setEditing(false);
              }}
              className="px-3 h-7 bg-white text-black font-mono text-[10px] tracking-[0.3em] uppercase hover:bg-black hover:text-white border border-white"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <p
          className={cn(
            'font-sans text-sm leading-snug whitespace-pre-wrap break-words mb-2',
            comment.is_deleted ? 'text-white/30 italic' : 'text-white',
          )}
        >
          {comment.is_deleted ? '[ deleted ]' : comment.body}
        </p>
      )}

      {!comment.is_deleted && (
        <div className="flex items-center gap-3 mb-3">
          <MomentReactionBar reactions={comment.reactions} onToggle={(e) => onToggleReaction(comment.id, e)} />
          {depth < 1 && (
            <button
              type="button"
              onClick={() => onReply(comment.id, comment.author_name)}
              className="font-mono text-[10px] tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors"
            >
              Reply
            </button>
          )}
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.length > 2 && (
            <button
              type="button"
              onClick={() => setCollapsed((v) => !v)}
              className="font-mono text-[9px] tracking-[0.3em] uppercase text-white/50 hover:text-white"
            >
              {collapsed ? `View ${comment.replies.length} replies` : 'Hide replies'}
            </button>
          )}
          {visibleReplies.map((child) => (
            <MomentCommentItem
              key={child.id}
              comment={child}
              myId={myId}
              depth={depth + 1}
              onReply={onReply}
              onToggleReaction={onToggleReaction}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MomentCommentItem;
