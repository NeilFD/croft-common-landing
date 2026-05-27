import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Download, Search, Plus, Pencil } from "lucide-react";
import { formatSlotWindow, formatLongDate } from "@/lib/karaoke/slots";
import {
  sendBookingEmails,
  listPackages,
  createBooking,
  type KaraokeBooking,
  type KaraokePackage,
} from "@/lib/karaoke/api";

type ViewMode = "day" | "week" | "month";

interface SlotTemplate {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  label: string | null;
  subtitle: string | null;
  is_active: boolean;
  sort_order: number;
}

const fmtDay = (d: Date) => format(d, "yyyy-MM-dd");
const startKey = (t: string) => t.slice(0, 5);

const STATUS_OPTIONS: KaraokeBooking["status"][] = [
  "pending_payment",
  "confirmed",
  "cancelled",
  "cancelled_by_venue",
  "no_show",
];

const statusTone: Record<KaraokeBooking["status"], string> = {
  confirmed: "bg-foreground text-background border-foreground",
  pending_payment: "bg-amber-100 text-amber-900 border-amber-300",
  cancelled: "bg-zinc-100 text-zinc-500 border-zinc-200 line-through",
  cancelled_by_venue: "bg-red-50 text-red-900 border-red-200 line-through",
  no_show: "bg-zinc-100 text-zinc-500 border-zinc-200",
};

export default function KaraokeCalendar() {
  const { toast } = useToast();
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState<Date>(new Date());
  const [templates, setTemplates] = useState<SlotTemplate[]>([]);
  const [bookings, setBookings] = useState<KaraokeBooking[]>([]);
  const [packages, setPackages] = useState<KaraokePackage[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | KaraokeBooking["status"]>("all");

  const [editing, setEditing] = useState<KaraokeBooking | null>(null);
  const [creating, setCreating] = useState<{ date: Date; template: SlotTemplate } | null>(null);

  const range = useMemo(() => {
    if (view === "day") return { from: cursor, to: cursor };
    if (view === "week") {
      const from = startOfWeek(cursor, { weekStartsOn: 1 });
      return { from, to: endOfWeek(cursor, { weekStartsOn: 1 }) };
    }
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    return {
      from: startOfWeek(monthStart, { weekStartsOn: 1 }),
      to: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    };
  }, [view, cursor]);

  const load = async () => {
    setLoading(true);
    const [{ data: tpl }, { data: bk, error: bkErr }, pkg] = await Promise.all([
      supabase
        .from("karaoke_slots" as any)
        .select("id, day_of_week, start_time, end_time, label, subtitle, is_active, sort_order")
        .order("day_of_week")
        .order("start_time"),
      supabase
        .from("karaoke_bookings" as any)
        .select(
          "id, slot_date, slot_start, slot_end, guest_first_name, guest_last_name, guest_email, guest_phone, party_size, food_package_id, drink_package_id, notes, status, deposit_status, manage_token, cancelled_at, cancelled_reason, created_at",
        )
        .gte("slot_date", fmtDay(range.from))
        .lte("slot_date", fmtDay(range.to))
        .order("slot_date")
        .order("slot_start"),
      listPackages().catch(() => [] as KaraokePackage[]),
    ]);
    if (bkErr) toast({ title: "Failed to load bookings", description: bkErr.message, variant: "destructive" });
    setTemplates(((tpl as unknown) as SlotTemplate[]) ?? []);
    setBookings(((bk as unknown) as KaraokeBooking[]) ?? []);
    setPackages(pkg);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from.getTime(), range.to.getTime()]);

  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${b.guest_first_name} ${b.guest_last_name ?? ""} ${b.guest_email} ${b.guest_phone ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [bookings, search, statusFilter]);

  const bookingByKey = useMemo(() => {
    const m = new Map<string, KaraokeBooking>();
    for (const b of filteredBookings) {
      m.set(`${b.slot_date}_${startKey(b.slot_start)}`, b);
    }
    return m;
  }, [filteredBookings]);

  const slotStarts = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((t) => set.add(startKey(t.start_time)));
    return Array.from(set).sort();
  }, [templates]);

  const templateFor = (date: Date, start: string): SlotTemplate | undefined => {
    return templates.find(
      (t) => t.day_of_week === date.getDay() && startKey(t.start_time) === start,
    );
  };

  const headerLabel = useMemo(() => {
    if (view === "day") return format(cursor, "EEEE d MMMM yyyy");
    if (view === "week") {
      const from = startOfWeek(cursor, { weekStartsOn: 1 });
      const to = endOfWeek(cursor, { weekStartsOn: 1 });
      return `${format(from, "d MMM")} to ${format(to, "d MMM yyyy")}`;
    }
    return format(cursor, "MMMM yyyy");
  }, [cursor, view]);

  const move = (dir: -1 | 1) => {
    if (view === "day") setCursor(addDays(cursor, dir));
    else if (view === "week") setCursor(addWeeks(cursor, dir));
    else setCursor(addMonths(cursor, dir));
  };

  const exportCsv = () => {
    const header = [
      "Date", "Start", "End", "Status", "Guest", "Email", "Phone",
      "Party", "Food", "Drink", "Notes", "Created",
    ];
    const rows = filteredBookings.map((b) => [
      b.slot_date,
      startKey(b.slot_start),
      startKey(b.slot_end),
      b.status,
      `${b.guest_first_name} ${b.guest_last_name ?? ""}`.trim(),
      b.guest_email,
      b.guest_phone ?? "",
      String(b.party_size),
      b.food_package ?? "",
      b.drink_package ?? "",
      (b.notes ?? "").replace(/\n/g, " "),
      b.created_at,
    ]);
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `karaoke-bookings-${fmtDay(range.from)}_${fmtDay(range.to)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => move(-1)} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(1)} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="font-display uppercase tracking-wide text-lg ml-2">{headerLabel}</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex border border-border rounded-md overflow-hidden">
            {(["day", "week", "month"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-sm font-cb-sans uppercase tracking-wide transition-colors ${
                  view === v ? "bg-foreground text-background" : "bg-background hover:bg-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search guest name, email or phone"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground ml-auto">
          {filteredBookings.length} booking{filteredBookings.length === 1 ? "" : "s"} in view
        </span>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : view === "month" ? (
        <MonthView
          start={range.from}
          end={range.to}
          monthAnchor={cursor}
          bookings={filteredBookings}
          onSelectDay={(d) => {
            setCursor(d);
            setView("day");
          }}
        />
      ) : (
        <WeekOrDayGrid
          start={view === "week" ? startOfWeek(cursor, { weekStartsOn: 1 }) : cursor}
          days={view === "week" ? 7 : 1}
          slotStarts={slotStarts}
          templateFor={templateFor}
          bookingByKey={bookingByKey}
          onSelect={(b) => setEditing(b)}
          onCreate={(date, template) => setCreating({ date, template })}
        />
      )}

      <EditBookingDialog
        booking={editing}
        packages={packages}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />

      <NewBookingDialog
        slot={creating}
        packages={packages}
        onClose={() => setCreating(null)}
        onCreated={() => {
          setCreating(null);
          load();
        }}
      />
    </div>
  );
}

/* ------------ Week / Day grid ------------ */

function WeekOrDayGrid({
  start,
  days,
  slotStarts,
  templateFor,
  bookingByKey,
  onSelect,
  onCreate,
}: {
  start: Date;
  days: number;
  slotStarts: string[];
  templateFor: (date: Date, start: string) => SlotTemplate | undefined;
  bookingByKey: Map<string, KaraokeBooking>;
  onSelect: (b: KaraokeBooking) => void;
  onCreate: (date: Date, template: SlotTemplate) => void;
}) {
  const dates = Array.from({ length: days }, (_, i) => addDays(start, i));

  if (slotStarts.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-sm text-muted-foreground">
          No slot windows configured. Add weekly windows in Settings.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div
        className="grid bg-muted/40 border-b border-border"
        style={{ gridTemplateColumns: `7rem repeat(${days}, minmax(0, 1fr))` }}
      >
        <div className="p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Slot</div>
        {dates.map((d) => (
          <div
            key={d.toISOString()}
            className={`p-2 text-center border-l border-border ${isToday(d) ? "bg-foreground text-background" : ""}`}
          >
            <div className="text-[10px] uppercase tracking-[0.2em] opacity-70">{format(d, "EEE")}</div>
            <div className="font-display text-lg leading-none">{format(d, "d")}</div>
          </div>
        ))}
      </div>

      {slotStarts.map((s) => (
        <div
          key={s}
          className="grid border-b border-border last:border-b-0"
          style={{ gridTemplateColumns: `7rem repeat(${days}, minmax(0, 1fr))` }}
        >
          <div className="p-2 text-xs font-cb-sans border-r border-border bg-muted/20">
            {format(parseISO(`2000-01-01T${s}:00`), "h:mm a")}
          </div>
          {dates.map((d) => {
            const tpl = templateFor(d, s);
            const booking = bookingByKey.get(`${fmtDay(d)}_${s}`);
            return (
              <Cell
                key={`${d.toISOString()}-${s}`}
                template={tpl}
                booking={booking}
                onSelect={booking ? () => onSelect(booking) : undefined}
                onCreate={tpl && !booking ? () => onCreate(d, tpl) : undefined}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Cell({
  template,
  booking,
  onSelect,
  onCreate,
}: {
  template?: SlotTemplate;
  booking?: KaraokeBooking;
  onSelect?: () => void;
  onCreate?: () => void;
}) {
  if (!template) {
    return <div className="border-l border-border bg-muted/10 min-h-[68px]" />;
  }
  if (!template.is_active) {
    return (
      <div className="border-l border-border bg-zinc-50 min-h-[68px] p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        Closed
      </div>
    );
  }
  if (booking) {
    const guest = `${booking.guest_first_name} ${booking.guest_last_name ?? ""}`.trim();
    return (
      <button
        type="button"
        onClick={onSelect}
        className={`border-l border-border min-h-[68px] p-2 text-left transition-colors ${statusTone[booking.status]}`}
      >
        <div className="text-xs font-cb-sans font-semibold truncate">{guest}</div>
        <div className="text-[11px] opacity-80 truncate">Party of {booking.party_size}</div>
        <div className="text-[10px] uppercase tracking-[0.15em] opacity-70 mt-0.5">
          {booking.status.replace(/_/g, " ")}
        </div>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onCreate}
      className="group border-l border-border min-h-[68px] p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-left hover:bg-muted/40 transition-colors w-full"
    >
      <span className="opacity-60 group-hover:hidden">Open</span>
      <span className="hidden group-hover:inline-flex items-center gap-1 text-foreground">
        <Plus className="h-3 w-3" /> New
      </span>
      {template.label && (
        <div className="text-[10px] normal-case tracking-normal opacity-50 mt-1 truncate">
          {template.label}
        </div>
      )}
    </button>
  );
}

/* ------------ Month view ------------ */

function MonthView({
  start,
  end,
  monthAnchor,
  bookings,
  onSelectDay,
}: {
  start: Date;
  end: Date;
  monthAnchor: Date;
  bookings: KaraokeBooking[];
  onSelectDay: (d: Date) => void;
}) {
  const days: Date[] = [];
  let d = start;
  while (d <= end) {
    days.push(d);
    d = addDays(d, 1);
  }
  const bookingsByDay = new Map<string, KaraokeBooking[]>();
  for (const b of bookings) {
    const arr = bookingsByDay.get(b.slot_date) ?? [];
    arr.push(b);
    bookingsByDay.set(b.slot_date, arr);
  }
  const weekHeader = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="grid grid-cols-7 bg-muted/40 border-b border-border">
        {weekHeader.map((w) => (
          <div key={w} className="p-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground text-center">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const list = (bookingsByDay.get(fmtDay(day)) ?? []).filter(
            (b) => !["cancelled", "cancelled_by_venue"].includes(b.status),
          );
          const outOfMonth = !isSameMonth(day, monthAnchor);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDay(day)}
              className={`min-h-[88px] border-l border-b border-border p-2 text-left transition-colors hover:bg-muted/40 ${outOfMonth ? "bg-muted/10 text-muted-foreground" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-display text-sm leading-none ${isToday(day) ? "bg-foreground text-background px-1.5 py-0.5" : ""}`}
                >
                  {format(day, "d")}
                </span>
                {list.length > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {list.length}
                  </Badge>
                )}
              </div>
              <div className="mt-1 space-y-0.5">
                {list.slice(0, 3).map((b) => (
                  <div key={b.id} className="text-[10px] truncate bg-foreground text-background px-1 py-0.5">
                    {startKey(b.slot_start)} {b.guest_first_name}
                  </div>
                ))}
                {list.length > 3 && (
                  <div className="text-[10px] text-muted-foreground">+{list.length - 3} more</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------ Edit dialog ------------ */

function EditBookingDialog({
  booking,
  packages,
  onClose,
  onSaved,
}: {
  booking: KaraokeBooking | null;
  packages: KaraokePackage[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<KaraokeBooking | null>(booking);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(booking), [booking]);

  if (!form) return null;

  const food = packages.filter((p) => p.kind === "food");
  const drink = packages.filter((p) => p.kind === "drink");
  const cancellable = !["cancelled", "cancelled_by_venue"].includes(form.status);

  const save = async () => {
    setSaving(true);
    const patch = {
      slot_date: form.slot_date,
      slot_start: form.slot_start,
      slot_end: form.slot_end,
      party_size: form.party_size,
      guest_first_name: form.guest_first_name,
      guest_last_name: form.guest_last_name,
      guest_email: form.guest_email,
      guest_phone: form.guest_phone,
      food_package_id: form.food_package_id,
      drink_package_id: form.drink_package_id,
      notes: form.notes,
      status: form.status,
    };
    const { data, error } = await supabase.rpc("management_update_karaoke_booking" as any, {
      p_id: form.id,
      patch: patch as any,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    await sendBookingEmails(data as unknown as KaraokeBooking, "updated");
    toast({ title: "Saved", description: "Booking updated. Guest and venue notified." });
    onSaved();
  };

  const cancel = async () => {
    const reason = window.prompt("Reason for cancelling on behalf of guest?");
    if (!reason) return;
    const { data, error } = await supabase.rpc("management_cancel_karaoke_booking" as any, {
      p_id: form.id,
      p_reason: reason,
    });
    if (error) {
      toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
      return;
    }
    await sendBookingEmails(data as unknown as KaraokeBooking, "cancelled");
    toast({ title: "Cancelled", description: "Guest and venue notified." });
    onSaved();
  };

  const set = <K extends keyof KaraokeBooking>(k: K, v: KaraokeBooking[K]) =>
    setForm({ ...form, [k]: v });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Edit booking
          </DialogTitle>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Field label="Date">
            <Input type="date" value={form.slot_date} onChange={(e) => set("slot_date", e.target.value)} />
          </Field>
          <Field label="Party size">
            <Input
              type="number" min={1}
              value={form.party_size}
              onChange={(e) => set("party_size", Math.max(1, Number(e.target.value) || 1))}
            />
          </Field>
          <Field label="Slot start">
            <Input
              type="time"
              value={startKey(form.slot_start)}
              onChange={(e) => set("slot_start", `${e.target.value}:00`)}
            />
          </Field>
          <Field label="Slot end">
            <Input
              type="time"
              value={startKey(form.slot_end)}
              onChange={(e) => set("slot_end", `${e.target.value}:00`)}
            />
          </Field>
          <Field label="First name">
            <Input value={form.guest_first_name} onChange={(e) => set("guest_first_name", e.target.value)} />
          </Field>
          <Field label="Last name">
            <Input value={form.guest_last_name ?? ""} onChange={(e) => set("guest_last_name", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input type="email" value={form.guest_email} onChange={(e) => set("guest_email", e.target.value)} />
          </Field>
          <Field label="Phone">
            <Input value={form.guest_phone ?? ""} onChange={(e) => set("guest_phone", e.target.value)} />
          </Field>
          <Field label="Food package">
            <Select
              value={form.food_package_id ?? "none"}
              onValueChange={(v) => set("food_package_id", v === "none" ? null : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {food.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Drink package">
            <Select
              value={form.drink_package_id ?? "none"}
              onValueChange={(v) => set("drink_package_id", v === "none" ? null : v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {drink.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set("status", v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => set("notes", e.target.value)}
              />
            </Field>
          </div>
        </div>

        <DialogFooter className="flex-wrap gap-2">
          <a
            href={`/town/karaoke/manage/${form.manage_token}`}
            target="_blank"
            rel="noreferrer"
            className="text-xs underline self-center mr-auto"
          >
            Open guest manage view
          </a>
          {cancellable && (
            <Button variant="destructive" onClick={cancel}>Cancel booking</Button>
          )}
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------ New booking dialog ------------ */

function NewBookingDialog({
  slot,
  packages,
  onClose,
  onCreated,
}: {
  slot: { date: Date; template: SlotTemplate } | null;
  packages: KaraokePackage[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [party, setParty] = useState(4);
  const [foodId, setFoodId] = useState<string | null>(null);
  const [drinkId, setDrinkId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (slot) {
      setFirst(""); setLast(""); setEmail(""); setPhone("");
      setParty(4); setFoodId(null); setDrinkId(null); setNotes("");
    }
  }, [slot]);

  if (!slot) return null;

  const food = packages.filter((p) => p.kind === "food");
  const drink = packages.filter((p) => p.kind === "drink");

  const submit = async () => {
    if (!first.trim() || !email.trim()) {
      toast({ title: "Missing details", description: "First name and email are required.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { booking_id } = await createBooking({
        slot_date: fmtDay(slot.date),
        slot_start: slot.template.start_time,
        party_size: party,
        guest_first_name: first.trim(),
        guest_last_name: last.trim() || undefined,
        guest_email: email.trim(),
        guest_phone: phone.trim() || undefined,
        food_package_id: foodId,
        drink_package_id: drinkId,
        notes: notes.trim() || undefined,
      });
      // Fetch the booking row to send emails.
      const { data } = await supabase
        .from("karaoke_bookings" as any)
        .select(
          "id, slot_date, slot_start, slot_end, guest_first_name, guest_last_name, guest_email, guest_phone, party_size, food_package_id, drink_package_id, food_package, drink_package, notes, status, deposit_status, manage_token, cancelled_at, cancelled_reason, created_at",
        )
        .eq("id", booking_id)
        .maybeSingle();
      if (data) await sendBookingEmails(data as unknown as KaraokeBooking, "created");
      toast({ title: "Booking created", description: "Guest and venue notified." });
      onCreated();
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message ?? "Could not create booking", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> New booking
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {format(slot.date, "EEEE d MMMM yyyy")} ·{" "}
            {formatSlotWindow(slot.template.start_time, slot.template.end_time)}
            {slot.template.label ? ` · ${slot.template.label}` : ""}
          </p>
        </DialogHeader>

        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <Field label="First name"><Input value={first} onChange={(e) => setFirst(e.target.value)} /></Field>
          <Field label="Last name"><Input value={last} onChange={(e) => setLast(e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Phone"><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
          <Field label="Party size">
            <Input type="number" min={1} value={party} onChange={(e) => setParty(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label="Food package">
            <Select value={foodId ?? "none"} onValueChange={(v) => setFoodId(v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {food.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Drink package">
            <Select value={drinkId ?? "none"} onValueChange={(v) => setDrinkId(v === "none" ? null : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {drink.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create booking"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
