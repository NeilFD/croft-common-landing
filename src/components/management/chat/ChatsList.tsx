import { MessageCircle, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import type { Chat } from './ChatLayout';

interface ChatsListProps {
  chats: Chat[];
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
  loading: boolean;
}

export const ChatsList = ({ chats, selectedChatId, onSelectChat, loading }: ChatsListProps) => {
  if (loading) {
    return (
      <div className="h-full border border-border rounded-lg bg-background p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-4 bg-muted rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full border border-border rounded-lg bg-background flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-brutalist text-lg font-black uppercase tracking-wide">CHATS</h2>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground font-industrial">No chats yet</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={cn(
                  "w-full p-3 rounded-lg mb-1 text-left transition-all hover:bg-accent/50",
                  selectedChatId === chat.id && "bg-accent border-l-4 border-[hsl(var(--accent-pink))]"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-brutalist text-sm font-bold uppercase truncate">
                        {chat.name || 'Direct Message'}
                      </h3>
                      {chat.unread_count && chat.unread_count > 0 && (
                        <span className="bg-[hsl(var(--accent-pink))] text-white text-xs font-bold rounded-full px-2 py-0.5 flex-shrink-0">
                          {chat.unread_count}
                        </span>
                      )}
                    </div>
                    {chat.last_message && (
                      <p className="text-xs text-muted-foreground font-industrial truncate">
                        <span className="font-medium">{chat.last_message.sender_name}:</span>{' '}
                        {chat.last_message.body_text}
                      </p>
                    )}
                  </div>
                  {chat.last_message && (
                    <span className="text-xs text-muted-foreground font-industrial flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(chat.last_message.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
