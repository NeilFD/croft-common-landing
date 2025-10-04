import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

export const MessageBubble = ({ message, isOwn, isCleo, isCleoThinking }: MessageBubbleProps) => {
  const text = message.body_text ?? (message as any).body ?? '';
  
  // Parse mentions and URLs, render them as styled components
  const renderTextWithMentions = (text: string) => {
    if (isCleo) return text;
    
    // Match @mentions - single word/username only (no spaces, like @Cleo or @John)
    const mentionRegex = /@([A-Za-z][A-Za-z0-9._-]{0,30})\b/g;
    // Match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    
    const parts = [];
    let lastIndex = 0;
    let keyIndex = 0;
    
    // First pass: process mentions
    const mentionMatches: Array<{ start: number; end: number; text: string; isMention: boolean }> = [];
    let match;
    
    while ((match = mentionRegex.exec(text)) !== null) {
      mentionMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[0],
        isMention: true,
      });
    }
    
    // Second pass: process URLs (only in non-mention segments)
    mentionRegex.lastIndex = 0;
    while ((match = urlRegex.exec(text)) !== null) {
      // Check if this URL overlaps with any mention
      const overlaps = mentionMatches.some(m => 
        (match.index >= m.start && match.index < m.end) ||
        (match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
      );
      
      if (!overlaps) {
        mentionMatches.push({
          start: match.index,
          end: match.index + match[0].length,
          text: match[0],
          isMention: false,
        });
      }
    }
    
    // Sort all matches by position
    mentionMatches.sort((a, b) => a.start - b.start);
    
    // Render all parts
    mentionMatches.forEach((item) => {
      // Add text before this match
      if (item.start > lastIndex) {
        parts.push(
          <span key={`text-${keyIndex++}`} className="text-current">
            {text.substring(lastIndex, item.start)}
          </span>
        );
      }
      
      if (item.isMention) {
        // Render mention
        parts.push(
          <span key={`mention-${keyIndex++}`} className="inline-flex items-center rounded px-1.5 py-0.5 bg-[hsl(var(--accent-pink))] text-white font-bold mx-0.5">
            {item.text}
          </span>
        );
      } else {
        // Render URL
        parts.push(
          <a
            key={`url-${keyIndex++}`}
            href={item.text}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 transition-colors"
          >
            {item.text}
          </a>
        );
      }
      
      lastIndex = item.end;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(
        <span key={`text-${keyIndex++}`} className="text-current">
          {text.substring(lastIndex)}
        </span>
      );
    }
    
    return parts.length > 0 ? <>{parts}</> : text;
  };
  return (
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
            <div className="font-industrial text-sm whitespace-pre-wrap">
              {renderTextWithMentions(text)}
            </div>
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
};
