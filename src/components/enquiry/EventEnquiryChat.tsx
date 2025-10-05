import { useState, useRef, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Message, EnquiryData } from '@/pages/EventEnquiry';

interface EventEnquiryChatProps {
  onComplete: (data: EnquiryData, messages: Message[]) => void;
}

export const EventEnquiryChat = ({ onComplete }: EventEnquiryChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hey! 👋 I'm here to help you plan something special at Croft Common. What's your name?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knownInfo, setKnownInfo] = useState<Partial<EnquiryData>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('event-enquiry-chat', {
        body: {
          messages: [...messages, userMessage],
          knownInfo
        }
      });

      if (error) throw error;

      if (data.done) {
        // Update known info with final extracted data
        setKnownInfo(data.extractedData);
        // Add a friendly completion message before moving to review
        const completionMessage: Message = {
          role: 'assistant',
          content: "That's brilliant! Let me find the perfect space for you... ✨",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, completionMessage]);
        
        // Small delay to show the message before transitioning
        setTimeout(() => {
          onComplete(data.extractedData, [...messages, userMessage, completionMessage]);
        }, 800);
      } else {
        // Add AI response
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMessage]);
        
        // Update known info with any extracted data
        if (data.extractedData) {
          setKnownInfo(prev => ({ ...prev, ...data.extractedData }));
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="w-full max-w-3xl h-[600px] bg-card border-2 border-foreground shadow-lg rounded-lg flex flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-background scrollbar-thin scrollbar-thumb-accent scrollbar-track-transparent"
           style={{
             scrollbarWidth: 'thin',
             scrollbarColor: 'hsl(var(--accent)) transparent'
           }}
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
          >
            <div
              className={`
                max-w-[80%] px-4 py-3 rounded-lg
                ${message.role === 'user'
                  ? 'bg-accent text-accent-foreground border-2 border-foreground'
                  : 'bg-white text-foreground border-l-4 border-accent'
                }
                font-industrial text-sm md:text-base transition-all duration-200
              `}
            >
              {message.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start animate-fade-in">
            <div className="bg-white text-foreground px-4 py-3 rounded-lg border-l-4 border-accent flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-accent rounded-full animate-[pulse_1.4s_ease-in-out_0s_infinite]" />
                <span className="w-2 h-2 bg-accent rounded-full animate-[pulse_1.4s_ease-in-out_0.2s_infinite]" />
                <span className="w-2 h-2 bg-accent rounded-full animate-[pulse_1.4s_ease-in-out_0.4s_infinite]" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-foreground bg-background">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer..."
            disabled={isLoading}
            className="flex-1 font-industrial border-2 border-foreground focus-visible:border-accent focus-visible:ring-0 transition-colors duration-300"
            autoFocus
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`bg-accent text-accent-foreground hover:bg-accent/80 border-2 border-foreground font-industrial font-bold transition-all ${
              input.trim() && !isLoading ? 'animate-[pulse_2s_ease-in-out_infinite]' : ''
            }`}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
