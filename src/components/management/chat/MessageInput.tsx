import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface MessageInputProps {
  onSend: (text: string, image?: File) => Promise<void>;
}

export const MessageInput = ({ onSend }: MessageInputProps) => {
  const [message, setMessage] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() && !image) return;

    setSending(true);
    try {
      await onSend(message, image || undefined);
      setMessage('');
      setImage(null);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
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

  return (
    <div className="p-4 border-t border-border">
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
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (@Cleo for AI)"
          className="resize-none font-industrial"
          rows={1}
          disabled={sending}
        />
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
  );
};
