import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="font-display uppercase text-xs tracking-wider">
          AI assist
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-[100010] w-56 bg-background border border-foreground" align="end">
        {ACTIONS.map((a) => (
          <DropdownMenuItem
            key={a.key}
            disabled={!!busy}
            onSelect={(event) => {
              event.preventDefault();
              void run(a.key);
            }}
            className="text-xs cursor-pointer focus:bg-foreground focus:text-background"
          >
            {busy === a.key ? 'Working...' : a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
