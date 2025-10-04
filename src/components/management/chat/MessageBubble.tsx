import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Check, CheckCheck } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import ReactMarkdown from 'react-markdown';
import { MessageActionsMenu } from './MessageActionsMenu';

interface MessageBubbleProps {
  message: {
    id: string;
    body_text?: string;
    body?: string;
    created_at: string;
    edited_at?: string | null;
    deleted_at?: string | null;
    sender_id: string;
    sender_name?: string;
    sender_role?: string;
    reply_to_message_id?: string | null;
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
  replyToMessage?: {
    sender_name: string;
    body_text: string;
  } | null;
  isOwn?: boolean;
  isCleo?: boolean;
  isCleoThinking?: boolean;
  currentUserId?: string;
  currentUserRole?: string;
  onCopy?: () => void;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

// Normalise and safely parse timestamps to avoid Safari date parsing issues
function normaliseIsoTimestamp(input: string): string {
  let s = input.trim();
  if (s.includes(" ")) s = s.replace(" ", "T");
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

export const MessageBubble = ({ 
  message, 
  replyToMessage,
  isOwn, 
  isCleo, 
  isCleoThinking,
  currentUserId,
  currentUserRole,
  onCopy,
  onReply,
  onEdit,
  onDelete,
}: MessageBubbleProps) => {
  const text = message.body_text ?? (message as any).body ?? '';
  const isDeleted = !!message.deleted_at;
  const isEdited = !!message.edited_at;
  
  // Permissions
  const canEdit = !isCleo && !isDeleted && message.sender_id === currentUserId;
  const canDelete = !isDeleted && (message.sender_id === currentUserId || currentUserRole === 'admin');
  const canReply = !isDeleted;
  
  // Auto-linkify URLs for Cleo markdown content
  const linkifyContent = (text: string) => {
    return text.replace(
      /(https?:\/\/[^\s]+)/g,
      (url) => {
        if (url.includes('/beo/view?f=') || (url.includes('beo-documents') && url.includes('.pdf')) || url.includes('proxy-beo-pdf')) {
          return `[📄 View BEO PDF](${url})`;
        }
        return `[${url}](${url})`;
      }
    );
  };

  // Process content for better markdown rendering
  const processedContent = linkifyContent(text)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/([^\n])\n([^\n])/g, '$1  \n$2');
  
  // Parse mentions and URLs for non-Cleo messages
  const renderTextWithMentions = (text: string) => {
    const mentionRegex = /@([A-Za-z][A-Za-z0-9._-]{0,30})\b/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(/(@[A-Za-z][A-Za-z0-9._-]{0,30}\b|https?:\/\/[^\s]+)/g);
    
    return parts.map((part, i) => {
      if (urlRegex.test(part)) {
        let url = part;
        let trailingPunct = '';
        const punctMatch = url.match(/([.,!?;:)]*)$/);
        if (punctMatch && punctMatch[1]) {
          trailingPunct = punctMatch[1];
          url = url.slice(0, -trailingPunct.length);
        }
        
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
      
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div
      className={`flex gap-3 mb-4 group ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className={isCleo ? 'bg-[hsl(var(--accent-pink))]' : 'bg-muted'}>
          {isCleo ? '🤖' : (message.sender_name?.[0] || 'U')}
        </AvatarFallback>
      </Avatar>

      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
        {/* Reply preview */}
        {replyToMessage && !isDeleted && (
          <div className="text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md mb-1 max-w-full">
            <div className="font-semibold">{replyToMessage.sender_name}</div>
            <div className="truncate">{replyToMessage.body_text.slice(0, 50)}...</div>
          </div>
        )}

        <div className="flex items-start gap-2 w-full">
          <div
            className={`
              rounded-lg px-4 py-2 font-industrial flex-1
              ${isDeleted 
                ? 'bg-muted/50 text-muted-foreground italic' 
                : isOwn
                ? 'bg-[hsl(var(--accent-pink))] text-white'
                : isCleo
                ? 'bg-[hsl(var(--accent-pink))]/10 text-foreground border border-[hsl(var(--accent-pink))]/20'
                : 'bg-muted text-foreground'
              }
            `}
          >
            {!isOwn && !isCleo && (
              <div className="mb-1 text-xs font-bold">
                {message.sender_name}
                {message.sender_role && <span className="ml-1 capitalize">({message.sender_role})</span>}
              </div>
            )}
            
            {isCleo && (
              <div className="text-xs font-bold uppercase tracking-wide mb-1 text-[hsl(var(--accent-pink))]">Cleo</div>
            )}
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-2 space-y-2">
                {message.attachments.map((att, idx) => (
                  <img
                    key={att.id ?? `${att.url}-${idx}`}
                    src={att.url}
                    alt="Chat attachment"
                    className="rounded-md max-w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-90"
                    onClick={() => window.open(att.url, '_blank')}
                  />
                ))}
              </div>
            )}
            
            {isDeleted ? (
              <div className="text-sm">(deleted)</div>
            ) : isCleoThinking && !text ? (
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
              {isEdited && !isDeleted && (
                <span className="italic">(edited)</span>
              )}
              <span>{formatTimeSafe(message.created_at)}</span>
              
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
          
          {!isDeleted && (onCopy || onReply || onEdit || onDelete) && (
            <MessageActionsMenu
              canEdit={canEdit}
              canDelete={canDelete}
              canReply={canReply}
              onCopy={onCopy || (() => {})}
              onReply={onReply || (() => {})}
              onEdit={onEdit || (() => {})}
              onDelete={onDelete || (() => {})}
            />
          )}
        </div>
      </div>
    </div>
  );
};