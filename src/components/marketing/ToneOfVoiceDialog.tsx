import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ALL_CHANNELS } from './channelMeta';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const FALLBACK_VOICE = `You are writing for 'The Crazy Bear', voice = 'Bears Den': bold, irreverent, short, staccato, confident, minimal copy. British English only. Never use em dashes or double hyphens. Never invent prices or facts. Never use Americanisms. Currency £ only.`;

const FALLBACK_HINTS: Record<string, string> = {
  instagram: 'Tone: visual-led, 1-3 short lines, hashtags optional, emoji sparingly.',
  tiktok: 'Tone: punchy hook in line one, casual.',
  facebook: 'Tone: warm, slightly longer, conversational.',
  x: 'Hard limit 280 chars, single tight line, witty.',
  linkedin: 'Tone: confident, professional, no hype, 2-4 short paragraphs.',
  email: 'Output a subject line then a 2-3 sentence preheader-friendly intro.',
  website: 'Tone: editorial, scannable, headline + 2 short paragraphs.',
};

export function ToneOfVoiceDialog({ open, onOpenChange }: Props) {
  const [voice, setVoice] = useState(FALLBACK_VOICE);
  const [hints, setHints] = useState<Record<string, string>>(FALLBACK_HINTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    (supabase as any)
      .from('marketing_settings')
      .select('voice_prompt, channel_hints')
      .eq('key', 'default')
      .maybeSingle()
      .then(({ data, error }: any) => {
        if (error) {
          toast.error('Could not load tone of voice');
        } else if (data) {
          setVoice(data.voice_prompt || FALLBACK_VOICE);
          setHints({ ...FALLBACK_HINTS, ...((data.channel_hints || {}) as Record<string, string>) });
        }
        setLoading(false);
      });
  }, [open]);

  const save = async () => {
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from('marketing_settings')
      .upsert({
        key: 'default',
        voice_prompt: voice,
        channel_hints: hints,
        updated_by: u.user?.id ?? null,
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Tone of voice saved');
    onOpenChange(false);
  };

  const resetDefaults = () => {
    setVoice(FALLBACK_VOICE);
    setHints(FALLBACK_HINTS);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider">Tone of Voice</DialogTitle>
          <DialogDescription>
            This is the system prompt the AI assist uses when generating or rewriting copy. Edits apply to every channel and every post.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[10px] font-display uppercase tracking-wider">Brand voice (system prompt)</Label>
              <Textarea
                value={voice}
                onChange={(e) => setVoice(e.target.value)}
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] font-display uppercase tracking-wider">Per-channel hints</Label>
              {ALL_CHANNELS.map((c) => (
                <div key={c} className="space-y-1">
                  <div className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">{c}</div>
                  <Textarea
                    value={hints[c] || ''}
                    onChange={(e) => setHints({ ...hints, [c]: e.target.value })}
                    rows={2}
                    className="text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={resetDefaults} disabled={saving}>Reset to defaults</Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || loading}>{saving ? 'Saving...' : 'Save'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
