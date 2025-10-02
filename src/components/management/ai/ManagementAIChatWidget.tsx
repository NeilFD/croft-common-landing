import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useManagementAI } from '@/contexts/ManagementAIContext';
import { AIMessageBubble } from './AIMessageBubble';
import { AIQuickActions } from './AIQuickActions';

export const ManagementAIChatWidget = () => {
  const { messages, isLoading, isWidgetOpen, unreadCount, sendMessage, toggleWidget, markAsRead } =
    useManagementAI();
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isWidgetOpen && !isMinimized) {
      markAsRead();
      inputRef.current?.focus();
    }
  }, [isWidgetOpen, isMinimized, markAsRead]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleQuickAction = async (prompt: string) => {
    await sendMessage(prompt);
  };

  if (!isWidgetOpen) {
    return (
      <Button
        onClick={toggleWidget}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all z-50 bg-accent-pink border-2 border-foreground hover:bg-accent-pink-dark"
        size="icon"
      >
        <Bot className="h-6 w-6 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-pink border border-foreground text-foreground text-xs flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </Button>
    );
  }

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
        onClick={toggleWidget}
      />

      <Card
        className={cn(
          'fixed bottom-6 right-6 flex flex-col shadow-2xl transition-all z-50 border-2',
          isMinimized ? 'h-14 w-80' : 'h-[600px] w-[400px]',
          'bg-background/95 backdrop-blur-md'
        )}
      >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-foreground bg-background p-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-accent-pink border-2 border-foreground flex items-center justify-center">
            <Bot className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm font-brutalist">Cleo</h3>
            <p className="text-xs text-muted-foreground">Your AI assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleWidget}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <ScrollArea className="flex-1" ref={scrollRef}>
            {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <div className="h-16 w-16 rounded-full bg-accent-pink border-2 border-foreground flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-foreground" />
                </div>
                <h4 className="font-semibold font-brutalist mb-2">Hi! I'm Cleo</h4>
                <p className="text-sm text-muted-foreground mb-6">
                  Ask me about bookings, events, leads, or anything else related to management.
                </p>
                <AIQuickActions onActionClick={handleQuickAction} />
              </div>
            ) : (
              <div className="flex flex-col">
                {messages.map(message => (
                  <AIMessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-3 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-pink border-2 border-foreground">
                      <Bot className="h-4 w-4 animate-pulse text-foreground" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-accent-pink animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-accent-pink animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-accent-pink animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-4">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !input.trim()}
                className="bg-accent-pink border-2 border-foreground hover:bg-accent-pink-dark"
              >
                <Send className="h-4 w-4 text-foreground" />
              </Button>
            </form>
          </div>
        </>
      )}
    </Card>
    </>
  );
};
