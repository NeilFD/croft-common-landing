import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: {
    id: string;
    body_text: string;
    created_at: string;
    sender_name?: string;
    sender_role?: string;
    edited_at?: string | null;
  };
  isOwn: boolean;
  isCleo?: boolean;
}

export const MessageBubble = ({ message, isOwn, isCleo }: MessageBubbleProps) => {
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
          <p className="font-industrial text-sm whitespace-pre-wrap">{message.body_text}</p>
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <span>{format(new Date(message.created_at), 'HH:mm')}</span>
            {message.edited_at && <span className="italic">(edited)</span>}
          </div>
        </div>
      </div>
    </div>
  );
};
