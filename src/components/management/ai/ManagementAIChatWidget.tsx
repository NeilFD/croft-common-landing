import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Minimize2, Maximize2, Mic, Square, Trash2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useManagementAI } from '@/contexts/ManagementAIContext';
import { AIMessageBubble } from './AIMessageBubble';
import { AIQuickActions } from './AIQuickActions';
import { useVoiceRecognition } from '@/hooks/useVoiceRecognition';
import { ClearChatDialog } from './ClearChatDialog';

export const ManagementAIChatWidget = () => {
  const { messages, isLoading, isWidgetOpen, unreadCount, sendMessage, toggleWidget, markAsRead, clearMessages } =
    useManagementAI();
  const [input, setInput] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { isRecording, transcript, isSupported, startRecording, stopRecording, resetTranscript } = useVoiceRecognition();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current;
      const isNearBottom = scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100;
      
      if (isNearBottom || isLoading) {
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }
  }, [messages, isLoading]);

  // Update input with voice transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Handle scroll to detect if user scrolled up
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    }
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

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
    resetTranscript();
    await sendMessage(message);
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleClearChat = () => {
    clearMessages();
    setClearDialogOpen(false);
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
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setClearDialogOpen(true)}
              title="Clear chat"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
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
          <div className="relative flex-1">
            <ScrollArea className="h-full" ref={scrollRef} onScroll={handleScroll}>
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
            
            {/* Scroll to bottom button */}
            {showScrollButton && (
              <Button
                size="icon"
                className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-lg bg-accent-pink border-2 border-foreground hover:bg-accent-pink-dark z-10"
                onClick={scrollToBottom}
              >
                <ArrowDown className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Input */}
          <div className="border-t p-4">
            {isRecording && (
              <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground bg-accent-pink/10 p-2 rounded-md border border-accent-pink">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span>Recording...</span>
              </div>
            )}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              {isSupported && (
                <Button
                  type="button"
                  size="icon"
                  variant={isRecording ? 'destructive' : 'outline'}
                  onClick={handleVoiceToggle}
                  disabled={isLoading}
                  className={cn(
                    'border-2 border-foreground',
                    isRecording && 'bg-red-500 hover:bg-red-600'
                  )}
                >
                  {isRecording ? (
                    <Square className="h-4 w-4" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading || isRecording}
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

      <ClearChatDialog
        open={clearDialogOpen}
        onOpenChange={setClearDialogOpen}
        onConfirm={handleClearChat}
      />
    </>
  );
};
