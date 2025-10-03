import { useState } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GroupSettingsDialog } from './GroupSettingsDialog';

interface ChatHeaderProps {
  chat: {
    id: string;
    name: string | null;
    type: 'dm' | 'group';
    is_system: boolean;
  } | null;
  onChatUpdated: () => void;
  onChatDeleted: () => void;
}

export const ChatHeader = ({ chat, onChatUpdated, onChatDeleted }: ChatHeaderProps) => {
  const [showSettings, setShowSettings] = useState(false);
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
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!chat.is_system && showSettings && (
        <GroupSettingsDialog
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          chatId={chat.id}
          chatName={chat.name || 'Unnamed Chat'}
          onChatUpdated={onChatUpdated}
          onChatDeleted={onChatDeleted}
        />
      )}
    </div>
  );
};
