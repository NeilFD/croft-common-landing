import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: {
    id: string;
    body_text: string;
    created_at: string;
    sender_name?: string;
    sender_role?: string;
    edited_at?: string | null;
    attachments?: Array<{
      id: string;
      url: string;
      type: string;
      mime: string;
      width?: number;
      height?: number;
    }>;
    read_by?: Array<{
      user_id: string;
      user_name: string;
      read_at: string;
    }>;
  };
  isOwn: boolean;
  isCleo?: boolean;
  isCleoThinking?: boolean;
  contextMenuTrigger?: React.ReactNode;
}

// Normalise and safely parse timestamps to avoid Safari date parsing issues
function normaliseIsoTimestamp(input: string): string {
  let s = input.trim();
  // Replace space between date and time with 'T' for ISO compliance
  if (s.includes(" ")) s = s.replace(" ", "T");
  // Trim microseconds to milliseconds (Safari can choke on >3 digits)
  s = s.replace(/\.(\d{3})\d+/, ".$1");
  return s;
}

function safeParseDate(input: string | Date | null | undefined): Date | null {
  if (!input) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  try {
    const s = normaliseIsoTimestamp(String(input));
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatTimeSafe(input: string | Date | null | undefined): string {
  const d = safeParseDate(input);
  return d ? format(d, 'HH:mm') : '';
}

export const MessageBubble = ({ message, isOwn, isCleo, isCleoThinking, contextMenuTrigger }: MessageBubbleProps) => {
  const text = message.body_text ?? (message as any).body ?? '';
  
  // Auto-linkify URLs for Cleo markdown content
  const linkifyContent = (text: string) => {
    return text.replace(
      /(https?:\/\/[^\s]+)/g,
      (url) => {
        // For BEO viewer routes, show a cleaner display name
        if (url.includes('/beo/view?f=') || (url.includes('beo-documents') && url.includes('.pdf')) || url.includes('proxy-beo-pdf')) {
          return `[📄 View BEO PDF](${url})`;
        }
        return `[${url}](${url})`;
      }
    );
  };

  // Process content for better markdown rendering
  const processedContent = linkifyContent(text)
    .replace(/\n{3,}/g, '\n\n') // Replace 3+ newlines with 2
    .replace(/([^\n])\n([^\n])/g, '$1  \n$2'); // Convert single newlines to markdown line breaks
  
  // Parse mentions and URLs, render them as styled components (for non-Cleo messages)
  const renderTextWithMentions = (text: string) => {
    // Match @mentions - single word/username only (no spaces, like @Cleo or @John)
    const mentionRegex = /@([A-Za-z][A-Za-z0-9._-]{0,30})\b/g;
    // Match URLs - improved to trim trailing punctuation
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    // Split by both URLs and mentions
    const parts = text.split(/(@[A-Za-z][A-Za-z0-9._-]{0,30}\b|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, i) => {
      // Check if it's a URL
      if (urlRegex.test(part)) {
        // Trim trailing punctuation from URLs
        let url = part;
        let trailingPunct = '';
        const punctMatch = url.match(/([.,!?;:)]*)$/);
        if (punctMatch && punctMatch[1]) {
          trailingPunct = punctMatch[1];
          url = url.slice(0, -trailingPunct.length);
        }
        
        // Check if it's a BEO viewer link
        const isBeoLink = url.includes('www.croftcommontest.com') && url.includes('/beo/');
        
        return (
          <span key={i}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[hsl(var(--accent-pink))] hover:underline font-semibold"
              onClick={(e) => e.stopPropagation()}
            >
              {isBeoLink ? 'View BEO' : url}
            </a>
            {trailingPunct}
          </span>
        );
      }
      
      // Check if it's a mention (but not inside a URL) and not Cleo message
      if (mentionRegex.test(part) && !isCleo) {
        return (
          <span
            key={i}
            className="bg-[hsl(var(--accent-pink))] text-white px-1.5 py-0.5 rounded font-semibold"
          >
            {part}
          </span>
        );
      }
      
      // Regular text
      return <span key={i}>{part}</span>;
    });
  };
  const content = (
    <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[70%] md:max-w-[60%]", isOwn && "order-2")}>
        {!isOwn && (
          <div className="mb-1 text-xs font-industrial text-muted-foreground">
            <span className="font-bold">{message.sender_name}</span>
            {message.sender_role && (
              <span className="ml-1 capitalize">({message.sender_role})</span>
            )}
          </div>
        )}
        <div
          className={cn(
            "rounded-lg px-4 py-2 break-words",
            isOwn && "bg-white text-black border border-border",
            !isOwn && !isCleo && "bg-muted text-black",
            isCleo && "bg-card text-foreground border-l-4 border-[hsl(var(--accent-pink))] shadow-sm"
          )}
        >
          {isCleo && (
            <div className="text-xs font-bold uppercase tracking-wide mb-1 text-[hsl(var(--accent-pink))]">Cleo</div>
          )}
          
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 space-y-2">
              {message.attachments.map((att, idx) => (
                <img
                  key={att.id ?? `${att.url}-${idx}`}
                  src={att.url}
                  alt="Chat attachment image"
                  className="rounded-md max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => window.open(att.url, '_blank')}
                />
              ))}
            </div>
          )}
          
          {/* Show thinking indicator for Cleo when message is empty AND actively thinking */}
          {!text && isCleo && isCleoThinking ? (
            <div className="flex items-center gap-2">
              <span className="font-industrial text-sm">Cleo is thinking</span>
              <div className="flex gap-1">
                <span className="animate-bounce text-sm" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce text-sm" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce text-sm" style={{ animationDelay: '300ms' }}>.</span>
              </div>
            </div>
          ) : text && text !== '[Image]' ? (
            isCleo ? (
              <div className="text-sm font-industrial prose prose-sm max-w-none prose-headings:font-brutalist prose-strong:text-foreground prose-em:text-foreground prose-p:my-3 prose-ul:my-2 prose-li:my-1 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="whitespace-pre-wrap leading-relaxed mb-3">{children}</p>,
                    ul: ({ children }) => <ul className="space-y-1.5 ml-4 my-2">{children}</ul>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                    em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                    a: ({ href, children }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[hsl(var(--accent-pink))] hover:underline font-semibold break-all inline-block max-w-full"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {processedContent}
                </ReactMarkdown>
              </div>
            ) : (
              <div className="font-industrial text-sm whitespace-pre-wrap">
                {renderTextWithMentions(text)}
              </div>
            )
          ) : null}
          
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span>{formatTimeSafe(message.created_at)}</span>
            {message.edited_at && <span className="italic">(edited)</span>}
            
            {isOwn && !isCleo && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help">
                      {message.read_by && message.read_by.length > 0 ? (
                        <CheckCheck className="h-3 w-3 text-blue-500" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs">
                      {message.read_by && message.read_by.length > 0 ? (
                        <div>
                          <p className="font-bold mb-1">Read by:</p>
                          {message.read_by.map((reader) => (
                            <p key={reader.user_id}>
                              {reader.user_name} at {formatTimeSafe(reader.read_at)}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p>Delivered</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  return contextMenuTrigger ? contextMenuTrigger : content;
};
