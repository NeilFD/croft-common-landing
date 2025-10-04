import { useState, useRef, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Image as ImageIcon, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { MentionsInput, Mention } from 'react-mentions';

interface MessageInputProps {
  onSend: (text: string, image?: File, replyToId?: string) => Promise<void>;
  onUpdate?: (messageId: string, text: string) => Promise<void>;
  mentionCleo?: boolean;
  onCleoMentionChange?: (mentioned: boolean) => void;
  chatMembers?: Array<{ user_id: string; user_name: string }>;
  replyTo?: { id: string; sender_name: string; body_text: string } | null;
  onCancelReply?: () => void;
  editingMessage?: { id: string; body_text: string } | null;
  onCancelEdit?: () => void;
}

export const MessageInput = ({ 
  onSend, 
  onUpdate,
  mentionCleo = false, 
  onCleoMentionChange, 
  chatMembers = [],
  replyTo,
  onCancelReply,
  editingMessage,
  onCancelEdit,
}: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [plainTextMessage, setPlainTextMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [cleoMentioned, setCleoMentioned] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Populate input when editing
  useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.body_text);
      setPlainTextMessage(editingMessage.body_text);
    }
  }, [editingMessage]);

  const handleSend = async () => {
    if (!plainTextMessage.trim() && !image) return;

    setSending(true);
    try {
      // Normalize mentions to only show first name
      let normalizedText = plainTextMessage;
      
      // Replace @[Full Name](id) with @FirstName
      normalizedText = normalizedText.replace(/@\[([^\]]+)\]\([^)]+\)/g, (match, fullName) => {
        const firstName = fullName.split(' ')[0];
        return `@${firstName}`;
      });
      
      if (editingMessage && onUpdate) {
        // Update existing message
        await onUpdate(editingMessage.id, normalizedText);
        onCancelEdit?.();
      } else {
        // Send new message
        await onSend(normalizedText, image || undefined, replyTo?.id);
        onCancelReply?.();
      }
      
      setMessage('');
      setPlainTextMessage('');
      setImage(null);
      setCleoMentioned(false);
      onCleoMentionChange?.(false);
    } catch (error) {
      toast.error(editingMessage ? 'Failed to update message' : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleMessageChange = (
    event: any,
    newValue: string,
    newPlainTextValue: string,
    mentions: any[]
  ) => {
    setMessage(newValue);
    setPlainTextMessage(newPlainTextValue);

    // Check for @Cleo mention
    const hasCleo = /@Cleo\b/i.test(newPlainTextValue);
    if (hasCleo !== cleoMentioned) {
      setCleoMentioned(hasCleo);
      onCleoMentionChange?.(hasCleo);
    }
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

  // Prepare mention data for react-mentions
  const mentionData = useMemo(() => [
    { id: 'cleo', display: 'Cleo' },
    ...chatMembers.map(member => ({
      id: member.user_id,
      display: member.user_name
    }))
  ], [chatMembers]);

  return (
    <div className="relative">
      <div className="p-4 border-t border-border">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 text-sm bg-muted px-3 py-2 rounded-md font-industrial">
            <div className="flex-1">
              <div className="font-semibold text-foreground">Replying to {replyTo.sender_name}</div>
              <div className="text-muted-foreground truncate">{replyTo.body_text.slice(0, 50)}...</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelReply}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {editingMessage && (
          <div className="mb-2 flex items-center gap-2 text-sm bg-[hsl(var(--accent-pink))]/10 px-3 py-2 rounded-md font-industrial">
            <div className="flex-1">
              <div className="font-semibold text-[hsl(var(--accent-pink))]">Editing message</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancelEdit}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {cleoMentioned && !editingMessage && (
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
          <div className="flex-1">
            <MentionsInput
              value={message}
              onChange={handleMessageChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (@Cleo for AI)"
              disabled={sending}
              className="mentions-input"
              style={{
                control: {
                  fontSize: '0.875rem',
                  fontFamily: 'var(--font-industrial)',
                  minHeight: '40px',
                },
                input: {
                  margin: 0,
                  padding: '0.5rem 0.75rem',
                  border: '1px solid hsl(var(--input))',
                  borderRadius: '0.375rem',
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  lineHeight: '1.5rem',
                  outline: 'none',
                  overflow: 'auto',
                },
                highlighter: {
                  padding: '0.5rem 0.75rem',
                  border: '1px solid transparent',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                },
                suggestions: {
                  list: {
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.375rem',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    maxHeight: '200px',
                    overflow: 'auto',
                    fontSize: '0.875rem',
                  },
                  item: {
                    padding: '0.5rem 0.75rem',
                    fontFamily: 'var(--font-industrial)',
                    color: 'hsl(var(--foreground))',
                    cursor: 'pointer',
                    '&focused': {
                      backgroundColor: 'hsl(var(--accent))',
                    },
                  },
                },
              }}
            >
              <Mention
                trigger="@"
                data={mentionData}
                displayTransform={(id, display) => {
                  // Only show first name in the input
                  const firstName = display.split(' ')[0];
                  return `@${firstName}`;
                }}
                markup="@[__display__](__id__)"
                appendSpaceOnAdd={true}
                style={{
                  backgroundColor: 'hsl(var(--accent-pink))',
                  color: 'white',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '0.25rem',
                  fontWeight: 600,
                }}
              />
            </MentionsInput>
          </div>
          <Button
            onClick={handleSend}
            disabled={(!plainTextMessage.trim() && !image) || sending}
            size="icon"
            className="bg-[hsl(var(--accent-pink))] hover:bg-[hsl(var(--accent-pink))]/90"
          >
            {editingMessage ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};