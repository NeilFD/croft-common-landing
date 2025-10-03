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
}

interface ActiveChatProps {
  chatId: string;
  onBack?: () => void;
}

export const ActiveChat = ({ chatId, onBack }: ActiveChatProps) => {
  const { managementUser } = useManagementAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chatId || !managementUser?.user.id) return;

    loadChat();
    loadMessages();

    // Subscribe to new messages
    const channel = supabase
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

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, managementUser?.user.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

      <ChatHeader chat={chat} />

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
