import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BulkAiSuggestion {
  route: string;
  label: string | null;
  current: { title: string | null; description: string | null; keywords: string[] | null };
  suggested: { title?: string; description?: string; keywords?: string[]; rationale?: string };
  error?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestions: BulkAiSuggestion[];
}

const isChanged = (s: BulkAiSuggestion) => {
  if (s.error) return false;
  const cur = s.current;
  const sug = s.suggested;
  return (
    (sug.title && sug.title !== (cur.title ?? '')) ||
    (sug.description && sug.description !== (cur.description ?? '')) ||
    (sug.keywords && sug.keywords.join(',') !== (cur.keywords ?? []).join(','))
  );
};

export function SeoBulkAiReview({ open, onOpenChange, suggestions }: Props) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [hideUnchanged, setHideUnchanged] = useState(true);
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const s of suggestions) init[s.route] = !s.error && isChanged(s);
    return init;
  });

  const visible = useMemo(
    () => suggestions.filter(s => (hideUnchanged ? isChanged(s) || s.error : true)),
    [suggestions, hideUnchanged]
  );

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const save = useMutation({
    mutationFn: async () => {
      const rows = suggestions
        .filter(s => selected[s.route] && !s.error)
        .map(s => ({
          route: s.route,
          ...(s.suggested.title !== undefined ? { title: s.suggested.title || null } : {}),
          ...(s.suggested.description !== undefined ? { description: s.suggested.description || null } : {}),
          ...(s.suggested.keywords !== undefined
            ? { keywords: Array.isArray(s.suggested.keywords) ? s.suggested.keywords : null }
            : {}),
        }));

      // Update one at a time so we don't accidentally insert/wipe other columns
      for (const r of rows) {
        const { route, ...patch } = r;
        const { error } = await supabase.from('seo_pages').update(patch).eq('route', route);
        if (error) throw error;
      }
      return rows.length;
    },
    onSuccess: (count) => {
      toast({ title: 'Saved', description: `${count} page${count === 1 ? '' : 's'} updated.` });
      qc.invalidateQueries({ queryKey: ['seo-pages'] });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wide">
            Review AI suggestions
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {suggestions.length} page{suggestions.length === 1 ? '' : 's'} drafted.
            {' '}{selectedCount} selected to save.
          </p>
        </DialogHeader>

        <div className="flex items-center justify-between border-y border-foreground/10 py-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={hideUnchanged}
              onCheckedChange={(v) => setHideUnchanged(!!v)}
            />
            Hide unchanged pages
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const next: Record<string, boolean> = {};
                for (const s of suggestions) next[s.route] = !s.error && isChanged(s);
                setSelected(next);
              }}
            >
              Select all
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelected({})}
            >
              Clear
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-3 py-2">
            {visible.length === 0 && (
              <div className="text-sm text-muted-foreground py-12 text-center">
                Nothing to review. AI returned the same copy for every page.
              </div>
            )}
            {visible.map((s) => {
              const changed = isChanged(s);
              const disabled = !!s.error || !changed;
              return (
                <div
                  key={s.route}
                  className={`border p-3 ${selected[s.route] ? 'border-foreground bg-muted/30' : 'border-foreground/15'}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={!!selected[s.route]}
                      disabled={disabled}
                      onCheckedChange={(v) => setSelected(prev => ({ ...prev, [s.route]: !!v }))}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <div>
                          <div className="font-cb-sans font-medium">{s.label || s.route}</div>
                          <div className="text-xs text-muted-foreground">{s.route}</div>
                        </div>
                        {s.error && (
                          <span className="text-xs text-destructive">AI failed: {s.error}</span>
                        )}
                        {!s.error && !changed && (
                          <span className="text-xs text-muted-foreground">No change suggested</span>
                        )}
                      </div>

                      {s.suggested.rationale && (
                        <div className="mt-2 text-xs text-muted-foreground italic">
                          {s.suggested.rationale}
                        </div>
                      )}

                      {!s.error && (
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <Field
                            label="Title"
                            current={s.current.title || ''}
                            next={s.suggested.title}
                          />
                          <Field
                            label="Description"
                            current={s.current.description || ''}
                            next={s.suggested.description}
                          />
                          <div className="md:col-span-2">
                            <Field
                              label="Keywords"
                              current={(s.current.keywords ?? []).join(', ')}
                              next={
                                s.suggested.keywords
                                  ? (Array.isArray(s.suggested.keywords)
                                      ? s.suggested.keywords.join(', ')
                                      : String(s.suggested.keywords))
                                  : undefined
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t border-foreground/10 pt-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={save.isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => save.mutate()}
            disabled={save.isPending || selectedCount === 0}
            className="font-display uppercase tracking-wide"
          >
            {save.isPending ? 'Saving…' : `Save ${selectedCount} page${selectedCount === 1 ? '' : 's'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, current, next }: { label: string; current: string; next?: string }) {
  if (next === undefined) {
    return (
      <div>
        <Label className="text-xs uppercase tracking-wide font-cb-sans text-muted-foreground">{label}</Label>
        <div className="text-xs text-muted-foreground italic mt-1">Not changed</div>
      </div>
    );
  }
  const same = next === current;
  return (
    <div>
      <Label className="text-xs uppercase tracking-wide font-cb-sans text-muted-foreground">{label}</Label>
      <div className="mt-1 space-y-1">
        <div className="text-xs text-muted-foreground line-through truncate">
          {current || '(empty)'}
        </div>
        <div className={`text-sm ${same ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
          {next || '(empty)'}
        </div>
      </div>
    </div>
  );
}
