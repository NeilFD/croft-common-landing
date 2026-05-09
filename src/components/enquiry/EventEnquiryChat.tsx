import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
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
      content: "Right. Tell the Bear what you're planning. Start with your name.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [knownInfo, setKnownInfo] = useState<Partial<EnquiryData>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('event-enquiry-chat', {
        body: { messages: [...messages, userMessage], knownInfo },
      });

      if (error) throw error;

      if (data.done) {
        setKnownInfo(data.extractedData);
        const completionMessage: Message = {
          role: 'assistant',
          content: "Got it. Finding the right room.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, completionMessage]);
        setTimeout(() => {
          onComplete(data.extractedData, [...messages, userMessage, completionMessage]);
        }, 800);
      } else {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        if (data.extractedData) {
          setKnownInfo((prev) => ({ ...prev, ...data.extractedData }));
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Try again, or email neil.fincham-dukes@crazybear.co.uk.',
        variant: 'destructive',
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
    <div className="space-y-6">
      {/* Intro card */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-black p-5 md:p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.9)]">
        <p className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/50 mb-2">/ / /</p>
        <p className="font-sans text-sm md:text-base text-black/80 leading-relaxed">
          Tell the Bear what you're planning. We'll come back inside a working day. Or skip the chat
          and write to{' '}
          <a
            href="mailto:neil.fincham-dukes@crazybear.co.uk?subject=Event%20Enquiry"
            className="underline decoration-2 underline-offset-2 hover:text-accent-pink"
          >
            neil.fincham-dukes@crazybear.co.uk
          </a>
          .
        </p>
      </div>

      {/* Chat surface */}
      <div className="bg-white/80 backdrop-blur-sm border-2 border-black shadow-[8px_8px_0_0_rgba(0,0,0,0.9)] flex flex-col h-[560px]">
        <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={
                  message.role === 'user'
                    ? 'max-w-[80%] bg-black text-white border-2 border-black px-4 py-3 font-sans text-sm md:text-base'
                    : 'max-w-[85%] font-sans text-sm md:text-base text-black leading-relaxed'
                }
              >
                {message.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-black/50">
                / / / thinking
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t-2 border-black p-3 md:p-4 flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type your answer"
            disabled={isLoading}
            autoFocus
            className="flex-1 bg-white border-2 border-black px-4 py-3 font-sans text-sm text-black placeholder:text-black/40 focus:outline-none focus:ring-0 focus:border-black"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            aria-label="Send"
            className="border-2 border-black bg-black text-white px-5 font-mono text-[11px] tracking-[0.4em] uppercase hover:bg-accent-pink hover:border-accent-pink hover:text-white transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
