import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { MentionAutocomplete } from './MentionAutocomplete';

interface MessageInputProps {
  onSend: (text: string, image?: File) => Promise<void>;
  mentionCleo?: boolean;
  onCleoMentionChange?: (mentioned: boolean) => void;
  chatMembers?: Array<{ user_id: string; user_name: string }>;
}

export const MessageInput = ({ onSend, mentionCleo = false, onCleoMentionChange, chatMembers = [] }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [cleoMentioned, setCleoMentioned] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!message.trim() && !image) return;

    setSending(true);
    try {
      await onSend(message, image || undefined);
      setMessage('');
      setImage(null);
      setCleoMentioned(false);
      onCleoMentionChange?.(false);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    setMessage(newValue);
    
    // Check for @Cleo mention
    const hasCleo = /@Cleo\b/i.test(newValue);
    if (hasCleo !== cleoMentioned) {
      setCleoMentioned(hasCleo);
      onCleoMentionChange?.(hasCleo);
    }

    // Detect @ mention trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtSymbol = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtSymbol + 1);
      // Check if there's no space after @ (still typing the mention)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt);
        setMentionStartPos(lastAtSymbol);
        setShowMentions(true);
        
        // Calculate cursor position for popup (relative to container)
        if (textareaRef.current) {
          setCursorPosition({
            top: -8, // Position above the input
            left: 0,
          });
        }
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const handleMentionSelect = (name: string) => {
    const beforeMention = message.slice(0, mentionStartPos);
    const afterMention = message.slice(mentionStartPos + mentionQuery.length + 1); // +1 for @
    const newMessage = `${beforeMention}@${name} ${afterMention}`;
    setMessage(newMessage);
    setShowMentions(false);
    
    // Check for Cleo mention
    const hasCleo = /@Cleo\b/i.test(newMessage);
    if (hasCleo !== cleoMentioned) {
      setCleoMentioned(hasCleo);
      onCleoMentionChange?.(hasCleo);
    }
    
    // Focus back on textarea
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    setImage(file);
  };

  // Render message with highlighted mentions
  const highlightedMessage = useMemo(() => {
    if (!message) return null;
    
    const mentionRegex = /@[\w\s-]+/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = mentionRegex.exec(message)) !== null) {
      // Add text before mention
      if (match.index > lastIndex) {
        parts.push(
          <span key={`text-${lastIndex}`}>
            {message.slice(lastIndex, match.index)}
          </span>
        );
      }
      
      // Add highlighted mention
      parts.push(
        <span
          key={`mention-${match.index}`}
          className="text-[hsl(var(--accent-pink))] font-bold"
        >
          {match[0]}
        </span>
      );
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < message.length) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {message.slice(lastIndex)}
        </span>
      );
    }
    
    return parts;
  }, [message]);

  return (
    <div className="relative">
      <MentionAutocomplete
        query={mentionQuery}
        chatMembers={chatMembers}
        onSelect={handleMentionSelect}
        open={showMentions}
        position={cursorPosition}
        onOpenChange={setShowMentions}
      />
      <div className="p-4 border-t border-border">
        {cleoMentioned && (
          <div className="mb-2 flex items-center gap-2 text-sm bg-[hsl(var(--accent-pink))]/10 px-3 py-2 rounded-md font-industrial">
            <span className="font-bold text-[hsl(var(--accent-pink))]">Cleo</span>
            <span className="text-muted-foreground">will respond to this message</span>
          </div>
        )}
        {image && (
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground font-industrial">
            <ImageIcon className="h-4 w-4" />
            <span className="truncate">{image.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setImage(null)}
              className="ml-auto"
            >
              Remove
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <div className="relative flex-1">
            {/* Highlight layer behind textarea */}
            <div 
              className="absolute inset-0 text-sm font-industrial whitespace-pre-wrap break-words pointer-events-none"
              style={{ 
                color: 'transparent',
                padding: '0.5rem 0.75rem',
                lineHeight: '1.5rem',
                border: '1px solid transparent'
              }}
            >
              {highlightedMessage}
            </div>
            {/* Actual textarea */}
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (@Cleo for AI)"
              className="resize-none font-industrial relative bg-transparent"
              style={{
                padding: '0.5rem 0.75rem',
                lineHeight: '1.5rem'
              }}
              rows={1}
              disabled={sending}
            />
          </div>
        <Button
          onClick={handleSend}
          disabled={(!message.trim() && !image) || sending}
          size="icon"
          className="bg-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))]/90"
        >
          <Send className="h-4 w-4" />
        </Button>
        </div>
      </div>
    </div>
  );
};
