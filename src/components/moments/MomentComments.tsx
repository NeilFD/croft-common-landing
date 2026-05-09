import React, { useState } from 'react';
import { useMomentComments } from '@/hooks/useMomentComments';
import MomentCommentItem from './MomentCommentItem';
import MomentCommentComposer from './MomentCommentComposer';

interface Props {
  momentId: string;
}

const MomentComments: React.FC<Props> = ({ momentId }) => {
  const {
    comments,
    count,
    loading,
    myId,
    addComment,
    editComment,
    deleteComment,
    toggleReaction,
  } = useMomentComments(momentId);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-5">
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-white/60">
          Comments · {count}
        </p>

        {loading && comments.length === 0 && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-2 w-24 bg-white/10 animate-pulse" />
                <div className="h-3 w-full bg-white/5 animate-pulse" />
                <div className="h-3 w-2/3 bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!loading && comments.length === 0 && (
          <p className="font-sans text-sm text-white/40">Be first. Say something.</p>
        )}

        {comments.map((c) => (
          <MomentCommentItem
            key={c.id}
            comment={c}
            myId={myId}
            depth={0}
            onReply={(id, name) => setReplyTo({ id, name })}
            onToggleReaction={toggleReaction}
            onEdit={editComment}
            onDelete={deleteComment}
          />
        ))}
      </div>

      <MomentCommentComposer
        onSubmit={(body) => addComment(body, replyTo?.id)}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
      />
    </div>
  );
};

export default MomentComments;
