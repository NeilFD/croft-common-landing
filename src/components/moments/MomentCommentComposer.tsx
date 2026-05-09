import React, { useState, useRef, useEffect } from 'react';

interface Props {
  onSubmit: (body: string) => Promise<void> | void;
  replyTo?: { id: string; name: string } | null;
  onCancelReply?: () => void;
}

const MomentCommentComposer: React.FC<Props> = ({ onSubmit, replyTo, onCancelReply }) => {
  const [body, setBody] = useState('');
  const [focused, setFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyTo) ref.current?.focus();
  }, [replyTo]);

  const submit = async () => {
    const trimmed = body.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      setBody('');
      onCancelReply?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border-t border-white/10 bg-black pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] px-4 md:px-6">
      {replyTo && (
        <div className="flex items-center justify-between mb-2 font-mono text-[9px] tracking-[0.3em] uppercase text-white/60">
          <span>Replying to {replyTo.name}</span>
          <button type="button" onClick={onCancelReply} className="hover:text-white">
            Cancel
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={ref}
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, 500))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={replyTo ? 'Write a reply...' : 'Say something.'}
            className="w-full bg-transparent border-b border-white/20 focus:border-white outline-none font-sans text-sm text-white placeholder:text-white/30 py-2 resize-none"
          />
          {focused && (
            <span className="absolute right-0 -bottom-4 font-mono text-[9px] tracking-wider text-white/40">
              {body.length}/500
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={!body.trim() || submitting}
          className="px-4 h-9 bg-white text-black font-mono text-[10px] tracking-[0.4em] uppercase border border-white hover:bg-black hover:text-white transition-colors disabled:opacity-40"
        >
          Post
        </button>
      </div>
    </div>
  );
};

export default MomentCommentComposer;
