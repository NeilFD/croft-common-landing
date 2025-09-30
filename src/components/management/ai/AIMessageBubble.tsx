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

  // Auto-linkify URLs in the content with shortened display text
  const linkifyContent = (text: string) => {
    return text.replace(
      /(https?:\/\/[^\s]+)/g,
      (url) => {
        // For BEO PDF links, show a cleaner display name
        if (url.includes('beo-documents') && url.includes('.pdf')) {
          return `[📄 View BEO PDF](${url})`;
        }
        // For other long URLs, show them as-is
        return `[${url}](${url})`;
      }
    );
  };

  // Process content for better line break rendering and auto-linkify URLs
  const processedContent = linkifyContent(content)
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/([^\n])\n([^\n])/g, '$1  \n$2'); // Convert single newlines to markdown line breaks

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
            'rounded-lg px-4 py-3 border-2 border-foreground',
            isUser
              ? 'bg-background'
              : 'bg-background'
          )}
        >
          <div className="text-sm font-industrial prose prose-sm max-w-none prose-headings:font-brutalist prose-strong:text-foreground prose-em:text-foreground prose-p:my-2 prose-ul:my-2 prose-li:my-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
            <ReactMarkdown
              components={{
                p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="space-y-1 ml-4">{children}</ul>,
                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                a: ({ href, children }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent-pink hover:text-accent-pink-dark underline font-medium break-all inline-block max-w-full"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {processedContent}
            </ReactMarkdown>
          </div>
        </div>
        <span className="text-xs text-muted-foreground">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
};
