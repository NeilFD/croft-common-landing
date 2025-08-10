import React, { useMemo, useState, useCallback, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const DEFAULT_ICON = "/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png";
const DEFAULT_BADGE = "/lovable-uploads/e1833950-a130-4fb5-9a97-ed21a71fab46.png";

type Props = {
  onSent: () => void;
  editing?: any | null;
  onClearEdit?: () => void;
};

type RepeatType = "none" | "daily" | "weekly" | "monthly";

export const ComposeNotificationForm: React.FC<Props> = ({ onSent, editing, onClearEdit }) => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [badge, setBadge] = useState(DEFAULT_BADGE);
  const [scope, setScope] = useState<"all" | "self">("all");
  const [dryRun, setDryRun] = useState(false);
  const [sending, setSending] = useState(false);

  // Scheduling state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string>(""); // yyyy-mm-dd
  const [scheduleTime, setScheduleTime] = useState<string>(""); // HH:mm
  const [timezone, setTimezone] = useState<string>(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");

  // Repeat controls
  const [repeatType, setRepeatType] = useState<RepeatType>("none");
  const [repeatEvery, setRepeatEvery] = useState<number>(1);
  const [repeatWeekdays, setRepeatWeekdays] = useState<number[]>([1]); // 1=Mon..7=Sun
  const [repeatDayOfMonth, setRepeatDayOfMonth] = useState<number>(1);
  const [endMode, setEndMode] = useState<"never" | "onDate" | "after">("never");
  const [endDate, setEndDate] = useState<string>("");
  const [occurrencesLimit, setOccurrencesLimit] = useState<number>(0);

  // OS attribution preview (from iOS/Android shows "from {App}")
  const [appAttribution, setAppAttribution] = useState<string>("Croft Common");
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/manifest.json");
        const m = await res.json();
        setAppAttribution(String(m?.short_name || m?.name || "App"));
      } catch (_e) {
        // no-op
      }
    })();
  }, []);

  // Load editing notification into form
  useEffect(() => {
    if (!editing) return;
    try {
      setTitle(editing.title ?? "");
      setBody(editing.body ?? "");
      setUrl(editing.url ?? "");
      setIcon(editing.icon ?? DEFAULT_ICON);
      setBadge(editing.badge ?? DEFAULT_BADGE);
      setScope((editing.scope as any) ?? "all");
      setDryRun(Boolean(editing.dry_run ?? false));

      const sf: string | null = editing.scheduled_for ?? null;
      const tz: string | null = editing.schedule_timezone ?? null;
      if (sf) {
        const d = new Date(sf);
        const pad = (n: number) => String(n).padStart(2, '0');
        const yyyy = d.getFullYear();
        const mm = pad(d.getMonth() + 1);
        const dd = pad(d.getDate());
        const hh = pad(d.getHours());
        const mi = pad(d.getMinutes());
        setIsScheduled(true);
        setScheduleDate(`${yyyy}-${mm}-${dd}`);
        setScheduleTime(`${hh}:${mi}`);
        if (tz) setTimezone(tz);
      } else {
        setIsScheduled(false);
        setScheduleDate("");
        setScheduleTime("");
        if (tz) setTimezone(tz);
      }

      const rr = editing.repeat_rule ?? null;
      if (rr?.type) {
        setRepeatType(rr.type);
        setRepeatEvery(rr.every ?? 1);
        if (rr.type === "weekly") setRepeatWeekdays(rr.weekdays ?? []);
        if (rr.type === "monthly") setRepeatDayOfMonth(rr.dayOfMonth ?? 1);
      } else {
        setRepeatType("none");
        setRepeatEvery(1);
        setRepeatWeekdays([1]);
        setRepeatDayOfMonth(1);
      }

      if (editing.repeat_until) {
        setEndMode("onDate");
        const e = new Date(editing.repeat_until);
        const pad = (n: number) => String(n).padStart(2, '0');
        setEndDate(`${e.getFullYear()}-${pad(e.getMonth() + 1)}-${pad(e.getDate())}`);
      } else if (editing.occurrences_limit) {
        setEndMode("after");
        setOccurrencesLimit(editing.occurrences_limit);
      } else {
        setEndMode("never");
        setEndDate("");
        setOccurrencesLimit(0);
      }
    } catch (e) {
      console.warn("Failed to load editing notification", e);
    }
  }, [editing]);

  // Title guidance: keep titles short; iOS shows a single line
  const TITLE_RECOMMENDED_MAX = 40;
  const titleChars = title.length;
  const titleOverLimit = titleChars > TITLE_RECOMMENDED_MAX;

  const moveOverflowToBody = () => {
    if (title.length <= TITLE_RECOMMENDED_MAX) return;
    const cutoff = TITLE_RECOMMENDED_MAX;
    const newTitle = title.slice(0, cutoff).trim();
    const overflow = title.slice(cutoff).trim();
    setTitle(newTitle);
    if (overflow) setBody((prev) => (prev ? prev + ' ' + overflow : overflow));
  };

  const normalizeUrlInput = (u: string): string => {
    const raw = (u ?? '').trim();
    if (!raw) return '';
    try {
      if (raw.startsWith('/')) {
        const urlObj = new URL(raw, window.location.origin);
        urlObj.pathname = urlObj.pathname.toLowerCase(); // normalize relative paths to lowercase
        return urlObj.href;
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
    }),
    [title, body, icon, badge, normalizedUrl]
  );

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  // Build schedule payload
  const buildScheduledISO = () => {
    if (!scheduleDate || !scheduleTime) return null;
    // Construct local date then convert to ISO (UTC)
    const local = new Date(`${scheduleDate}T${scheduleTime}:00`);
    return local.toISOString();
  };

  const buildRepeatRule = () => {
    if (repeatType === "none") return null;
    const rule: any = {
      type: repeatType,
      every: repeatEvery,
    };
    if (repeatType === "weekly") {
      rule.weekdays = repeatWeekdays;
    }
    if (repeatType === "monthly") {
      rule.dayOfMonth = repeatDayOfMonth;
    }
    return rule;
  };

  const handleSaveDraft = async () => {
    if (!canSend) {
      toast({ title: "Missing fields", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke("upsert-notification", {
        body: {
          id: editing?.id ?? null,
          mode: "draft",
          notification: {
            title: title.trim(),
            body: body.trim(),
            url: normalizedUrl || null,
            icon: icon.trim() || null,
            badge: badge.trim() || null,
            scope,
            dry_run: false,
          },
        },
      });
      if (error) throw error;
      toast({ title: "Draft saved", description: `Draft #${data?.id ?? ""} saved.` });
      onSent();
    } catch (err: any) {
      console.error("Save draft error", err);
      toast({ title: "Save failed", description: err?.message ?? "Please try again.", variant: "destructive" });
    }
  };

  const handleSchedule = async () => {
    if (!canSend) {
      toast({ title: "Missing fields", description: "Title and body are required.", variant: "destructive" });
      return;
    }
    if (!isScheduled) {
      toast({ title: "Scheduling not enabled", description: "Toggle Schedule for later to enable.", variant: "destructive" });
      return;
    }
    const scheduledISO = buildScheduledISO();
    if (!scheduledISO) {
      toast({ title: "Missing date/time", description: "Choose a date and time to schedule.", variant: "destructive" });
      return;
    }
    const repeat_rule = buildRepeatRule();
    const repeat_until = endMode === "onDate" && endDate ? new Date(`${endDate}T23:59:59`).toISOString() : null;
    const occurrences_limit = endMode === "after" && occurrencesLimit > 0 ? occurrencesLimit : null;

    try {
      const { data, error } = await supabase.functions.invoke("upsert-notification", {
        body: {
          id: editing?.id ?? null,
          mode: "schedule",
          notification: {
            title: title.trim(),
            body: body.trim(),
            url: normalizedUrl || null,
            icon: icon.trim() || null,
            badge: badge.trim() || null,
            scope,
            dry_run: false,
          },
          schedule: {
            scheduled_for: scheduledISO,
            timezone,
            repeat_rule,
            repeat_until,
            occurrences_limit,
          },
        },
      });
      if (error) throw error;
      toast({ title: "Scheduled", description: `Notification scheduled for ${new Date(scheduledISO).toLocaleString()}` });
      onSent();
    } catch (err: any) {
      console.error("Schedule error", err);
      toast({ title: "Schedule failed", description: err?.message ?? "Please try again.", variant: "destructive" });
    }
  };

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
  
  const resetForm = () => {
    setTitle("");
    setBody("");
    setUrl("");
    setIcon(DEFAULT_ICON);
    setBadge(DEFAULT_BADGE);
    setScope("all");
    setDryRun(false);
    setIsScheduled(false);
    setScheduleDate("");
    setScheduleTime("");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
    setRepeatType("none");
    setRepeatEvery(1);
    setRepeatWeekdays([1]);
    setRepeatDayOfMonth(1);
    setEndMode("never");
    setEndDate("");
    setOccurrencesLimit(0);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {editing && (
          <div className="rounded-md border bg-muted/40 p-3 text-sm flex items-center justify-between">
            <div>
              <span className="font-medium">Editing {editing.status === 'queued' ? 'scheduled notification' : 'draft'}</span>
              {editing.scheduled_for ? (
                <span className="ml-2 text-muted-foreground">({new Date(editing.scheduled_for).toLocaleString()})</span>
              ) : null}
            </div>
            {onClearEdit ? (
              <Button size="sm" variant="ghost" onClick={() => { resetForm(); onClearEdit?.(); }}>Clear</Button>
            ) : null}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="What should the notification say?"
              value={title}
              onChange={(e) => {
                const next = e.target.value;
                if (next.length <= TITLE_RECOMMENDED_MAX) {
                  setTitle(next);
                } else {
                  const newTitle = next.slice(0, TITLE_RECOMMENDED_MAX).trim();
                  const overflow = next.slice(TITLE_RECOMMENDED_MAX).trim();
                  setTitle(newTitle);
                  if (overflow) setBody((prev) => (prev ? prev + ' ' + overflow : overflow));
                }
              }}
              aria-describedby="title-hint"
            />
            <div className="flex flex-wrap items-center justify-between mt-1 gap-2">
              <div id="title-hint" className="text-xs text-muted-foreground">
                Max 40 characters; extra text automatically moves into Body.
              </div>
              <div className={`text-xs ${titleOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}>
                {titleChars}/{TITLE_RECOMMENDED_MAX}
              </div>
            </div>
            {titleOverLimit && (
              <div className="mt-1">
                <Button type="button" size="sm" variant="outline" onClick={moveOverflowToBody}>
                  Move extra text to Body
                </Button>
              </div>
            )}
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
              <p className="text-xs text-muted-foreground">Tip: Enter a full URL, a path like /book, or a domain like croftcommontest.com/book. We'll normalize it.</p>
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

          {/* Scheduling */}
          <div className="space-y-3 border rounded-md p-4">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Schedule</Label>
              <div className="flex items-center gap-2">
                <Switch id="is-scheduled" checked={isScheduled} onCheckedChange={setIsScheduled} />
                <Label htmlFor="is-scheduled">Schedule for later</Label>
              </div>
            </div>
            {isScheduled && (
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="schedule-date">Date</Label>
                  <Input id="schedule-date" type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="schedule-time">Time</Label>
                  <Input id="schedule-time" type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Timezone</Label>
                  <Input value={timezone} readOnly className="bg-muted" />
                </div>
              </div>
            )}

            {/* Repeat */}
            {isScheduled && (
              <div className="space-y-3">
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label>Repeat</Label>
                    <Select value={repeatType} onValueChange={(v) => setRepeatType(v as RepeatType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Every</Label>
                    <Input type="number" min={1} value={repeatEvery} onChange={(e) => setRepeatEvery(Math.max(1, Number(e.target.value || 1)))} />
                  </div>
                  {repeatType === "monthly" && (
                    <div className="space-y-1">
                      <Label>Day of month</Label>
                      <Input type="number" min={1} max={31} value={repeatDayOfMonth} onChange={(e) => setRepeatDayOfMonth(Math.min(31, Math.max(1, Number(e.target.value || 1))))} />
                    </div>
                  )}
                </div>

                {repeatType === "weekly" && (
                  <div className="space-y-2">
                    <Label>Weekdays</Label>
                    <div className="grid grid-cols-7 gap-2 text-xs">
                      {[
                        { n: 1, l: "Mon" },
                        { n: 2, l: "Tue" },
                        { n: 3, l: "Wed" },
                        { n: 4, l: "Thu" },
                        { n: 5, l: "Fri" },
                        { n: 6, l: "Sat" },
                        { n: 7, l: "Sun" },
                      ].map((d) => (
                        <label key={d.n} className="flex items-center gap-2">
                          <Checkbox
                            checked={repeatWeekdays.includes(d.n)}
                            onCheckedChange={(checked) => {
                              setRepeatWeekdays((prev) => {
                                const on = Boolean(checked);
                                if (on && !prev.includes(d.n)) return [...prev, d.n].sort((a, b) => a - b);
                                if (!on) return prev.filter((x) => x !== d.n);
                                return prev;
                              });
                            }}
                          />
                          {d.l}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <Label>End</Label>
                  <RadioGroup className="flex flex-wrap gap-4" value={endMode} onValueChange={(v) => setEndMode(v as any)}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="end-never" />
                      <Label htmlFor="end-never">Never</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="onDate" id="end-onDate" />
                      <Label htmlFor="end-onDate">On date</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="after" id="end-after" />
                      <Label htmlFor="end-after">After N times</Label>
                    </div>
                  </RadioGroup>
                </div>

                {endMode === "onDate" && (
                  <div className="space-y-1">
                    <Label>End date</Label>
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </div>
                )}
                {endMode === "after" && (
                  <div className="space-y-1">
                    <Label>Occurrences</Label>
                    <Input type="number" min={1} value={occurrencesLimit} onChange={(e) => setOccurrencesLimit(Math.max(1, Number(e.target.value || 1)))} />
                  </div>
                )}
              </div>
            )}
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
                  <div className="font-medium truncate">{preview.title}</div>
                  <Badge variant="secondary">{scope}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">from {appAttribution}</div>
                <div className="text-sm text-muted-foreground">{preview.body}</div>
                {preview.url ? (
                  <div className="text-xs text-primary mt-1 truncate">
                    {preview.url}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
              {dryRun ? "Send (dry run)" : "Send now"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveDraft}
              disabled={!canSend || sending}
            >
              {editing ? "Update draft" : "Save draft"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSchedule}
              disabled={!canSend || !isScheduled || sending}
            >
              {editing ? "Update schedule" : "Schedule"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
