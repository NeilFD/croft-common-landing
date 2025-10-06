import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useManagementAuth } from '@/hooks/useManagementAuth';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { ChatHeader } from './ChatHeader';

import { MessageActionsDropdown } from './MessageActionsDropdown';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  body_text: string;
  body?: string; // RPC returns 'body' field
  reply_to_message_id: string | null;
  reply_to_message?: {
    sender_name: string;
    body_text: string;
  } | null;
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
  const { managementUser, hasRole } = useManagementAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chat, setChat] = useState<any>(null);
  const [chatMembers, setChatMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCleoThinking, setIsCleoThinking] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
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
          loadUserInfo(payload.new as Message).then(async (enrichedMessage) => {
            // Try to attach reply preview from local state first
            let enrichedWithPreview = enrichedMessage;
            const replyId = (enrichedMessage as any).reply_to_message_id;
            if (replyId) {
              const local = messages.find((m) => m.id === replyId);
              if (local) {
                enrichedWithPreview = {
                  ...enrichedMessage,
                  reply_to_message: {
                    sender_name: local.sender_name || 'Unknown',
                    body_text: local.body_text,
                  },
                };
              }
            }

            setMessages((prev) => {
              // Check if message already exists (from optimistic update)
              const exists = prev.some((msg) => msg.id === enrichedWithPreview.id);
              if (exists) {
                return prev; // Don't add duplicate
              }
              return [...prev, enrichedWithPreview];
            });

            // If reply context not found locally, fetch minimal info and patch message
            if (replyId && !messages.find((m) => m.id === replyId)) {
              try {
                const { data: replyRow } = await supabase
                  .from('messages')
                  .select('id, sender_id, body_text')
                  .eq('id', replyId)
                  .maybeSingle();
                if (replyRow) {
                  const { data: userData } = await supabase
                    .rpc('get_chat_user_info', { _user_id: replyRow.sender_id })
                    .single();
                  const preview = {
                    sender_name: userData?.display_name || 'Unknown',
                    body_text: replyRow.body_text || '',
                  };
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === enrichedMessage.id ? { ...m, reply_to_message: preview } : m
                    )
                  );
                }
              } catch (err) {
                console.warn('ActiveChat: failed to fetch reply preview for realtime insert', err);
              }
            }

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
        reply_to_message_id: m.reply_to_message_id ?? null,
        created_at: m.created_at,
        edited_at: m.edited_at,
        deleted_at: m.deleted_at,
        is_cleo: m.is_cleo ?? false,
        attachments: [],
        read_by: [],
      }));

      // Load attachments for all messages
      const messageIds = basicMessages.map(m => m.id);
      if (messageIds.length > 0) {
        const { data: attachments } = await supabase
          .from('attachments')
          .select('*')
          .in('message_id', messageIds);

        if (attachments && attachments.length > 0) {
          // Get public URLs for all attachments
          const enrichedAttachments = await Promise.all(
            attachments.map(async (att: any) => {
              const { data: signed } = await supabase.storage
                .from('chat-images')
                .createSignedUrl(att.storage_path, 60 * 60);
              return {
                ...att,
                url: signed?.signedUrl || '',
              };
            })
          );

          // Attach to messages
          basicMessages.forEach((msg) => {
            msg.attachments = enrichedAttachments.filter((att: any) => att.message_id === msg.id);
          });
        }
      }

      // Sort by created_at ascending
      const sorted = [...basicMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Enrich with sender display info
      const enriched = await Promise.all(sorted.map(loadUserInfo));
      
      // Enrich with reply message details
      const enrichedWithReplies = await Promise.all(
        enriched.map(async (msg) => {
          if (msg.reply_to_message_id) {
            const replyToMsg = enriched.find(m => m.id === msg.reply_to_message_id);
            if (replyToMsg) {
              return {
                ...msg,
                reply_to_message: {
                  sender_name: replyToMsg.sender_name || 'Unknown',
                  body_text: replyToMsg.body_text,
                },
              };
            }
          }
          return msg;
        })
      );
      
      console.info('ActiveChat.loadMessages: enriched count =', enrichedWithReplies.length);
      setMessages(enrichedWithReplies);
      
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
      
      // Clear thinking indicator when streaming completes
      setIsCleoThinking(false);
    } catch (error) {
      console.error('Error getting Cleo response:', error);
      setIsCleoThinking(false);
      toast.error('Failed to get AI response');
    }
  };

  const handleCopyMessage = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.body_text);
      toast.success('Message copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy message');
    }
  };

  const handleReplyToMessage = (message: Message) => {
    setReplyingTo(message);
    setEditingMessage(null);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setReplyingTo(null);
  };

  const handleDeleteMessage = (message: Message) => {
    setMessageToDelete(message);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', messageToDelete.id);

      if (error) throw error;

      // Remove from local state
      setMessages((prev) => prev.filter((msg) => msg.id !== messageToDelete.id));
      toast.success('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setDeleteDialogOpen(false);
      setMessageToDelete(null);
    }
  };

  const handleUpdateMessage = async (messageId: string, newText: string) => {
    if (!newText.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          body_text: newText,
          edited_at: new Date().toISOString()
        })
        .eq('id', messageId);

      if (error) throw error;

      // Update local state
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, body_text: newText, edited_at: new Date().toISOString() }
            : msg
        )
      );
      
      setEditingMessage(null);
      toast.success('Message updated');
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    }
  };

  const handleSendMessage = async (text: string, image?: File, replyToId?: string) => {
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
          reply_to_message_id: replyToId || null,
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
        const { data: signed } = await supabase.storage
          .from('chat-images')
          .createSignedUrl(storagePath, 60 * 60);
        
        enrichedMessage.attachments = [{
          message_id: newMessage.id,
          type: 'image',
          storage_path: storagePath,
          mime: image.type,
          url: signed?.signedUrl || '',
        }];
      }

      // Attach reply preview if applicable
      if (replyToId) {
        try {
          const local = messages.find((m) => m.id === replyToId);
          if (local) {
            enrichedMessage.reply_to_message = {
              sender_name: local.sender_name || 'Unknown',
              body_text: local.body_text,
            };
          } else {
            const { data: replyRow } = await supabase
              .from('messages')
              .select('id, sender_id, body_text')
              .eq('id', replyToId)
              .maybeSingle();
            if (replyRow) {
              const { data: userData } = await supabase
                .rpc('get_chat_user_info', { _user_id: replyRow.sender_id })
                .single();
              enrichedMessage.reply_to_message = {
                sender_name: userData?.display_name || 'Unknown',
                body_text: replyRow.body_text || '',
              };
            }
          }
        } catch (err) {
          console.warn('ActiveChat: failed to build reply preview', err);
        }
      }
      
      setMessages((prev) => [...prev, enrichedMessage]);
      setReplyingTo(null);
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
              {messages
                .filter((msg) => !msg.deleted_at)
                .map((message, index) => {
                  const isOwn = message.sender_id === managementUser?.user.id;
                  const canEdit = isOwn && !message.is_cleo;
                  const canDelete = isOwn || hasRole('admin');
                  
                  return (
                    <div key={message.id} className="relative group md:pr-12">
                      <MessageBubble
                        message={message}
                        isOwn={isOwn}
                        isCleo={message.is_cleo === true}
                        isCleoThinking={message.is_cleo && index === messages.filter(m => !m.deleted_at).length - 1 && isCleoThinking}
                      />
                      <MessageActionsDropdown
                        canEdit={canEdit}
                        canDelete={canDelete}
                        onCopy={() => handleCopyMessage(message)}
                        onReply={() => handleReplyToMessage(message)}
                        onEdit={canEdit ? () => handleEditMessage(message) : undefined}
                        onDelete={() => handleDeleteMessage(message)}
                      />
                    </div>
                  );
                })}
              
              {/* Fallback thinking indicator if no empty Cleo bubble exists */}
              {isCleoThinking && !messages.some(m => m.is_cleo && !m.body_text) && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--accent-pink))] flex items-center justify-center text-white font-bold text-sm">
                    C
                  </div>
                  <div className="flex-1">
                    <div className="bg-card border-l-4 border-[hsl(var(--accent-pink))] rounded-lg p-3 max-w-[70%] shadow-sm">
                      <div className="text-xs font-bold uppercase tracking-wide mb-1 text-[hsl(var(--accent-pink))]">Cleo</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-industrial text-sm">Cleo is thinking</span>
                        <div className="flex gap-1">
                          <span className="animate-bounce text-sm" style={{ animationDelay: '0ms' }}>.</span>
                          <span className="animate-bounce text-sm" style={{ animationDelay: '150ms' }}>.</span>
                          <span className="animate-bounce text-sm" style={{ animationDelay: '300ms' }}>.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <MessageInput 
        onSend={handleSendMessage}
        onUpdateMessage={handleUpdateMessage}
        chatMembers={chatMembers}
        replyToMessage={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingMessage={editingMessage}
        onCancelEdit={() => setEditingMessage(null)}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteMessage} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
