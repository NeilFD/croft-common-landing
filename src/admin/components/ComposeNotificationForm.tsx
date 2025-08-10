
import React, { useMemo, useState } from "react";
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

type Props = {
  onSent: () => void;
};

export const ComposeNotificationForm: React.FC<Props> = ({ onSent }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState("");
  const [badge, setBadge] = useState("");
  const [scope, setScope] = useState<"all" | "self">("all");
  const [dryRun, setDryRun] = useState(false);
  const [sending, setSending] = useState(false);

  const preview = useMemo(
    () => ({
      title: title || "Preview title",
      body: body || "Preview body text appears here.",
      icon: icon || undefined,
      badge: badge || undefined,
      url: url || undefined,
    }),
    [title, body, icon, badge, url]
  );

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  const invokeSend = async (opts: { dry_run: boolean }) => {
    setSending(true);
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        payload: {
          title: title.trim(),
          body: body.trim(),
          url: url.trim() || undefined,
          icon: icon.trim() || undefined,
          badge: badge.trim() || undefined,
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
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
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
