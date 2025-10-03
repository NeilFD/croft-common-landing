import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { ChatsList } from './ChatsList';
import { ActiveChat } from './ActiveChat';
import { useIsMobile } from '@/hooks/use-mobile';

export interface Chat {
  id: string;
  type: 'dm' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: {
    body_text: string;
    created_at: string;
    sender_name: string;
  };
}

export const ChatLayout = () => {
  const { managementUser } = useManagementAuth();
  const isMobile = useIsMobile();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!managementUser?.user.id) return;

    loadChats();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('chat-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        () => {
          loadChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [managementUser?.user.id]);

  const loadChats = async () => {
    if (!managementUser?.user.id) return;

    try {
      // Get chats the user is a member of
      const { data: chatMembers, error: membersError } = await supabase
        .from('chat_members')
        .select('chat_id, chats(*)')
        .eq('user_id', managementUser.user.id);

      if (membersError) throw membersError;

      // Get last message for each chat
      const chatsWithMessages = await Promise.all(
        (chatMembers || []).map(async (member: any) => {
          const chat = member.chats;
          
          // Get last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('body_text, created_at, sender_id')
            .eq('chat_id', chat.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Get sender name if message exists
          let senderName = '';
          if (lastMessage) {
            const { data: senderInfo } = await supabase
              .rpc('get_chat_user_info', { _user_id: lastMessage.sender_id })
              .single();
            senderName = senderInfo?.display_name || 'Unknown';
          }

          // Get unread count
          const { data: unreadData } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .neq('sender_id', managementUser.user.id)
            .is('deleted_at', null)
            .gt('created_at', member.last_read_at || '1970-01-01');

          return {
            ...chat,
            unread_count: unreadData?.length || 0,
            last_message: lastMessage ? {
              body_text: lastMessage.body_text,
              created_at: lastMessage.created_at,
              sender_name: senderName,
            } : undefined,
          };
        })
      );

      // Sort by updated_at
      chatsWithMessages.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setChats(chatsWithMessages);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mobile view: show only list or only chat
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-16rem)] flex flex-col">
        {selectedChatId ? (
          <ActiveChat 
            chatId={selectedChatId} 
            onBack={() => setSelectedChatId(null)}
          />
        ) : (
          <ChatsList
            chats={chats}
            selectedChatId={selectedChatId}
            onSelectChat={setSelectedChatId}
            loading={loading}
            onChatsChanged={loadChats}
          />
        )}
      </div>
    );
  }

  // Desktop view: side-by-side
  return (
    <div className="h-[calc(100vh-12rem)] md:h-[calc(100vh-16rem)] flex gap-4">
      <div className="w-80 flex-shrink-0">
        <ChatsList
          chats={chats}
          selectedChatId={selectedChatId}
          onSelectChat={setSelectedChatId}
          loading={loading}
          onChatsChanged={loadChats}
        />
      </div>
      <div className="flex-1 min-w-0">
        {selectedChatId ? (
          <ActiveChat chatId={selectedChatId} />
        ) : (
          <div className="h-full flex items-center justify-center border border-border rounded-lg bg-muted/20">
            <p className="text-muted-foreground font-industrial">Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};
