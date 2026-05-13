import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  body: string;
  channel: string;
  onApply: (text: string) => void;
}

const ACTIONS: { key: string; label: string }[] = [
  { key: 'caption', label: 'Generate caption' },
  { key: 'rewrite', label: 'Rewrite for channel' },
  { key: 'shorten', label: 'Shorten' },
  { key: 'hashtags', label: 'Suggest hashtags' },
  { key: 'alt_text', label: 'Generate alt text' },
];

export const AiAssistButton = ({ body, channel, onApply }: Props) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (action: string) => {
    setBusy(action);
    try {
      const { data, error } = await supabase.functions.invoke('marketing-ai-assist', {
        body: { action, body, channel },
      });
      if (error) throw error;
      const text = (data as any)?.text || '';
      if (!text) throw new Error('Empty response');
      onApply(text);
      setOpen(false);
      toast.success('Generated');
    } catch (e: any) {
      toast.error(e.message || 'AI assist failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="font-display uppercase text-xs tracking-wider">
          AI assist
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 bg-background border border-foreground" align="end">
        <div className="space-y-1">
          {ACTIONS.map((a) => (
            <button
              key={a.key}
              type="button"
              disabled={!!busy}
              onClick={() => run(a.key)}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-foreground hover:text-background disabled:opacity-50"
            >
              {busy === a.key ? 'Working...' : a.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
