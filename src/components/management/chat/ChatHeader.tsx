import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatHeaderProps {
  chat: {
    name: string | null;
    type: 'dm' | 'group';
    is_system: boolean;
  } | null;
}

export const ChatHeader = ({ chat }: ChatHeaderProps) => {
  if (!chat) return null;

  return (
    <div className="p-4 border-b border-border">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-brutalist text-lg font-black uppercase tracking-wide">
            {chat.name || 'Direct Message'}
          </h2>
          {chat.is_system && (
            <p className="text-xs text-muted-foreground font-industrial">System Chat</p>
          )}
        </div>
        {!chat.is_system && (
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
