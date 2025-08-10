import React, { useMemo, useState, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const DEFAULT_ICON = "/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png";
const DEFAULT_BADGE = "/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png";

type Props = {
  onSent: () => void;
};

export const ComposeNotificationForm: React.FC<Props> = ({ onSent }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [badge, setBadge] = useState(DEFAULT_BADGE);
  const [image, setImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [scope, setScope] = useState<"all" | "self">("all");
  const [dryRun, setDryRun] = useState(false);
  const [sending, setSending] = useState(false);

  const normalizeUrlInput = (u: string): string => {
    const raw = (u ?? '').trim();
    if (!raw) return '';
    try {
      if (raw.startsWith('/')) {
        return new URL(raw, window.location.origin).href;
      }
      return new URL(raw).href;
    } catch {
      return new URL(`https://${raw}`).href;
    }
  };

  const normalizedUrl = useMemo(() => normalizeUrlInput(url), [url]);

  const preview = useMemo(
    () => ({
      title: title || 'Preview title',
      body: body || 'Preview body text appears here.',
      icon: icon || undefined,
      badge: badge || undefined,
      url: normalizedUrl || undefined,
      image: image || undefined,
    }),
    [title, body, icon, badge, normalizedUrl, image]
  );

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const uploadImage = useCallback(async (file: File) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not signed in", description: "Please sign in to upload.", variant: "destructive" });
        return;
      }
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('notifications').upload(path, file, {
        cacheControl: '3600', upsert: true, contentType: file.type
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('notifications').getPublicUrl(path);
      setImage(pub.publicUrl);
      toast({ title: 'Image uploaded' });
    } catch (err: any) {
      console.error('Upload error', err);
      toast({ title: 'Upload failed', description: err.message ?? String(err), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, []);

  const invokeSend = async (opts: { dry_run: boolean }) => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        payload: {
          title: title.trim(),
          body: body.trim(),
          url: normalizedUrl || undefined,
          icon: icon.trim() || undefined,
          badge: badge.trim() || undefined,
          image: image.trim() || undefined,
        },
        scope,
        dry_run: opts.dry_run,
      },
    });
    setSending(false);

    if (error) {
      console.error("send-push error", error);
      toast({
        title: "Send failed",
        description: error.message ?? "Unknown error",
        variant: "destructive",
      });
      return;
    }

    const res: any = data;
    if (opts.dry_run) {
      toast({
        title: "Dry run complete",
        description: `Recipients: ${res?.recipients ?? 0} (scope: ${res?.scope})`,
      });
    } else {
      toast({
        title: "Notification sent",
        description: `Success: ${res?.success ?? 0}, Failed: ${res?.failed ?? 0}`,
      });
      onSent();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What should the notification say?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              placeholder="Add more details here…"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="url">URL (optional)</Label>
              <Input
                id="url"
                placeholder="https://example.com or /book or example.com/book"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Tip: Enter a full URL, a path like /book, or a domain like croftcommontest.com/book. We’ll normalize it.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="icon">Icon URL (optional)</Label>
              <Input
                id="icon"
                placeholder="https://…/icon.png"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="badge">Badge URL (optional)</Label>
              <Input
                id="badge"
                placeholder="https://…/badge.png"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notification image (optional)</Label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) await uploadImage(file);
              }}
              className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
            >
              {image ? (
                <div className="w-full flex items-center gap-3">
                  <img src={image} alt="notification" className="h-20 w-20 object-cover rounded" />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => setImage("")}>Remove</Button>
                    <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>Replace</Button>
                  </div>
                </div>
              ) : (
                <>
                  <p>Drag & drop an image here, or use the buttons below.</p>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                      Upload photo
                    </Button>
                    <Input type="file" accept="image/*" capture="environment" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} className="hidden" ref={fileInputRef} />
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <div className="space-y-2">
              <Label>Scope</Label>
              <RadioGroup
                className="flex gap-4"
                value={scope}
                onValueChange={(v) => setScope(v as "all" | "self")}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="scope-all" />
                  <Label htmlFor="scope-all">All subscribers</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="self" id="scope-self" />
                  <Label htmlFor="scope-self">Only me (test)</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center gap-2">
              <Switch id="dry-run" checked={dryRun} onCheckedChange={setDryRun} />
              <Label htmlFor="dry-run">Dry run</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview</Label>
            <div className="border rounded-md p-4 flex items-start gap-3">
              {preview.icon ? (
                <img
                  src={preview.icon}
                  alt="icon"
                  className="w-10 h-10 rounded shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-muted shrink-0" />
              )}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{preview.title}</div>
                  <Badge variant="secondary">{scope}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">{preview.body}</div>
                {preview.url ? (
                  <div className="text-xs text-primary mt-1 truncate">
                    {preview.url}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              disabled={!canSend || sending}
              onClick={() => invokeSend({ dry_run: true })}
              variant="outline"
            >
              Dry run
            </Button>
            <Button
              disabled={!canSend || sending}
              onClick={() => invokeSend({ dry_run: dryRun })}
            >
              {dryRun ? "Send (dry run)" : "Send"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
