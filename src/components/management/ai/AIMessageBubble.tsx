import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIMessageBubble = ({ role, content, timestamp }: AIMessageBubbleProps) => {
  const isUser = role === 'user';

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-foreground',
          isUser 
            ? 'bg-background' 
            : 'bg-accent-pink'
        )}
      >
        {isUser ? <User className="h-4 w-4 text-foreground" /> : <Bot className="h-4 w-4 text-foreground" />}
      </div>

      <div className={cn('flex flex-col gap-1 max-w-[80%]', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-lg px-4 py-2 border-2 border-foreground',
            isUser
              ? 'bg-background'
              : 'bg-background'
          )}
        >
          <div className="text-sm font-industrial prose prose-sm max-w-none prose-headings:font-brutalist prose-strong:text-foreground prose-em:text-foreground">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
