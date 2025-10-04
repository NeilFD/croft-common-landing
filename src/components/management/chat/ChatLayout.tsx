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
      const userId = managementUser.user.id;

      // 1) Chats the user is a member of (with last_read_at for unread calc)
      const { data: memberRows, error: membersError } = await supabase
        .from('chat_members')
        .select('chat_id, last_read_at, chats(*)')
        .eq('user_id', userId);
      if (membersError) throw membersError;

      // 2) System chats visible to management (even without explicit membership)
      let systemChats: any[] = [];
      if (managementUser.role) {
        const { data: sysChats, error: sysErr } = await supabase
          .from('chats')
          .select('*')
          .eq('is_system', true);
        if (sysErr) {
          console.warn('System chats fetch failed:', sysErr);
        } else {
          systemChats = sysChats || [];
        }
      }

      // Merge member chats and system chats (dedupe by id)
      const byId: Record<string, any> = {};
      (memberRows || []).forEach((row: any) => {
        byId[row.chats.id] = { ...row.chats, last_read_at: row.last_read_at };
      });
      systemChats.forEach((c: any) => {
        if (!byId[c.id]) byId[c.id] = c;
      });
      const mergedChats: any[] = Object.values(byId);

      // Get last message and unread count for each chat
      const chatsWithMessages = await Promise.all(
        mergedChats.map(async (chat: any) => {
          // Last message
          const { data: lastMessage } = await supabase
            .from('messages')
            .select('body_text, created_at, sender_id')
            .eq('chat_id', chat.id)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          // Sender name (if any)
          let senderName = '';
          if (lastMessage) {
            const { data: senderInfo } = await supabase
              .rpc('get_chat_user_info', { _user_id: lastMessage.sender_id })
              .single();
            senderName = senderInfo?.display_name || 'Unknown';
          }

          // Unread count only when we have last_read_at (membership present)
          let unread_count = 0;
          if ((chat as any).last_read_at) {
            const { count } = await supabase
              .from('messages')
              .select('id', { count: 'exact', head: true })
              .eq('chat_id', chat.id)
              .neq('sender_id', userId)
              .is('deleted_at', null)
              .gt('created_at', (chat as any).last_read_at);
            unread_count = count || 0;
          }

          return {
            ...chat,
            unread_count,
            last_message: lastMessage
              ? {
                  body_text: lastMessage.body_text,
                  created_at: lastMessage.created_at,
                  sender_name: senderName,
                }
              : undefined,
          } as Chat;
        })
      );

      // Sort by updated_at
      chatsWithMessages.sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setChats(chatsWithMessages);
      
      // Auto-select first chat if none selected
      if (!selectedChatId && chatsWithMessages.length > 0) {
        setSelectedChatId(chatsWithMessages[0].id);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mobile view: show only list or only chat
  if (isMobile) {
    return (
      <div className="-m-6 h-[calc(100vh-4rem)] flex flex-col">
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
    <div className="-mr-6 -mb-6 -mt-4 md:-mr-8 md:-mb-8 md:-mt-6 lg:-mr-12 lg:-mb-12 lg:-mt-10 ml-0 h-[calc(100vh-8rem)] flex gap-4">
      <div className="w-72 flex-shrink-0">
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
