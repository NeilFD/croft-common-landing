import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body_text: string;
  body?: string; // RPC returns 'body' field
  reply_to_message_id: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  is_cleo?: boolean;
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
  const [isCleoThinking, setIsCleoThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  useEffect(() => {
    if (!chatId) return;

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
            setMessages((prev) => {
              // Check if message already exists (from optimistic update)
              const exists = prev.some(msg => msg.id === enrichedMessage.id);
              if (exists) {
                return prev; // Don't add duplicate
              }
              return [...prev, enrichedMessage];
            });
            scrollToBottom();
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          // Update existing message (for Cleo streaming)
          setMessages((prev) => {
            const exists = prev.some(msg => msg.id === payload.new.id);
            if (!exists) {
              return prev; // Message doesn't exist, ignore update
            }
            return prev.map((msg) =>
              msg.id === payload.new.id ? { ...msg, body_text: (payload.new as any).body_text } : msg
            );
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
  }, [chatId]);

  useEffect(() => {
    // Only auto-scroll if:
    // 1. A new message was added (length increased)
    // 2. User is already near bottom (within 100px)
    const messageCount = messages.length;
    const isNewMessage = messageCount > prevMessageCountRef.current;
    prevMessageCountRef.current = messageCount;

    if (isNewMessage && scrollAreaRef.current) {
      const el = scrollAreaRef.current;
      const { scrollTop, scrollHeight, clientHeight } = el;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      if (isNearBottom) {
        scrollToBottom();
      }
    }
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
    setLoading(true);
    try {
      // Use security definer RPC to bypass RLS for read
      const { data: rows, error } = await supabase
        .rpc('get_chat_messages_basic', { _chat_id: chatId });

      if (error) {
        console.error('Error loading messages via RPC:', error);
        toast.error('Failed to load messages');
        return;
      }

      console.info('ActiveChat.loadMessages: messages fetched (RPC) =', (rows || []).length);

      const basicMessages: Message[] = (rows || []).map((m: any) => ({
        id: m.id,
        chat_id: m.chat_id,
        sender_id: m.sender_id,
        body_text: m.body_text ?? (m as any).body ?? '',
        reply_to_message_id: null,
        created_at: m.created_at,
        edited_at: m.edited_at,
        deleted_at: m.deleted_at,
        is_cleo: m.is_cleo ?? false,
        attachments: [],
        read_by: [],
      }));

      // Sort by created_at ascending
      const sorted = [...basicMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Enrich with sender display info
      const enriched = await Promise.all(sorted.map(loadUserInfo));
      console.info('ActiveChat.loadMessages: enriched count =', enriched.length);
      setMessages(enriched);
      
      // Scroll to bottom after messages load
      setTimeout(() => scrollToBottom(), 100);
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
    const el = scrollAreaRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  };

  const handleCleoResponse = async (userMessageText: string, chatId: string) => {
    try {
      // Show thinking indicator
      setIsCleoThinking(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      // Build conversation history for Cleo
      const conversationHistory = messages
        .slice(-10)
        .map(m => ({
          role: m.is_cleo ? 'assistant' : 'user',
          content: m.body_text,
        }));

      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessageText,
      });

      const response = await fetch(
        `https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/management-ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: conversationHistory,
            context: {
              chatName: chat?.name || 'Direct Message',
              memberCount: chatMembers.length,
            },
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please try again later.');
          return;
        }
        if (response.status === 402) {
          toast.error('AI credits required. Please contact support.');
          return;
        }
        throw new Error('Failed to get AI response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let cleoContent = '';
      let textBuffer = '';

      // Create Cleo's message
      const { data: cleoMessage, error: cleoError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: managementUser?.user.id,
          body_text: '',
          is_cleo: true,
        })
        .select()
        .single();

      if (cleoError) throw cleoError;

      // Optimistically add Cleo's message to UI immediately
      const enrichedCleoMessage = await loadUserInfo(cleoMessage);
      setMessages((prev) => [...prev, enrichedCleoMessage]);
      scrollToBottom();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith('\r')) line = line.slice(0, -1);
            if (line.startsWith(':') || line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) {
                // First token received - hide thinking indicator
                if (isCleoThinking) {
                  setIsCleoThinking(false);
                }
                
                cleoContent += content;
                
                // Update message in database
                await supabase
                  .from('messages')
                  .update({ body_text: cleoContent })
                  .eq('id', cleoMessage.id);
                
                // Update message in local state immediately for instant feedback
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === cleoMessage.id ? { ...msg, body_text: cleoContent } : msg
                  )
                );
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting Cleo response:', error);
      setIsCleoThinking(false);
      toast.error('Failed to get AI response');
    }
  };

  const handleSendMessage = async (text: string, image?: File) => {
    if (!text.trim() && !image) return;
    
    const mentionsCleo = /@Cleo\b/i.test(text);

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

      // Optimistically add message to UI immediately
      const enrichedMessage = await loadUserInfo(newMessage);
      
      // Get public URL for attachment if present
      if (storagePath) {
        const { data: urlData } = supabase.storage
          .from('chat-images')
          .getPublicUrl(storagePath);
        
        enrichedMessage.attachments = [{
          message_id: newMessage.id,
          type: 'image',
          storage_path: storagePath,
          mime: image.type,
          url: urlData.publicUrl,
        }];
      }
      
      setMessages((prev) => [...prev, enrichedMessage]);
      scrollToBottom();

      // Update last_read_at
      await supabase
        .from('chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', managementUser?.user.id);

      // Trigger Cleo response if mentioned
      if (mentionsCleo) {
        await handleCleoResponse(text, chatId);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
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

      <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.length === 0 && !loading ? (
            <div className="flex items-center justify-center h-full py-12">
              <div className="text-center">
                <p className="text-muted-foreground font-industrial text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender_id === managementUser?.user.id}
                  isCleo={message.is_cleo === true}
                />
              ))}
              {isCleoThinking && (
                <MessageBubble
                  message={{
                    id: 'thinking',
                    body_text: '',
                    created_at: new Date().toISOString(),
                    sender_name: 'Cleo',
                  }}
                  isOwn={false}
                  isCleo={true}
                />
              )}
            </>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <MessageInput onSend={handleSendMessage} chatMembers={chatMembers} />
    </div>
  );
};
