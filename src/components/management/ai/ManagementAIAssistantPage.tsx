import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Bot, Send, Trash2, Download } from 'lucide-react';
import { useManagementAI } from '@/contexts/ManagementAIContext';
import { AIMessageBubble } from './AIMessageBubble';
import { AIQuickActions } from './AIQuickActions';

export const ManagementAIAssistantPage = () => {
  const { messages, isLoading, sendMessage, clearMessages } = useManagementAI();
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleQuickAction = async (prompt: string) => {
    await sendMessage(prompt);
  };

  const handleExport = () => {
    const transcript = messages
      .map(m => `[${m.timestamp.toLocaleString()}] ${m.role.toUpperCase()}: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-conversation-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-brutalist font-black uppercase tracking-wider mb-2">
            AI Assistant
          </h1>
          <p className="text-muted-foreground">
            Your intelligent helper for all management tasks
          </p>
        </div>
        <div className="flex gap-2">
          {messages.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={clearMessages}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col h-[calc(100vh-200px)]">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Conversation</h2>
            </div>
          </div>

          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Bot className="h-16 w-16 text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold mb-2">
                  Welcome to the Management AI Assistant
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  I can help you with bookings, events, leads, analytics, and much more. Ask me
                  anything or try one of the quick actions below.
                </p>
                <AIQuickActions onActionClick={handleQuickAction} />
              </div>
            ) : (
              <div className="space-y-4">
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
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <Bot className="h-4 w-4 animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <Separator />

          <div className="p-4">
            <form
              onSubmit={e => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask me anything about your management tasks..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4 mr-2" />
                Send
              </Button>
            </form>
          </div>
        </Card>

        {/* Sidebar */}
        <Card className="p-6 h-[calc(100vh-200px)] overflow-auto">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <AIQuickActions onActionClick={handleQuickAction} />

          <Separator className="my-6" />

          <h3 className="font-semibold mb-4">About AI Assistant</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              The Management AI Assistant is powered by Google Gemini and can help you with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Answering questions about your data</li>
              <li>Finding information quickly</li>
              <li>Analysing trends and patterns</li>
              <li>Suggesting optimisations</li>
              <li>Automating repetitive tasks</li>
              <li>Generating reports and insights</li>
            </ul>
            <p className="text-xs">
              All Gemini models are currently free to use until 6th October 2025.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
