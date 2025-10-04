import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Send, X, Minimize2, Maximize2, Mic, Square, Trash2, ArrowDown, GripVertical } from 'lucide-react';
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
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('cleo-widget-position-v2');
    if (saved) {
      return JSON.parse(saved);
    }
    // Migrate from old key or default to bottom-right
    const oldSaved = localStorage.getItem('cleo-widget-position');
    if (oldSaved) {
      localStorage.removeItem('cleo-widget-position');
    }
    return { x: 24, y: 24 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const touchTimerRef = useRef<NodeJS.Timeout>();
  const { isRecording, transcript, isSupported, startRecording, stopRecording, resetTranscript } = useVoiceRecognition();

  // Clamp position within viewport bounds
  const clampPosition = useCallback((pos: { x: number; y: number }) => {
    if (!cardRef.current) return pos;
    
    const cardWidth = cardRef.current.offsetWidth;
    const cardHeight = cardRef.current.offsetHeight;
    const maxX = window.innerWidth - cardWidth - 24;
    const maxY = window.innerHeight - cardHeight - 24;
    
    return {
      x: Math.max(24, Math.min(maxX, pos.x)),
      y: Math.max(24, Math.min(maxY, pos.y))
    };
  }, []);

  // Save position to localStorage (debounced)
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem('cleo-widget-position-v2', JSON.stringify(position));
    }, 300);
  }, [position]);

  // Re-clamp position on window resize or minimize state change
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampPosition(prev));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  useEffect(() => {
    setPosition(prev => clampPosition(prev));
  }, [isMinimized, clampPosition]);

  // Handle pointer-based dragging
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Only left mouse button
    
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // Don't drag when clicking buttons
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...position };
    
    if (e.pointerType === 'mouse') {
      // Instant drag for mouse
      setIsDragging(true);
      dragStartPosRef.current = { x: startX, y: startY };
      e.currentTarget.setPointerCapture(e.pointerId);
    } else if (e.pointerType === 'touch') {
      // Long-press for touch (350ms)
      touchTimerRef.current = setTimeout(() => {
        setIsDragging(true);
        dragStartPosRef.current = { x: startX, y: startY };
      }, 350);
    }
  }, [position]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const deltaX = dragStartPosRef.current.x - e.clientX;
    const deltaY = dragStartPosRef.current.y - e.clientY;
    
    setPosition(prev => clampPosition({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
  }, [isDragging, clampPosition]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
    }
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }, []);

  // Always scroll to bottom when widget opens or minimizes
  useEffect(() => {
    if (scrollRef.current && isWidgetOpen && !isMinimized) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 150);
    }
  }, [isWidgetOpen, isMinimized]);

  // Auto-scroll when messages change (only if near bottom)
  useEffect(() => {
    if (scrollRef.current && isWidgetOpen && !isMinimized) {
      const scrollElement = scrollRef.current;
      const isNearBottom = scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight < 100;
      
      if (isNearBottom || isLoading) {
        setTimeout(() => {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth',
          });
        }, 100);
      }
    }
  }, [messages, isLoading]);

  // Update input with voice transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Handle scroll to detect if user scrolled up (throttled for performance)
  const handleScroll = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    scrollTimeoutRef.current = setTimeout(() => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollButton(!isNearBottom && messages.length > 0);
      }
    }, 100);
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
        ref={cardRef}
        className={cn(
          'fixed flex flex-col shadow-2xl z-50 border-2',
          isMinimized ? 'h-14 w-80' : 'h-[600px] w-[400px]',
          'bg-background/95 backdrop-blur-md',
          isDragging ? 'cursor-grabbing transition-none' : 'transition-all'
        )}
        style={{
          right: `${position.x}px`,
          bottom: `${position.y}px`,
        }}
      >
      {/* Header */}
      <div 
        className={cn(
          "flex items-center justify-between border-b border-foreground bg-background p-4 select-none",
          isDragging ? "cursor-grabbing" : "cursor-grab"
        )}
        style={{
          touchAction: isDragging ? 'none' : 'auto',
          WebkitTouchCallout: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="flex items-center gap-2">
          <GripVertical className={cn(
            "h-5 w-5 text-muted-foreground transition-colors",
            isDragging && "text-accent-pink"
          )} />
          <div className="h-8 w-8 rounded-full bg-accent-pink border-2 border-foreground flex items-center justify-center">
            <Bot className="h-4 w-4 text-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-sm font-brutalist">Cleo</h3>
            <p className="text-xs text-muted-foreground">
              {isDragging ? 'Dragging...' : 'Your AI assistant'}
            </p>
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
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full scroll-smooth" viewportRef={scrollRef} viewportProps={{ onScrollCapture: handleScroll }}>
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
          <div className="relative border-t p-4 pb-6">
            {isRecording && (
              <div className="absolute -top-14 left-4 right-4 flex items-center gap-2 text-xs font-industrial bg-accent-pink/95 backdrop-blur-sm p-2.5 rounded-lg border-2 border-accent-pink shadow-lg animate-in fade-in slide-in-from-bottom-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-foreground font-medium">Listening...</span>
              </div>
            )}
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="relative"
            >
              <div className="relative flex items-center">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isLoading || isRecording}
                  className={cn(
                    "pr-24 border-2 border-foreground font-industrial placeholder:text-muted-foreground/60",
                    isSupported && "pl-4"
                  )}
                />
                
                {/* Voice and Send buttons inside input */}
                <div className="absolute right-2 flex items-center gap-1">
                  {isSupported && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={handleVoiceToggle}
                      disabled={isLoading}
                      className={cn(
                        'h-8 w-8 transition-all',
                        isRecording && 'text-red-500 hover:text-red-600 hover:bg-red-50'
                      )}
                      title={isRecording ? 'Stop recording' : 'Voice input'}
                    >
                      {isRecording ? (
                        <Square className="h-4 w-4 fill-current" />
                      ) : (
                        <Mic className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                  
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={isLoading || !input.trim()}
                    className={cn(
                      "h-8 w-8 bg-accent-pink border-2 border-foreground hover:bg-accent-pink-dark transition-all",
                      (!input.trim() || isLoading) && "opacity-50"
                    )}
                    title="Send message"
                  >
                    <Send className="h-4 w-4 text-foreground" />
                  </Button>
                </div>
              </div>
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
