import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type: string;
    params: any;
    reasoning: string;
  };
}

interface ManagementAIContextType {
  messages: Message[];
  isLoading: boolean;
  isWidgetOpen: boolean;
  unreadCount: number;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  toggleWidget: () => void;
  markAsRead: () => void;
}

const ManagementAIContext = createContext<ManagementAIContextType | undefined>(undefined);

export const ManagementAIProvider = ({ children }: { children: ReactNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Get the user's session token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No active session');
      }

      const context = {
        user: {
          firstName: 'User',
          lastName: 'Name',
          role: 'admin',
        },
        page: {
          route: window.location.pathname,
        },
        currentDate: new Date().toISOString(),
      };

      const response = await fetch(
        `https://xccidvoxhpgcnwinnyin.supabase.co/functions/v1/management-ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            context,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';
      let textBuffer = '';

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

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
                assistantContent += content;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantMessage.id ? { ...m, content: assistantContent } : m
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

      if (!isWidgetOpen) {
        setUnreadCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, isWidgetOpen]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const toggleWidget = useCallback(() => {
    setIsWidgetOpen(prev => !prev);
    if (!isWidgetOpen) {
      setUnreadCount(0);
    }
  }, [isWidgetOpen]);

  const markAsRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  return (
    <ManagementAIContext.Provider
      value={{
        messages,
        isLoading,
        isWidgetOpen,
        unreadCount,
        sendMessage,
        clearMessages,
        toggleWidget,
        markAsRead,
      }}
    >
      {children}
    </ManagementAIContext.Provider>
  );
};

export const useManagementAI = () => {
  const context = useContext(ManagementAIContext);
  if (!context) {
    throw new Error('useManagementAI must be used within ManagementAIProvider');
  }
  return context;
};
