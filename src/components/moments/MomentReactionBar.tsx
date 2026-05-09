import React, { useState } from 'react';
import { ALLOWED_EMOJI, Emoji, CommentReactionAgg } from '@/hooks/useMomentComments';
import { cn } from '@/lib/utils';

interface Props {
  reactions: CommentReactionAgg[];
  onToggle: (emoji: Emoji) => void;
}

const MomentReactionBar: React.FC<Props> = ({ reactions, onToggle }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          type="button"
          onClick={() => onToggle(r.emoji)}
          className={cn(
            'inline-flex items-center gap-1 h-6 px-2 border font-mono text-[10px] tracking-wider transition-colors',
            r.mine
              ? 'bg-white text-black border-white'
              : 'bg-transparent text-white border-white/20 hover:border-white/60',
          )}
        >
          <span className="text-[12px] leading-none">{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex items-center justify-center h-6 px-2 border border-dashed border-white/25 hover:border-white/60 font-mono text-[10px] tracking-[0.3em] uppercase text-white/60 hover:text-white transition-colors"
          aria-label="Add reaction"
        >
          {pickerOpen ? '×' : '+'}
        </button>
        {pickerOpen && (
          <div className="absolute z-20 left-0 mt-1 flex items-center gap-1 p-1.5 bg-black border border-white/20">
            {ALLOWED_EMOJI.map((e) => {
              const mine = reactions.find((r) => r.emoji === e)?.mine;
              return (
                <button
                  key={e}
                  type="button"
                  onClick={() => {
                    onToggle(e);
                    setPickerOpen(false);
                  }}
                  className={cn(
                    'h-7 w-7 inline-flex items-center justify-center text-[15px] transition-colors',
                    mine ? 'bg-white' : 'hover:bg-white/10',
                  )}
                >
                  {e}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MomentReactionBar;
