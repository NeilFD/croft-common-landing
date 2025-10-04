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

export const MessageBubble = ({ message, isOwn, isCleo }: MessageBubbleProps) => {
  const text = message.body_text ?? (message as any).body ?? '';
  
  // Convert @mentions in plain text to markdown links we can style via custom renderer
  const mentionRegex = /@([A-Za-z][A-Za-z0-9.'-]*(?:\s+[A-Za-z][A-Za-z0-9.'-]*)*)/g;
  const processedText = !isCleo ? text.replace(mentionRegex, '[@$1](mention://$1)') : text;
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
            isCleo && "bg-[hsl(var(--accent-pink))] text-black relative"
          )}
        >
          {isCleo && (
            <div className="text-xs font-bold uppercase tracking-wide mb-1">Cleo</div>
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
          
          {/* Show thinking indicator for Cleo when message is empty */}
          {!text && isCleo ? (
            <div className="flex items-center gap-2">
              <span className="font-industrial text-sm">Cleo is thinking</span>
              <div className="flex gap-1">
                <span className="animate-bounce text-sm" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce text-sm" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce text-sm" style={{ animationDelay: '300ms' }}>.</span>
              </div>
            </div>
          ) : text && text !== '[Image]' ? (
            <div className="font-industrial text-sm whitespace-pre-wrap prose prose-sm max-w-none">
              <ReactMarkdown 
                components={{
                  a: ({ node, href, children, ...props }) => {
                    if (href && href.startsWith('mention://')) {
                      return (
                        <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-[hsl(var(--accent-pink))] text-white font-semibold">
                          {children}
                        </span>
                      );
                    }
                    return (
                      <a {...props} href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80" />
                    );
                  },
                }}
              >
                {processedText}
              </ReactMarkdown>
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
