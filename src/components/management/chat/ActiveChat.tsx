import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body_text: string;
  reply_to_message_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  sender_name?: string;
  sender_role?: string;
  attachments?: any[];
  read_by?: Array<{
    user_id: string;
    user_name: string;
    read_at: string;
  }>;
}

interface ActiveChatProps {
  chatId: string;
  onBack?: () => void;
}

export const ActiveChat = ({ chatId, onBack }: ActiveChatProps) => {
  const { managementUser } = useManagementAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [chatMembers, setChatMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !managementUser?.user.id) return;

    loadChat();
    loadMessages();
    loadChatMembers();

    // Subscribe to new messages
    const messagesChannel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          loadUserInfo(payload.new as Message).then((enrichedMessage) => {
            setMessages((prev) => [...prev, enrichedMessage]);
            scrollToBottom();
          });
        }
      )
      .subscribe();

    // Subscribe to read receipt updates
    const membersChannel = supabase
      .channel(`chat-members-${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_members',
          filter: `chat_id=eq.${chatId}`,
        },
        () => {
          loadChatMembers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(membersChannel);
    };
  }, [chatId, managementUser?.user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Update read status when chat members change
    if (chatMembers.length > 0 && messages.length > 0) {
      updateReadStatus();
    }
  }, [chatMembers, messages]);

  const loadChat = async () => {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();

    if (error) {
      console.error('Error loading chat:', error);
      return;
    }

    setChat(data);
  };

  const loadChatMembers = async () => {
    const { data, error } = await supabase
      .from('chat_members')
      .select('user_id, last_read_at')
      .eq('chat_id', chatId);

    if (error) {
      console.error('Error loading chat members:', error);
      return;
    }

    // Enrich with user names
    const enrichedMembers = await Promise.all(
      (data || []).map(async (member) => {
        const { data: userData } = await supabase
          .rpc('get_chat_user_info', { _user_id: member.user_id })
          .single();

        return {
          ...member,
          user_name: userData?.display_name || 'Unknown',
        };
      })
    );

    setChatMembers(enrichedMembers);
  };

  const updateReadStatus = () => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        // Skip if own message
        if (msg.sender_id === managementUser?.user.id) {
          // Calculate who has read this message
          const readBy = chatMembers
            .filter((member) => {
              if (member.user_id === msg.sender_id) return false; // Skip sender
              if (!member.last_read_at) return false;
              return new Date(member.last_read_at) >= new Date(msg.created_at);
            })
            .map((member) => ({
              user_id: member.user_id,
              user_name: member.user_name,
              read_at: member.last_read_at,
            }));

          return { ...msg, read_by: readBy };
        }
        return msg;
      })
    );
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, attachments(*)')
        .eq('chat_id', chatId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Enrich messages with user info and public URLs for attachments
      const enrichedMessages = await Promise.all(
        (data || []).map(async (msg) => {
          const userInfo = await loadUserInfo(msg);
          
          // Get public URLs for attachments
          if (msg.attachments && msg.attachments.length > 0) {
            const attachmentsWithUrls = msg.attachments.map((att: any) => {
              const { data: urlData } = supabase.storage
                .from('chat-images')
                .getPublicUrl(att.storage_path);
              
              return {
                ...att,
                url: urlData.publicUrl,
              };
            });
            
            return {
              ...userInfo,
              attachments: attachmentsWithUrls,
            };
          }
          
          return userInfo;
        })
      );

      setMessages(enrichedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserInfo = async (message: Message): Promise<Message> => {
    const { data } = await supabase
      .rpc('get_chat_user_info', { _user_id: message.sender_id })
      .single();

    return {
      ...message,
      sender_name: data?.display_name || 'Unknown',
      sender_role: data?.role || '',
    };
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (text: string, image?: File) => {
    if (!text.trim() && !image) return;

    try {
      // Upload image if present
      let storagePath = null;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${managementUser?.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('chat-images')
          .upload(filePath, image);

        if (uploadError) throw uploadError;
        storagePath = filePath;
      }

      // Insert message
      const { data: newMessage, error: messageError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: managementUser?.user.id,
          body_text: text.trim() || '[Image]',
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Insert attachment if image was uploaded
      if (storagePath) {
        await supabase.from('attachments').insert({
          message_id: newMessage.id,
          type: 'image',
          storage_path: storagePath,
          mime: image.type,
        });
      }

      // Update last_read_at
      await supabase
        .from('chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', managementUser?.user.id);

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <div className="h-full border border-border rounded-lg bg-background flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full border border-border rounded-lg bg-background flex flex-col">
      {onBack && (
        <div className="p-2 border-b border-border md:hidden">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      )}

      <ChatHeader 
        chat={chat} 
        onChatUpdated={loadChat}
        onChatDeleted={() => onBack?.()}
      />

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === managementUser?.user.id}
              isCleo={message.sender_name?.toLowerCase().includes('cleo')}
            />
          ))}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <MessageInput onSend={handleSendMessage} />
    </div>
  );
};
